"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";
import type { ApplicationDetails } from "./service";

import { applicationNoteSchema, applicationStatusSchema, convertApplicationSchema, publicApplicationSchema } from "./schema";

export async function getApplicationDetailsAction(applicationId: string): Promise<ApplicationDetails> {
  const supabase = await createClient();

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select(
      "id, status, submitted_at, converted_employee_id, applicants(*), job_openings(*, departments(*)), application_documents(*), application_notes(*), application_status_history(*)"
    )
    .eq("id", applicationId)
    .single();

  if (applicationError || !application) {
    throw new Error(applicationError?.message ?? "Application not found");
  }

  const applicantRow = Array.isArray(application.applicants) ? application.applicants[0] : application.applicants;

  if (!applicantRow) {
    throw new Error("Applicant not found");
  }

  return {
    id: application.id,
    status: application.status,
    submitted_at: application.submitted_at,
    converted_employee_id: application.converted_employee_id,
    applicant: {
      first_name: applicantRow.first_name,
      last_name: applicantRow.last_name,
      email: applicantRow.email,
      phone: applicantRow.phone ?? null
    },
    documents: (application.application_documents ?? []).map((document: { id: string; document_type: string; original_file_name: string | null; file_path: string }) => ({
      id: document.id,
      document_type: document.document_type,
      original_file_name: document.original_file_name ?? null,
      file_path: document.file_path
    })),
    notes: (application.application_notes ?? []).map((note: { id: string; note_text: string }) => ({
      id: note.id,
      note_text: note.note_text
    })),
    status_history: (application.application_status_history ?? []).map((item: { id: string; from_status: string | null; to_status: string; changed_at: string }) => ({
      id: item.id,
      from_status: item.from_status,
      to_status: item.to_status,
      changed_at: item.changed_at
    }))
  };
}

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "submitted" | "under_review" | "shortlisted" | "interview_scheduled" | "interviewed" | "for_requirements" | "accepted" | "rejected" | "withdrawn",
  remarks?: string
) {
  return updateApplicationStatusAction({ application_id: applicationId, status, remarks });
}

export async function submitApplicationAction(formData: FormData) {
  const supabase = await createClient();

  const parsed = publicApplicationSchema.parse({
    job_opening_id: getFormValue(formData, "job_opening_id"),
    first_name: getFormValue(formData, "first_name"),
    middle_name: getFormValue(formData, "middle_name") || undefined,
    last_name: getFormValue(formData, "last_name"),
    suffix: getFormValue(formData, "suffix") || undefined,
    email: getFormValue(formData, "email"),
    phone: getFormValue(formData, "phone") || undefined,
    address: getFormValue(formData, "address") || undefined
  });

  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .insert({
      first_name: parsed.first_name,
      middle_name: parsed.middle_name ?? null,
      last_name: parsed.last_name,
      suffix: parsed.suffix ?? null,
      email: parsed.email,
      phone: parsed.phone ?? null,
      address: parsed.address ?? null
    })
    .select("id")
    .single();

  if (applicantError) {
    redirect(`/apply?error=${encodeURIComponent(applicantError.message)}`);
  }

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .insert({
      applicant_id: applicant.id,
      job_opening_id: parsed.job_opening_id,
      status: "submitted"
    })
    .select("id")
    .single();

  if (applicationError) {
    redirect(`/apply?error=${encodeURIComponent(applicationError.message)}`);
  }

  const documentInputs: Array<{ field: string; document_type: "resume" | "diploma" | "tor" | "certificates" | "other" }> = [
    { field: "resume", document_type: "resume" },
    { field: "diploma", document_type: "diploma" },
    { field: "tor", document_type: "tor" },
    { field: "certificates", document_type: "certificates" },
    { field: "other", document_type: "other" }
  ];

  for (const item of documentInputs) {
    const entry = formData.get(item.field);
    if (!(entry instanceof File) || entry.size === 0) {
      continue;
    }

    const filePath = `${application.id}/${item.document_type}-${Date.now()}-${entry.name}`;
    const { error: uploadError } = await supabase.storage.from("application-documents").upload(filePath, entry, {
      upsert: false
    });

    if (!uploadError) {
      await supabase.from("application_documents").insert({
        application_id: application.id,
        document_type: item.document_type,
        file_path: filePath,
        original_file_name: entry.name,
        uploaded_by: null
      });
    }
  }

  await supabase.from("application_status_history").insert({
    application_id: application.id,
    from_status: null,
    to_status: "submitted",
    changed_by: null,
    remarks: "Initial public application submission"
  });

  await logAudit("submit_application", "applications", application.id, { email: parsed.email });

  redirect("/apply?success=1");
}

