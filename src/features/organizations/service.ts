import { createClient } from "@/lib/supabase/server";

export type OrganizationContext = {
  id: string;
  slug: string;
  name: string;
};

export async function getCurrentUserOrganizationId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (error || !data?.organization_id) {
    throw new Error(error?.message ?? "Organization not found for current user.");
  }

  return data.organization_id;
}

export async function getOrganizationBySlug(slug: string): Promise<OrganizationContext | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name
  };
}

export async function getDefaultOrganization(): Promise<OrganizationContext> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No active organization configured.");
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name
  };
}

export async function resolvePublicOrganization(slug?: string): Promise<OrganizationContext> {
  if (slug) {
    const found = await getOrganizationBySlug(slug);
    if (!found) {
      throw new Error("Organization not found.");
    }

    return found;
  }

  return getDefaultOrganization();
}
