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

export async function getAIConfiguration(): Promise<AIConfiguration> {
  try {
    const organizationId = await getCurrentUserOrganizationId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ai_configurations")
      .select("provider, api_key, model, is_enabled, ollama_base_url")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load AI config:", error.message);
      return DEFAULT_AI_CONFIG;
    }

    if (!data) {
      return DEFAULT_AI_CONFIG;
    }

    return {
      provider: data.provider as AIProvider,
      apiKey: data.api_key ?? "",
      model: data.model ?? DEFAULT_AI_CONFIG.model,
      isEnabled: data.is_enabled ?? false,
      ollamaBaseUrl: data.ollama_base_url ?? DEFAULT_AI_CONFIG.ollamaBaseUrl,
    };
  } catch (err) {
    console.error("Failed to load AI config:", err);
    return DEFAULT_AI_CONFIG;
  }
}