export async function updateApplicationStatusAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const parsed = applicationStatusSchema.parse(input);

  const { data: existing } = await supabase.from("applications").select("status").eq("id", parsed.application_id).single();

  const { error } = await supabase.from("applications").update({ status: parsed.status }).eq("id", parsed.application_id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await supabase.from("application_status_history").insert({
    application_id: parsed.application_id,
    from_status: existing?.status ?? null,
    to_status: parsed.status,
    changed_by: session?.user.id ?? null,
    remarks: parsed.remarks ?? null
  });

  await logAudit("update_application_status", "applications", parsed.application_id, { status: parsed.status });

  revalidatePath("/applications");
  revalidatePath(`/applications/${parsed.application_id}`);
  return { ok: true as const };
}

export async function addApplicationNoteAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const parsed = applicationNoteSchema.parse(input);

  const { error } = await supabase.from("application_notes").insert({
    application_id: parsed.application_id,
    note_text: parsed.note_text,
    created_by: session?.user.id ?? null
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await logAudit("add_application_note", "applications", parsed.application_id);

  revalidatePath(`/applications/${parsed.application_id}`);
  return { ok: true as const };
}

export async function uploadApplicationDocumentAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const applicationId = getFormValue(formData, "application_id");
  const documentType = getFormValue(formData, "document_type");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "File is required." };
  }

  const filePath = `${applicationId}/${documentType}-${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("application-documents").upload(filePath, file, {
    upsert: false
  });

  if (uploadError) {
    return { ok: false as const, error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("application_documents").insert({
    application_id: applicationId,
    document_type: documentType,
    file_path: filePath,
    original_file_name: file.name,
    uploaded_by: session?.user.id ?? null
  });

  if (insertError) {
    return { ok: false as const, error: insertError.message };
  }

  await logAudit("upload_application_document", "applications", applicationId, { document_type: documentType });

  revalidatePath(`/applications/${applicationId}`);
  return { ok: true as const };
}

export async function convertApplicationToEmployeeAction(input: unknown) {
  const parsedResult = convertApplicationSchema.safeParse(input);

  if (!parsedResult.success) {
    const firstError = parsedResult.error.issues[0];
    return { ok: false as const, error: firstError?.message ?? "Invalid conversion input." };
  }

  const parsed = parsedResult.data;
  const supabase = await createClient();

  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("id, status, applicant_id, job_openings(role_type)")
    .eq("id", parsed.application_id)
    .single();

  if (appError || !application) {
    return { ok: false as const, error: appError?.message ?? "Application not found." };
  }

  const jobRow = Array.isArray(application.job_openings) ? application.job_openings[0] : application.job_openings;

  if (application.status !== "accepted") {
    return { ok: false as const, error: "Only accepted applications can be converted." };
  }

  const { data: applicant, error: applicantError } = await supabase.from("applicants").select("*").eq("id", application.applicant_id).single();

  if (applicantError || !applicant) {
    return { ok: false as const, error: applicantError?.message ?? "Applicant not found." };
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .insert({
      employee_id_code: parsed.employee_id_code,
      source_application_id: parsed.application_id,
      first_name: applicant.first_name,
      middle_name: applicant.middle_name,
      last_name: applicant.last_name,
      suffix: applicant.suffix,
      email: applicant.email,
      phone: applicant.phone,
      sex: applicant.sex,
      civil_status: applicant.civil_status,
      birth_date: applicant.birth_date,
      employment_status: parsed.employment_status,
      employment_type: parsed.employment_type,
      role_type: jobRow?.role_type ?? "staff",
      department_id: parsed.department_id,
      position_title: parsed.position_title,
      hire_date: parsed.hire_date,
      address: applicant.address,
      is_active: true
    })
    .select("id, role_type")
    .single();

  if (employeeError || !employee) {
    return { ok: false as const, error: employeeError?.message ?? "Employee conversion failed." };
  }

  await supabase.from("applications").update({ converted_employee_id: employee.id }).eq("id", parsed.application_id);

  if (employee.role_type === "faculty") {
    await supabase.from("faculty_profiles").insert({ employee_id: employee.id });
  } else {
    await supabase.from("staff_profiles").insert({ employee_id: employee.id });
  }

  await logAudit("convert_application_to_employee", "applications", parsed.application_id, { employee_id: employee.id });

  revalidatePath("/applications");
  revalidatePath(`/applications/${parsed.application_id}`);
  revalidatePath("/employees");

  return { ok: true as const, employeeId: employee.id };
}
