import { createClient } from "@/lib/supabase/server";

export async function logAudit(action: string, entityType: string, entityId: string | null, metadata?: Record<string, string | number | boolean | null>) {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  await supabase.from("audit_logs").insert({
    actor_user_id: session?.user.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {}
  });
}