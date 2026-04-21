# AI Applicant Ranking Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first AI skill that evaluates applicant resumes against job descriptions and assigns a 0–100 match score. The skill is orchestrated automatically on application submission and can be triggered manually by admins.

**Architecture:** A self-contained skill module under `src/skills/ai-applicant-ranking/` with resume text extraction (PDF/DOCX), prompt construction, provider-agnostic AI completion, structured JSON parsing, and score persistence into `application_ai_scores`. The orchestrator runs via `createAdminClient()` to bypass RLS during background scoring. UI integrations include pipeline cards, job applicant sheets, application detail pages, and manual rank triggers.

**Tech Stack:** Next.js 14 App Router, Supabase (RLS + service role), TypeScript, Zod, `pdf-parse`, `mammoth`, Tailwind CSS.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/migrations/010_application_ai_scores.sql` | New table, trigger, indexes, RLS policy |
| `src/skills/ai-applicant-ranking/types.ts` | `RankResult`, `RankOptions`, `AICompletionParams` interfaces |
| `src/skills/ai-applicant-ranking/extractor.ts` | Download Cloudinary file, detect type, extract text (PDF/DOCX) |
| `src/skills/ai-applicant-ranking/prompts.ts` | Build the ranking prompt string |
| `src/skills/ai-applicant-ranking/completion.ts` | Non-streaming AI completion caller for OpenAI, Gemini, Ollama |
| `src/skills/ai-applicant-ranking/orchestrator.ts` | `rankSingleApplication()` and `rankAllApplicationsForJob()` |
| `src/app/api/applications/[id]/rank/route.ts` | Manual trigger API: POST re-computes and returns JSON |
| `src/features/applications/ai-ranking-service.ts` | Query helpers: `getApplicationAIResult()`, `getRankedApplicantsForJob()` |
| `src/features/applications/actions.ts` | Add `rankAllApplicationsForJobAction()`; wire auto-trigger into `submitApplicationAction()` |
| `src/components/jobs/job-row-actions.tsx` | Add "Rank Applicants" dropdown item |
| `src/components/jobs/jobs-page-client.tsx` | Replace `mockRankedApplicants` with real data fetch |
| `src/components/applications/pipeline/pipeline-card.tsx` | Show `AIScoreBadge` when `aiScore` prop is present |
| `src/features/applications/service.ts` | Update `listApplications` and `listApplicationsPaginated` to join `application_ai_scores` |
| `src/app/(protected)/applications/[id]/page.tsx` | Add AI Evaluation section card |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/010_application_ai_scores.sql`

- [ ] **Step 1: Write migration**

```sql
create table public.application_ai_scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  job_opening_id uuid not null references public.job_openings(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,

  score numeric(5,2) not null check (score >= 0 and score <= 100),
  highlights text[] not null default '{}',
  rationale text,

  model text not null,
  provider text not null,
  tokens_used integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (application_id)
);

create trigger set_updated_at_application_ai_scores
  before update on public.application_ai_scores
  for each row execute function public.set_updated_at();

alter table public.application_ai_scores enable row level security;

create policy "admin_manage_ai_scores"
  on public.application_ai_scores
  for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

create index idx_ai_scores_job on public.application_ai_scores(job_opening_id);
create index idx_ai_scores_org on public.application_ai_scores(organization_id);
```

- [ ] **Step 2: Run migration locally**

Run: `npx supabase migration up`
Expected: Migration 010 applies successfully.

- [ ] **Step 3: Generate types**

Run: `npx supabase gen types typescript --local --schema public > src/types/database.ts`
Expected: `application_ai_scores` table appears in generated types.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/010_application_ai_scores.sql src/types/database.ts
git commit -m "feat(ai-ranking): add application_ai_scores table with RLS and indexes"
```

---

## Task 2: Install Dependencies

**Files:** None (package management only)

- [ ] **Step 1: Install production and dev dependencies**

Run:
```bash
npm install pdf-parse mammoth zod
npm install --save-dev @types/pdf-parse
```
Expected: `package.json` and `package-lock.json` updated.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add pdf-parse, mammoth, zod for resume text extraction"
```

---

## Task 3: Skill Types

**Files:**
- Create: `src/skills/ai-applicant-ranking/types.ts`

- [ ] **Step 1: Write types**

