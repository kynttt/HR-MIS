import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganizationId } from "@/features/organizations/service";
import type { AIConfiguration, AIProvider } from "@/features/jobs/types";

export const DEFAULT_AI_CONFIG: AIConfiguration = {
  provider: "openai",
  apiKey: "",
  model: "gpt-4o-mini",
  isEnabled: false,
  ollamaBaseUrl: "http://localhost:11434",
};

export async function getAIConfiguration(): Promise<AIConfiguration | null> {
  const organizationId = await getCurrentUserOrganizationId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_configurations")
    .select("provider, api_key, model, is_enabled, ollama_base_url")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    console.error("[getAIConfiguration] Supabase error:", error.message);
    throw new Error(`Failed to load AI configuration: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    provider: data.provider as AIProvider,
    apiKey: data.api_key ?? "",
    model: data.model ?? DEFAULT_AI_CONFIG.model,
    isEnabled: data.is_enabled ?? false,
    ollamaBaseUrl: data.ollama_base_url ?? DEFAULT_AI_CONFIG.ollamaBaseUrl,
  };
}
