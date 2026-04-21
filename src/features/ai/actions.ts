"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganizationId } from "@/features/organizations/service";
import { logAudit } from "@/lib/utils/audit";
import { requireAdminRole } from "@/features/auth/service";
import type { AIConfiguration } from "@/features/jobs/types";

const AI_ADMIN_ROLES = ["super_admin", "hr_admin"] as const;

export async function saveAIConfigurationAction(config: AIConfiguration) {
  await requireAdminRole(AI_ADMIN_ROLES);

  const organizationId = await getCurrentUserOrganizationId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("ai_configurations")
    .upsert(
      {
        organization_id: organizationId,
        provider: config.provider,
        api_key: config.apiKey ?? null,
        model: config.model,
        is_enabled: config.isEnabled,
        ollama_base_url: config.ollamaBaseUrl ?? "http://localhost:11434",
      },
      { onConflict: "organization_id" }
    );

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await logAudit("save_ai_configuration", "ai_configurations", organizationId, {
    provider: config.provider,
    model: config.model,
    is_enabled: config.isEnabled,
  });

  revalidatePath("/ai-config");
  revalidatePath("/ai-playground");

  return { ok: true as const };
}
