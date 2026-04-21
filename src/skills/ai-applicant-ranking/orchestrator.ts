"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { extractResumeText } from "./extractor";
import { buildRankingPrompt } from "./prompts";
import { callAICompletion } from "./completion";
import type { RankResult, RankOptions } from "./types";
import { z } from "zod";

const rankResponseSchema = z.object({
  score: z.number().min(0).max(100),
  highlights: z.array(z.string()).max(5),
  rationale: z.string().min(1),
});

function makeErrorResult(
  applicationId: string,
  score: number,
  rationale: string,
  provider = "",
  model = ""
): RankResult {
  return { applicationId, score, highlights: [], rationale, provider, model };
}

export async function rankSingleApplication(
  applicationId: string,
  options?: RankOptions
): Promise<RankResult | null> {
  const admin = createAdminClient();

  // 1. Load application + applicant + job + documents
  const { data: application } = await admin
    .from("applications")
    .select(
      "id, status, job_opening_id, organization_id, applicants(first_name, last_name, email), job_openings(job_title, description, qualifications), application_documents(id, document_type, file_path, original_file_name)"
    )
    .eq("id", applicationId)
    .single();

  if (!application) {
    console.error("[Orchestrator] Application not found:", applicationId);
    return null;
  }

  const jobRow = Array.isArray(application.job_openings)
    ? application.job_openings[0]
    : application.job_openings;

  if (!jobRow) {
    console.error(
      "[Orchestrator] Job opening not found for application:",
      applicationId
    );
    return null;
  }

  // 2. Load AI config
  const { data: aiConfig } = await admin
    .from("ai_configurations")
    .select("provider, api_key, model, is_enabled, ollama_base_url")
    .eq("organization_id", application.organization_id)
    .maybeSingle();

  if (!aiConfig || !aiConfig.is_enabled) {
    return null;
  }

  // 3. Check cached score
  if (!options?.forceRecompute) {
    const { data: existing } = await admin
      .from("application_ai_scores")
      .select("*")
      .eq("application_id", applicationId)
      .maybeSingle();
    if (existing) {
      return {
        applicationId: existing.application_id,
        score: Number(existing.score),
        highlights: existing.highlights,
        rationale: existing.rationale ?? "",
        provider: existing.provider,
        model: existing.model,
      };
    }
  }

  // 4. Find resume document
  const docs = Array.isArray(application.application_documents)
    ? application.application_documents
    : [application.application_documents].filter(Boolean);

  const resumeDoc = docs.find((d) => d?.document_type === "resume");
  if (!resumeDoc?.file_path) {
    return makeErrorResult(
      applicationId,
      0,
      "Could not read resume",
      aiConfig.provider,
      aiConfig.model
    );
  }

  // 5. Build file URL (Cloudinary or Supabase storage)
  const isAbsolute = /^https?:\/\//i.test(resumeDoc.file_path);
  const fileUrl = isAbsolute
    ? resumeDoc.file_path
    : admin.storage
        .from("application-documents")
        .getPublicUrl(resumeDoc.file_path).data.publicUrl;

  // 6. Extract text
  const resumeText = await extractResumeText(fileUrl);
  if (!resumeText) {
    return makeErrorResult(
      applicationId,
      0,
      "Could not read resume",
      aiConfig.provider,
      aiConfig.model
    );
  }

  // 7. Build prompt
  const prompt = buildRankingPrompt({
    jobTitle: jobRow.job_title,
    jobDescription: jobRow.description ?? null,
    jobQualifications: jobRow.qualifications ?? null,
    resumeText,
  });

  // 8. Call AI
  let completion: { text: string; tokensUsed?: number };
  try {
    completion = await callAICompletion({
      provider: aiConfig.provider as "openai" | "gemini" | "ollama",
      apiKey: aiConfig.api_key ?? undefined,
      model: aiConfig.model,
      baseUrl: aiConfig.ollama_base_url ?? undefined,
      prompt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI service unavailable";
    console.error("[Orchestrator] AI completion failed:", message);
    return makeErrorResult(
      applicationId,
      0,
      "AI service unavailable",
      aiConfig.provider,
      aiConfig.model
    );
  }

  // 9. Parse JSON
  let parsed: unknown;
  try {
    // Try to extract JSON from markdown code fences if present
    const jsonMatch = completion.text.match(
      /```(?:json)?\s*([\s\S]*?)```/
    );
    const jsonText = jsonMatch ? jsonMatch[1].trim() : completion.text.trim();
    parsed = JSON.parse(jsonText);
  } catch {
    // Retry once
    try {
      const retry = await callAICompletion({
        provider: aiConfig.provider as "openai" | "gemini" | "ollama",
        apiKey: aiConfig.api_key ?? undefined,
        model: aiConfig.model,
        baseUrl: aiConfig.ollama_base_url ?? undefined,
        prompt: prompt + "\n\nReturn strictly valid JSON.",
      });
      const jsonMatch = retry.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1].trim() : retry.text.trim();
      parsed = JSON.parse(jsonText);
    } catch {
      return makeErrorResult(
        applicationId,
        0,
        "AI evaluation failed",
        aiConfig.provider,
        aiConfig.model
      );
    }
  }

  // 10. Validate shape
  let validated: z.infer<typeof rankResponseSchema>;
  try {
    validated = rankResponseSchema.parse(parsed);
  } catch {
    return makeErrorResult(
      applicationId,
      0,
      "AI evaluation failed",
      aiConfig.provider,
      aiConfig.model
    );
  }

  // 11. Upsert score
  const { error: upsertError } = await admin
    .from("application_ai_scores")
    .upsert(
      {
        application_id: applicationId,
        job_opening_id: application.job_opening_id,
        organization_id: application.organization_id,
        score: validated.score,
        highlights: validated.highlights,
        rationale: validated.rationale,
        model: aiConfig.model,
        provider: aiConfig.provider,
        tokens_used: completion.tokensUsed ?? null,
      },
      { onConflict: "application_id" }
    );

  if (upsertError) {
    console.error(
      "[Orchestrator] Failed to upsert score:",
      upsertError.message
    );
  }

  return {
    applicationId,
    score: validated.score,
    highlights: validated.highlights,
    rationale: validated.rationale,
    provider: aiConfig.provider,
    model: aiConfig.model,
  };
}

export async function rankAllApplicationsForJob(
  jobOpeningId: string
): Promise<RankResult[]> {
  const admin = createAdminClient();

  const { data: applications } = await admin
    .from("applications")
    .select("id")
    .eq("job_opening_id", jobOpeningId)
    .in("status", ["submitted", "under_review"]);

  if (!applications || applications.length === 0) {
    return [];
  }

  const results: RankResult[] = [];
  for (const app of applications) {
    try {
      const result = await rankSingleApplication(app.id);
      if (result) results.push(result);
    } catch (error) {
      console.error(
        "[Orchestrator] Failed to rank application:",
        app.id,
        error
      );
    }
  }

  return results;
}
