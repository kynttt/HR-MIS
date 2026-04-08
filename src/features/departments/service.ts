import { getCurrentUserOrganizationId } from "@/features/organizations/service";
import { createClient } from "@/lib/supabase/server";

export async function listDepartments() {
  const supabase = await createClient();
  const organizationId = await getCurrentUserOrganizationId();

  const { data, error } = await supabase
    .from("departments")
    .select("id, department_code, department_name, description, is_active, created_at")
    .eq("organization_id", organizationId)
    .order("department_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