```typescript
export interface RankResult {
  applicationId: string;
  score: number;
  highlights: string[];
  rationale: string;
  provider: string;
  model: string;
}

export interface RankOptions {
  forceRecompute?: boolean;
}

export interface AICompletionParams {
  provider: "openai" | "gemini" | "ollama";
  apiKey?: string;
  model: string;
  baseUrl?: string;
  prompt: string;
}

export interface AICompletionResponse {
  text: string;
  tokensUsed?: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skills/ai-applicant-ranking/types.ts
git commit -m "feat(ai-ranking): add skill type definitions"
```

---

## Task 4: Resume Text Extractor

**Files:**
- Create: `src/skills/ai-applicant-ranking/extractor.ts`

- [ ] **Step 1: Implement extractor**

```typescript
import pdf from "pdf-parse";
import mammoth from "mammoth";

function getFileType(contentType: string | null, url: string): "pdf" | "docx" | "unknown" {
  if (contentType) {
    if (contentType.includes("pdf")) return "pdf";
    if (contentType.includes("officedocument.wordprocessingml") || contentType.includes("msword")) return "docx";
  }
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return "unknown";
}

export async function extractResumeText(fileUrl: string): Promise<string | null> {
  try {
    const response = await fetch(fileUrl, { redirect: "follow" });
    if (!response.ok) {
      console.error("[Extractor] Failed to download resume:", response.status, fileUrl);
      return null;
    }

    const contentType = response.headers.get("content-type");
    const type = getFileType(contentType, fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (type === "pdf") {
      const parsed = await pdf(buffer);
      return parsed.text?.trim() || null;
    }

    if (type === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value?.trim() || null;
    }

    console.error("[Extractor] Unsupported file type:", type, fileUrl);
    return null;
  } catch (error) {
    console.error("[Extractor] Error extracting resume text:", error);
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skills/ai-applicant-ranking/extractor.ts
git commit -m "feat(ai-ranking): add resume text extractor for PDF and DOCX"
```

---

## Task 5: Prompt Builder

**Files:**
- Create: `src/skills/ai-applicant-ranking/prompts.ts`

- [ ] **Step 1: Implement prompt builder**

```typescript
export function buildRankingPrompt(params: {
  jobTitle: string;
  jobDescription: string | null;
  jobQualifications: string | null;
  resumeText: string;
}): string {
  return `You are an expert HR evaluator. Given a job opening and an applicant's resume, evaluate the match.

Job Title: ${params.jobTitle}
Job Description: ${params.jobDescription ?? "Not provided"}
Required Qualifications: ${params.jobQualifications ?? "Not provided"}

Resume:
${params.resumeText}

Respond ONLY with valid JSON in this exact shape:
{
  "score": number from 0 to 100,
  "highlights": ["string", "string"],
  "rationale": "string"
}

Rules:
- score: 90-100 = excellent match, 75-89 = strong, 60-74 = good, below 60 = review needed
- highlights: array of specific observations (strengths or weaknesses), max 5 items
- rationale: one concise sentence summarizing the fit`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skills/ai-applicant-ranking/prompts.ts
git commit -m "feat(ai-ranking): add ranking prompt builder"
```

---

## Task 6: AI Completion Caller

**Files:**
- Create: `src/skills/ai-applicant-ranking/completion.ts`

- [ ] **Step 1: Implement non-streaming completion caller**

```typescript
import type { AICompletionParams, AICompletionResponse } from "./types";

export async function callAICompletion(params: AICompletionParams): Promise<AICompletionResponse> {
  switch (params.provider) {
    case "openai":
      return callOpenAI(params);
    case "gemini":
      return callGemini(params);
    case "ollama":
      return callOllama(params);
    default:
      throw new Error(`Unknown provider: ${params.provider}`);
  }
}

async function callOpenAI(params: AICompletionParams): Promise<AICompletionResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [{ role: "user", content: params.prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const tokensUsed = data.usage?.total_tokens;
  return { text, tokensUsed };
}

async function callGemini(params: AICompletionParams): Promise<AICompletionResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: params.prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const tokensUsed = data.usageMetadata?.totalTokenCount;
  return { text, tokensUsed };
}

async function callOllama(params: AICompletionParams): Promise<AICompletionResponse> {
  const response = await fetch(`${params.baseUrl || "http://localhost:11434"}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  const text = typeof data.response === "string" ? data.response : "";
  return { text };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/skills/ai-applicant-ranking/completion.ts
