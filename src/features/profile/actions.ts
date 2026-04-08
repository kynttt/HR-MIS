"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/service";
import { createClient } from "@/lib/supabase/server";

import { updatePasswordSchema, updateProfileDetailsSchema } from "./schema";

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getSafeReturnPath(formData: FormData): string {
  const raw = getFormValue(formData, "return_to");
  if (!raw || !raw.startsWith("/")) {
    return "/profile/settings";
  }

  return raw;
}

function withQuery(path: string, key: "success" | "error", value: string): string {
  const [pathname, rawQuery = ""] = path.split("?");
  const params = new URLSearchParams(rawQuery);
  params.set(key, value);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function optionalOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateProfileDetailsAction(formData: FormData) {
  const returnPath = getSafeReturnPath(formData);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  const parsed = updateProfileDetailsSchema.safeParse({
    full_name: getFormValue(formData, "full_name"),
    has_applicant_profile: getFormValue(formData, "has_applicant_profile") || "0",
    first_name: getFormValue(formData, "first_name") || undefined,
    middle_name: getFormValue(formData, "middle_name") || undefined,
    last_name: getFormValue(formData, "last_name") || undefined,
    suffix: getFormValue(formData, "suffix") || undefined,
    phone: getFormValue(formData, "phone") || undefined,
    address: getFormValue(formData, "address") || undefined,
    birth_date: getFormValue(formData, "birth_date") || undefined,
    sex: getFormValue(formData, "sex") || undefined,
    civil_status: getFormValue(formData, "civil_status") || undefined
  });

  if (!parsed.success) {
    redirect(withQuery(returnPath, "error", parsed.error.issues[0]?.message ?? "Invalid profile details."));
  }

  const payload = parsed.data;
  const firstName = payload.first_name?.trim() ?? "";
  const lastName = payload.last_name?.trim() ?? "";

  if (payload.has_applicant_profile === "1" && (!firstName || !lastName)) {
    redirect(withQuery(returnPath, "error", "First name and last name are required."));
  }

  const supabase = await createClient();

  const { error: profileError } = await supabase.from("profiles").update({ full_name: payload.full_name }).eq("id", user.id);

  if (profileError) {
    redirect(withQuery(returnPath, "error", profileError.message));
  }

  await supabase.auth.updateUser({
    data: {
      full_name: payload.full_name
    }
  });

  if (payload.has_applicant_profile === "1") {
    const { error: applicantError } = await supabase
      .from("applicants")
      .update({
        first_name: firstName,
        middle_name: optionalOrNull(payload.middle_name ?? ""),
        last_name: lastName,
        suffix: optionalOrNull(payload.suffix ?? ""),
        email: user.email?.trim().toLowerCase() ?? "",
        phone: optionalOrNull(payload.phone ?? ""),
        address: optionalOrNull(payload.address ?? ""),
        birth_date: optionalOrNull(payload.birth_date ?? ""),
        sex: optionalOrNull(payload.sex ?? ""),
        civil_status: optionalOrNull(payload.civil_status ?? "")
      })
      .eq("auth_user_id", user.id);

    if (applicantError) {
      redirect(withQuery(returnPath, "error", applicantError.message));
    }
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  revalidatePath("/profile/applications");

  redirect(withQuery(returnPath, "success", "Profile details updated."));
}

export async function updatePasswordAction(formData: FormData) {
  const returnPath = getSafeReturnPath(formData);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  const parsed = updatePasswordSchema.safeParse({
    new_password: getFormValue(formData, "new_password"),
    confirm_password: getFormValue(formData, "confirm_password")
  });

  if (!parsed.success) {
    redirect(withQuery(returnPath, "error", parsed.error.issues[0]?.message ?? "Invalid password input."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });

  if (error) {
    redirect(withQuery(returnPath, "error", error.message));
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  redirect(withQuery(returnPath, "success", "Password updated successfully."));
}