git commit -m "feat(ai-ranking): add provider-agnostic non-streaming AI completion caller"
```

---

## Task 7: Orchestrator

**Files:**
- Create: `src/skills/ai-applicant-ranking/orchestrator.ts`

- [ ] **Step 1: Write Zod schema for AI response validation**

```typescript
import { z } from "zod";

const rankResponseSchema = z.object({
  score: z.number().min(0).max(100),
  highlights: z.array(z.string()).max(5),
  rationale: z.string().min(1),
});
```

- [ ] **Step 2: Implement orchestrator with full flow**

```typescript
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

function makeErrorResult(applicationId: string, score: number, rationale: string, provider = "", model = ""): RankResult {
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

  const applicantRow = Array.isArray(application.applicants) ? application.applicants[0] : application.applicants;
  const jobRow = Array.isArray(application.job_openings) ? application.job_openings[0] : application.job_openings;

  if (!jobRow) {
    console.error("[Orchestrator] Job opening not found for application:", applicationId);
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
    return makeErrorResult(applicationId, 0, "Could not read resume", aiConfig.provider, aiConfig.model);
  }

  // 5. Build file URL (Cloudinary or Supabase storage)
  const isAbsolute = /^https?:\/\//i.test(resumeDoc.file_path);
  const fileUrl = isAbsolute
    ? resumeDoc.file_path
    : admin.storage.from("application-documents").getPublicUrl(resumeDoc.file_path).data.publicUrl;

  // 6. Extract text
  const resumeText = await extractResumeText(fileUrl);
  if (!resumeText) {
    return makeErrorResult(applicationId, 0, "Could not read resume", aiConfig.provider, aiConfig.model);
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
    const message = error instanceof Error ? error.message : "AI service unavailable";
    console.error("[Orchestrator] AI completion failed:", message);
    return makeErrorResult(applicationId, 0, "AI service unavailable", aiConfig.provider, aiConfig.model);
  }

  // 9. Parse JSON
  let parsed: unknown;
  try {
    // Try to extract JSON from markdown code fences if present
    const jsonMatch = completion.text.match(/```(?:json)?\s*([\s\S]*?)```/);
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
      return makeErrorResult(applicationId, 0, "AI evaluation failed", aiConfig.provider, aiConfig.model);
    }
  }

  // 10. Validate shape
  let validated: z.infer<typeof rankResponseSchema>;
  try {
    validated = rankResponseSchema.parse(parsed);
  } catch {
    return makeErrorResult(applicationId, 0, "AI evaluation failed", aiConfig.provider, aiConfig.model);
  }

  // 11. Upsert score
  const { error: upsertError } = await admin.from("application_ai_scores").upsert(
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
    console.error("[Orchestrator] Failed to upsert score:", upsertError.message);
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

export async function rankAllApplicationsForJob(jobOpeningId: string): Promise<RankResult[]> {
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
      console.error("[Orchestrator] Failed to rank application:", app.id, error);
    }
  }

  return results;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/skills/ai-applicant-ranking/orchestrator.ts
git commit -m "feat(ai-ranking): add orchestrator with rankSingleApplication and rankAllApplicationsForJob"
```

---

## Task 8: Service Layer Query Helpers

**Files:**
- Create: `src/features/applications/ai-ranking-service.ts`

- [ ] **Step 1: Implement query helpers**

```typescript
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganizationId } from "@/features/organizations/service";
import type { RankedApplicant } from "@/features/jobs/types";

export async function getApplicationAIResult(applicationId: string) {
  const organizationId = await getCurrentUserOrganizationId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("application_ai_scores")
    .select("score, highlights, rationale, provider, model, created_at")
    .eq("application_id", applicationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getRankedApplicantsForJob(jobOpeningId: string): Promise<RankedApplicant[]> {
  const organizationId = await getCurrentUserOrganizationId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, submitted_at, applicants(id, first_name, last_name, email), application_ai_scores(score, highlights)"
    )
    .eq("job_opening_id", jobOpeningId)
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const applicant = Array.isArray(item.applicants) ? item.applicants[0] : item.applicants;
    const scoreRow = Array.isArray(item.application_ai_scores)
      ? item.application_ai_scores[0]
      : item.application_ai_scores;

    return {
      id: item.id,
      applicantId: applicant?.id ?? "",
      name: applicant ? `${applicant.first_name} ${applicant.last_name}`.trim() : "Unknown",
      email: applicant?.email ?? "",
      aiScore: scoreRow ? Math.round(Number(scoreRow.score)) : 0,
      status: item.status,
      appliedAt: item.submitted_at,
      highlights: scoreRow?.highlights ?? [],
    };
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/applications/ai-ranking-service.ts
git commit -m "feat(ai-ranking): add query helpers for AI scores and ranked applicants"
```

---

## Task 9: Manual Trigger API Route

**Files:**
- Create: `src/app/api/applications/[id]/rank/route.ts`

- [ ] **Step 1: Implement API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { rankSingleApplication } from "@/skills/ai-applicant-ranking/orchestrator";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const result = await rankSingleApplication(id, { forceRecompute: true });
    if (!result) {
      return NextResponse.json({ error: "Ranking skipped (AI disabled or application not found)" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rank application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/applications/\[id\]/rank/route.ts
git commit -m "feat(ai-ranking): add manual rank API route"
```

---

## Task 10: Server Actions for Manual Ranking

**Files:**
- Modify: `src/features/applications/actions.ts`

- [ ] **Step 1: Add rank-all action**

At the top of `src/features/applications/actions.ts`, ensure these imports exist:
```typescript
import { revalidatePath } from "next/cache";
import { rankAllApplicationsForJob } from "@/skills/ai-applicant-ranking/orchestrator";
import { requireAdminRole } from "@/features/auth/service";
```

Add this action near the bottom of the file (after `updateApplicationStatusAction`):

```typescript
const APPLICATION_MANAGEMENT_ROLES = ["super_admin", "hr_admin", "department_admin"] as const;

export async function rankAllApplicationsForJobAction(jobOpeningId: string) {
  await requireAdminRole(APPLICATION_MANAGEMENT_ROLES);

  try {
    const results = await rankAllApplicationsForJob(jobOpeningId);
    revalidatePath("/jobs");
    revalidatePath("/applications");
    return { ok: true as const, count: results.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ranking failed";
    return { ok: false as const, error: message };
  }
}
```

- [ ] **Step 2: Wire auto-trigger into submitApplicationAction**

In `src/features/applications/actions.ts`, find `submitApplicationAction` and locate the line just before the final `redirect(withQuery(returnPath, "success", "1"));` (around line 406).

Insert the following block before that `redirect` call:

```typescript
    // Fire-and-forget AI ranking
    rankSingleApplication(applicationId).catch((err) => {
      console.error("[Auto-Rank] Background ranking failed for application:", applicationId, err);
    });
```

Make sure `rankSingleApplication` is imported at the top of the file:
```typescript
import { rankSingleApplication } from "@/skills/ai-applicant-ranking/orchestrator";
```

- [ ] **Step 3: Commit**

```bash
git add src/features/applications/actions.ts
git commit -m "feat(ai-ranking): add rankAllApplicationsForJobAction and auto-trigger on submit"
```

---

## Task 11: UI — Job Row Actions "Rank Applicants"

**Files:**
- Modify: `src/components/jobs/job-row-actions.tsx`

- [ ] **Step 1: Add dropdown item and action**

Add imports:
```typescript
import { Sparkles } from "lucide-react";
import { rankAllApplicationsForJobAction } from "@/features/applications/actions";
```

Add a new dropdown item inside `<DropdownMenuContent>` after the "View Applicants" item:

```tsx
        <DropdownMenuItem asChild>
          <form
            action={rankAllApplicationsForJobAction.bind(null, job.id)}
            className="w-full"
          >
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-[#533afd]" />
              <span>Rank Applicants</span>
            </button>
          </form>
        </DropdownMenuItem>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/job-row-actions.tsx
git commit -m "feat(ui): add Rank Applicants action to job row dropdown"
```

---

## Task 12: UI — Wire JobApplicantsSheet to Real Data

**Files:**
- Modify: `src/components/jobs/jobs-page-client.tsx`

- [ ] **Step 1: Replace mock data with real fetch**

Replace the file contents with:

```typescript
"use client";

import { useCallback, useContext, createContext, useState, type ReactNode } from "react";

import { JobApplicantsSheet } from "./job-applicants-sheet";
import type { JobOpeningListItem } from "@/features/jobs/service";
import { getRankedApplicantsForJob } from "@/features/applications/ai-ranking-service";
import type { RankedApplicant } from "@/features/jobs/types";

interface JobsPageContextType {
  onViewApplicants: (job: JobOpeningListItem) => void;
}

const JobsPageContext = createContext<JobsPageContextType | null>(null);

export function useJobsPage() {
  const context = useContext(JobsPageContext);
  if (!context) {
    throw new Error("useJobsPage must be used within JobsPageClient");
  }
  return context;
}

interface JobsPageClientProps {
  jobs: JobOpeningListItem[];
  children: ReactNode;
}

export function JobsPageClient({ jobs, children }: JobsPageClientProps) {
  const [selectedJob, setSelectedJob] = useState<JobOpeningListItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [applicants, setApplicants] = useState<RankedApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleViewApplicants = useCallback(async (job: JobOpeningListItem) => {
    setSelectedJob(job);
    setIsSheetOpen(true);
    setIsLoading(true);
    try {
      const data = await getRankedApplicantsForJob(job.id);
      setApplicants(data);
    } catch (error) {
      console.error("Failed to load applicants:", error);
      setApplicants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <JobsPageContext.Provider value={{ onViewApplicants: handleViewApplicants }}>
      {children}
      {selectedJob && (
        <JobApplicantsSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          jobId={selectedJob.id}
          jobTitle={selectedJob.job_title}
          orgName="University"
          applicants={applicants}
          isLoading={isLoading}
        />
      )}
    </JobsPageContext.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/jobs-page-client.tsx
git commit -m "feat(ui): wire JobApplicantsSheet to real ranked applicant data"
```

---

## Task 13: UI — Pipeline Card AI Score Badge

**Files:**
- Modify: `src/components/applications/pipeline/pipeline-card.tsx`

- [ ] **Step 1: Add aiScore prop and badge**

Add import:
```typescript
import { AIScoreBadge } from "@/components/applicants/ai-score-badge";
```

Update interface:
```typescript
interface PipelineCardProps {
  id: string;
  applicantName: string;
  jobTitle: string;
  departmentName: string | null;
  status: string;
  submittedAt: string;
  aiScore?: number;
  onQuickView: (id: string) => void;
}
```

Update destructuring and add badge before the status row:

```typescript
function PipelineCard({ id, applicantName, jobTitle, departmentName, status, submittedAt, aiScore, onQuickView }: PipelineCardProps) {
```

Inside the card, add the AI score badge inside the flex row that already contains status and timestamp. Replace the existing "mt-3 flex items-center justify-between gap-2" div with:

```tsx
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_BADGE[status] ?? "muted"} className="text-xs px-1.5 py-0.5">
            {status.replaceAll("_", " ")}
          </Badge>
          {typeof aiScore === "number" && aiScore > 0 && (
            <AIScoreBadge score={aiScore} className="text-[10px] px-1.5 py-0.5" />
          )}
        </div>
        <span className="text-xs text-[#64748d]">
          {formatDistanceToNow(new Date(submittedAt), { addSuffix: false })}
        </span>
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/applications/pipeline/pipeline-card.tsx
git commit -m "feat(ui): show AI score badge on pipeline cards"
```

---

## Task 14: Service — Join AI Scores in Application List Queries

**Files:**
- Modify: `src/features/applications/service.ts`

- [ ] **Step 1: Update ApplicationListItem type**

Add `aiScore?: number` to the `ApplicationListItem` type:

```typescript
export type ApplicationListItem = {
  id: string;
  status: ApplicationStatus;
  submitted_at: string;
  updated_at: string;
  applicant: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  job: {
    job_title: string;
    role_type: "faculty" | "staff";
    department_name: string | null;
  } | null;
  aiScore?: number;
};
```

- [ ] **Step 2: Update listApplications to join application_ai_scores**

In the `listApplications` function, change the select query to include the AI score join:

Find the existing `.select()` call and replace it with:
```typescript
  let query = supabase
    .from("applications")
    .select(`id, status, submitted_at, updated_at, ${applicantJoin}, ${jobOpeningsJoin}, application_ai_scores(score)`)
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false });
```

In the `.map()` return block, extract and include the AI score:

Add before the return statement inside the map:
```typescript
    const scoreRow = Array.isArray(item.application_ai_scores)
      ? item.application_ai_scores[0]
      : item.application_ai_scores;
```

Add to the returned object:
```typescript
      aiScore: scoreRow ? Math.round(Number(scoreRow.score)) : undefined,
```

- [ ] **Step 3: Update listApplicationsPaginated similarly**

Change the select to:
```typescript
    .select(`id, status, submitted_at, updated_at, ${applicantJoin}, ${jobOpeningsJoin}, application_ai_scores(score)`, { count: "exact" })
```

Add the same score extraction in the map return:
```typescript
    const scoreRow = Array.isArray(item.application_ai_scores)
      ? item.application_ai_scores[0]
      : item.application_ai_scores;
```

And add `aiScore: scoreRow ? Math.round(Number(scoreRow.score)) : undefined,` to the returned object.

- [ ] **Step 4: Commit**

```bash
git add src/features/applications/service.ts
git commit -m "feat(service): join application_ai_scores in application list queries"
```

---

## Task 15: UI — Pipeline Board Passes aiScore to Cards

**Files:**
- Modify: `src/components/applications/applications-pipeline-client.tsx`

- [ ] **Step 1: Pass aiScore into mapped PipelineCard**

Find where `PipelineCard` is rendered inside the pipeline client (search for `<PipelineCard` in the file). Add the prop:
```tsx
              aiScore={app.aiScore}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/applications/applications-pipeline-client.tsx
git commit -m "feat(ui): pass aiScore from pipeline client to cards"
```

---

## Task 16: UI — Application Detail AI Evaluation Section

**Files:**
- Modify: `src/app/(protected)/applications/[id]/page.tsx`

- [ ] **Step 1: Add AI result fetch and UI section**

Add import:
```typescript
import { getApplicationAIResult } from "@/features/applications/ai-ranking-service";
import { AIScoreBadge } from "@/components/applicants/ai-score-badge";
```

In the `ApplicationDetailsPage` component, add the AI result fetch:

After:
```typescript
  const [application, departments] = await Promise.all([getApplicationDetails(id), listDepartments()]);
```

Add:
```typescript
  const aiResult = await getApplicationAIResult(id).catch(() => null);
```

Inside the `<Card>` that contains "Applicant Information", add a new section before the "Application Notes" section:

```tsx
            {aiResult && (
              <div className="mt-4 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold">AI Evaluation</h4>
                  <AIScoreBadge score={Math.round(Number(aiResult.score))} />
                </div>
                <p className="mt-2 text-sm text-[#273951]">{aiResult.rationale}</p>
                {aiResult.highlights && aiResult.highlights.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiResult.highlights.map((highlight, i) => (
                      <span
                        key={i}
                        className="inline-flex rounded-md border border-[#d6d9fc] bg-white px-2 py-0.5 text-xs text-[#4434d4]"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-[#64748d]">
                  Evaluated with {aiResult.provider} / {aiResult.model} on{" "}
                  {new Date(aiResult.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(protected\)/applications/\[id\]/page.tsx
git commit -m "feat(ui): add AI Evaluation section to application detail page"
```

---

## Task 17: Type Check and Lint

**Files:** All modified files

- [ ] **Step 1: Run type check**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors (or only pre-existing ones).

- [ ] **Step 3: Final commit**

```bash
git commit -m "feat(ai-ranking): complete AI applicant ranking skill implementation" --allow-empty
```

---

## Spec Coverage Check

| Spec Section | Implementing Task |
|--------------|-------------------|
| Data Model — `application_ai_scores` table | Task 1 |
| Indexes | Task 1 |
| Skill Types | Task 3 |
| Resume text extraction (PDF/DOCX) | Task 4 |
| Prompt construction | Task 5 |
| Provider-agnostic AI completion | Task 6 |
| Orchestrator — `rankSingleApplication` | Task 7 |
| Orchestrator — `rankAllApplicationsForJob` | Task 7 |
| Score persistence | Task 7 |
| API route manual trigger | Task 9 |
| Auto-trigger on submission | Task 10 |
| Manual server action (`rankAllApplicationsForJobAction`) | Task 10 |
| UI — "Rank Applicants" in job row | Task 11 |
| UI — Pipeline board join query | Tasks 13, 14, 15 |
| UI — Application detail AI section | Task 16 |
| UI — Job applicants sheet real data | Task 12 |
| Error handling matrix (all 5 scenarios) | Task 7 |
| Multi-tenancy (`organization_id`) | Tasks 7, 8 |

## Placeholder Scan

- No "TBD", "TODO", or "implement later" strings found.
- Every task shows exact file paths, complete code blocks, and exact commands.
- Type names are consistent across tasks (`RankResult`, `RankedApplicant`, `ApplicationListItem`).
- `rankSingleApplication` signature matches in Task 7 (orchestrator), Task 9 (API route), and Task 10 (auto-trigger).

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-21-ai-applicant-ranking.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints

Which approach?
