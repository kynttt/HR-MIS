"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminRole } from "@/features/auth/service";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "@/lib/cloudinary/server";
import { logRateLimitBlockedEvent } from "@/lib/security/logging";
import { getRequestFingerprint } from "@/lib/security/request";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { validateDocumentFile } from "@/lib/security/upload";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";
import type { ApplicationDetails } from "./service";

import { applicationNoteSchema, applicationStatusSchema, convertApplicationSchema, publicApplicationSchema } from "./schema";

const APPLICATION_MANAGEMENT_ROLES = ["super_admin", "hr_admin", "department_admin"] as const;
const APPLICATION_DOCUMENT_TYPES = new Set(["resume", "diploma", "tor", "certificates", "other"]);

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isImagePath(value: string): boolean {
  const normalized = value.split("?")[0].toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif"].some((ext) => normalized.endsWith(ext));
}

async function cleanupCloudinaryUrls(urls: string[]) {
  for (const url of urls) {
    try {
      await deleteFileFromCloudinary(url);
    } catch (error) {
      console.error("Cloudinary cleanup failed", error);
    }
  }
}

export async function getApplicationDetailsAction(applicationId: string): Promise<ApplicationDetails> {
  await requireAdminRole(APPLICATION_MANAGEMENT_ROLES);

  const supabase = await createClient();

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select(
      "id, status, submitted_at, converted_employee_id, applicants(first_name, last_name, email, phone), application_documents(id, document_type, original_file_name, file_path), application_notes(id, note_text), application_status_history(id, from_status, to_status, changed_at)"
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
    documents: (application.application_documents ?? []).map((document: { id: string; document_type: string; original_file_name: string | null; file_path: string }) => {
      const fileUrl = isAbsoluteUrl(document.file_path)
        ? document.file_path
        : supabase.storage.from("application-documents").getPublicUrl(document.file_path).data.publicUrl;

      return {
        id: document.id,
        document_type: document.document_type,
        original_file_name: document.original_file_name ?? null,
        file_path: document.file_path,
        file_url: fileUrl,
        is_image: isImagePath(document.original_file_name ?? document.file_path)
      };
    }),
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

async function uploadApplicationFile(params: {
  applicationId: string;
  documentType: string;
  file: File;
}): Promise<{ ok: true; filePath: string } | { ok: false; error: string }> {
  const { applicationId, documentType, file } = params;

  try {
    const uploaded = await uploadFileToCloudinary(file, `university-hrmis/applications/${applicationId}/${documentType}`);
    return { ok: true, filePath: uploaded.secureUrl };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Cloudinary upload failed." };
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "submitted" | "under_review" | "shortlisted" | "interview_scheduled" | "interviewed" | "for_requirements" | "accepted" | "rejected" | "withdrawn",
  remarks?: string
) {
  return updateApplicationStatusAction({ application_id: applicationId, status, remarks });
}

export async function submitApplicationAction(formData: FormData) {
  const fingerprint = await getRequestFingerprint("apply");
  const globalRateLimitKey = `${fingerprint}:global`;
  const globalLimit = await enforceRateLimit({ key: globalRateLimitKey, max: 10, windowMs: 10 * 60_000 });
  if (!globalLimit.ok) {
    await logRateLimitBlockedEvent({
      scope: "apply.submit.global",
      key: globalRateLimitKey,
      retryAfterMs: globalLimit.retryAfterMs,
      remaining: globalLimit.remaining
    });
    redirect("/apply?error=Too%20many%20submissions.%20Please%20try%20again%20later.");
  }

  const supabase = await createClient();

  const parsedResult = publicApplicationSchema.safeParse({
    job_opening_id: getFormValue(formData, "job_opening_id"),
    first_name: getFormValue(formData, "first_name"),
    middle_name: getFormValue(formData, "middle_name") || undefined,
    last_name: getFormValue(formData, "last_name"),
    suffix: getFormValue(formData, "suffix") || undefined,
    email: getFormValue(formData, "email"),
    phone: getFormValue(formData, "phone") || undefined,
    address: getFormValue(formData, "address") || undefined
  });

  if (!parsedResult.success) {
    const firstIssue = parsedResult.error.issues[0];
    redirect(`/apply?error=${encodeURIComponent(firstIssue?.message ?? "Invalid submission data")}`);
  }

  const parsed = parsedResult.data;

  const emailRateLimitKey = `apply:email:${parsed.email.toLowerCase()}`;
  const emailLimit = await enforceRateLimit({
    key: emailRateLimitKey,
    max: 3,
    windowMs: 10 * 60_000
  });

  if (!emailLimit.ok) {
    await logRateLimitBlockedEvent({
      scope: "apply.submit.email",
      key: emailRateLimitKey,
      retryAfterMs: emailLimit.retryAfterMs,
      remaining: emailLimit.remaining
    });
    redirect("/apply?error=Too%20many%20attempts%20for%20this%20email.%20Please%20try%20again%20later.");
  }

  const uploadedCloudinaryUrls: string[] = [];
  let applicantId: string | null = null;
  let applicationId: string | null = null;

  try {
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

    if (applicantError || !applicant) {
      throw new Error(applicantError?.message ?? "Failed to create applicant record.");
    }

    applicantId = applicant.id;

    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .insert({
        applicant_id: applicant.id,
        job_opening_id: parsed.job_opening_id,
        status: "submitted"
      })
      .select("id")
      .single();

    if (applicationError || !application) {
      throw new Error(applicationError?.message ?? "Failed to create application record.");
    }

    applicationId = application.id;

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

      const fileValidation = validateDocumentFile(entry);
      if (!fileValidation.ok) {
        throw new Error(fileValidation.error);
      }

      const uploadResult = await uploadApplicationFile({
        applicationId: application.id,
        documentType: item.document_type,
        file: entry
      });

      if (!uploadResult.ok) {
        throw new Error(uploadResult.error);
      }

      uploadedCloudinaryUrls.push(uploadResult.filePath);

      const { error: documentInsertError } = await supabase.from("application_documents").insert({
        application_id: application.id,
        document_type: item.document_type,
        file_path: uploadResult.filePath,
        original_file_name: entry.name,
        uploaded_by: null
      });

      if (documentInsertError) {
        throw new Error(documentInsertError.message);
      }
    }

    const { error: statusHistoryError } = await supabase.from("application_status_history").insert({
      application_id: application.id,
      from_status: null,
      to_status: "submitted",
      changed_by: null,
      remarks: "Initial public application submission"
    });

    if (statusHistoryError) {
      throw new Error(statusHistoryError.message);
    }

    await logAudit("submit_application", "applications", application.id, { email: parsed.email }).catch((error) => {
      console.error("Audit log failed for submit_application", error);
    });

    redirect("/apply?success=1");
  } catch (error) {
    if (applicationId) {
      await supabase.from("application_documents").delete().eq("application_id", applicationId);
      await supabase.from("application_status_history").delete().eq("application_id", applicationId);
      await supabase.from("applications").delete().eq("id", applicationId);
    }

    if (applicantId) {
      await supabase.from("applicants").delete().eq("id", applicantId);
    }

    await cleanupCloudinaryUrls(uploadedCloudinaryUrls);

    const message = error instanceof Error ? error.message : "Failed to submit application.";
    redirect(`/apply?error=${encodeURIComponent(message)}`);
  }
}

export async function updateApplicationStatusAction(input: unknown) {
  await requireAdminRole(APPLICATION_MANAGEMENT_ROLES);

  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const parsedResult = applicationStatusSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: parsedResult.error.issues[0]?.message ?? "Invalid status payload." };
  }

  const parsed = parsedResult.data;

  const { data: existing, error: existingError } = await supabase.from("applications").select("status").eq("id", parsed.application_id).single();

  if (existingError) {
    return { ok: false as const, error: existingError.message };
  }

  const { error } = await supabase.from("applications").update({ status: parsed.status }).eq("id", parsed.application_id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const { error: historyError } = await supabase.from("application_status_history").insert({
    application_id: parsed.application_id,
    from_status: existing?.status ?? null,
    to_status: parsed.status,
    changed_by: session?.user.id ?? null,
    remarks: parsed.remarks ?? null
  });

  if (historyError) {
    return { ok: false as const, error: historyError.message };
  }

  await logAudit("update_application_status", "applications", parsed.application_id, { status: parsed.status });

  revalidatePath("/applications");
  revalidatePath(`/applications/${parsed.application_id}`);
  return { ok: true as const };
}

export async function addApplicationNoteAction(input: unknown) {
  await requireAdminRole(APPLICATION_MANAGEMENT_ROLES);

  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const parsedResult = applicationNoteSchema.safeParse(input);
  if (!parsedResult.success) {
    return { ok: false as const, error: parsedResult.error.issues[0]?.message ?? "Invalid note payload." };
  }

  const parsed = parsedResult.data;

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
  await requireAdminRole(APPLICATION_MANAGEMENT_ROLES);

  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const rateLimitKey = session?.user.id
    ? `application-doc-upload:user:${session.user.id}`
    : await getRequestFingerprint("application-doc-upload:anon");

  const rateLimit = await enforceRateLimit({ key: rateLimitKey, max: 30, windowMs: 60_000 });
  if (!rateLimit.ok) {
    await logRateLimitBlockedEvent({
      scope: "apply.document.upload",
      key: rateLimitKey,
      retryAfterMs: rateLimit.retryAfterMs,
      remaining: rateLimit.remaining,
      metadata: {
        hasSession: Boolean(session?.user.id)
      }
    });
    return { ok: false as const, error: "Too many upload attempts. Please try again later." };
  }

  const applicationId = getFormValue(formData, "application_id");
  const documentType = getFormValue(formData, "document_type");
  const file = formData.get("file");

  if (!applicationId) {
    return { ok: false as const, error: "Application id is required." };
  }

  if (!APPLICATION_DOCUMENT_TYPES.has(documentType)) {
    return { ok: false as const, error: "Invalid document type." };
  }

  const fileValidation = validateDocumentFile(file as File);
  if (!fileValidation.ok) {
    return { ok: false as const, error: fileValidation.error };
  }

  const uploadResult = await uploadApplicationFile({
    applicationId,
    documentType,
    file: file as File
  });

  if (!uploadResult.ok) {
    return { ok: false as const, error: uploadResult.error };
  }

  const { error: insertError } = await supabase.from("application_documents").insert({
    application_id: applicationId,
    document_type: documentType,
    file_path: uploadResult.filePath,
    original_file_name: (file as File).name,
    uploaded_by: session?.user.id ?? null
  });

  if (insertError) {
    await deleteFileFromCloudinary(uploadResult.filePath).catch((error) => {
      console.error("Application upload cleanup failed", error);
    });
    return { ok: false as const, error: insertError.message };
  }

  await logAudit("upload_application_document", "applications", applicationId, { document_type: documentType });

  revalidatePath(`/applications/${applicationId}`);
  return { ok: true as const };
}

export async function deleteApplicationDocumentAction(formData: FormData) {
  await requireAdminRole(APPLICATION_MANAGEMENT_ROLES);

  const supabase = await createClient();

  const applicationId = getFormValue(formData, "application_id");
  const documentId = getFormValue(formData, "document_id");

  if (!applicationId || !documentId) {
    return { ok: false as const, error: "Missing document reference." };
  }

  const { data: document, error: fetchError } = await supabase
    .from("application_documents")
    .select("id, file_path")
    .eq("id", documentId)
    .eq("application_id", applicationId)
    .single();

  if (fetchError || !document) {
    return { ok: false as const, error: fetchError?.message ?? "Document not found." };
  }

  const { error: deleteError } = await supabase
    .from("application_documents")
    .delete()
    .eq("id", documentId)
    .eq("application_id", applicationId);

  if (deleteError) {
    return { ok: false as const, error: deleteError.message };
  }

  if (/^https?:\/\//i.test(document.file_path)) {
    try {
      await deleteFileFromCloudinary(document.file_path);
    } catch (error) {
      console.error("Application document cleanup failed", error);
    }
  } else {
    const { error: storageDeleteError } = await supabase.storage.from("application-documents").remove([document.file_path]);
    if (storageDeleteError) {
      console.error("Application document storage cleanup failed", storageDeleteError);
    }
  }

  await logAudit("delete_application_document", "applications", applicationId, { document_id: documentId });

  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);

  return { ok: true as const };
}

export async function convertApplicationToEmployeeAction(input: unknown) {
  await requireAdminRole(APPLICATION_MANAGEMENT_ROLES);

  const parsedResult = convertApplicationSchema.safeParse(input);

  if (!parsedResult.success) {
    const firstError = parsedResult.error.issues[0];
    return { ok: false as const, error: firstError?.message ?? "Invalid conversion input." };
  }

  const parsed = parsedResult.data;
  const supabase = await createClient();

  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("id, status, applicant_id, converted_employee_id, job_openings(role_type)")
    .eq("id", parsed.application_id)
    .single();

  if (appError || !application) {
    return { ok: false as const, error: appError?.message ?? "Application not found." };
  }

  if (application.converted_employee_id) {
    return { ok: false as const, error: "Application is already converted." };
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

  const { error: appUpdateError } = await supabase.from("applications").update({ converted_employee_id: employee.id }).eq("id", parsed.application_id);
  if (appUpdateError) {
    await supabase.from("employees").delete().eq("id", employee.id);
    return { ok: false as const, error: appUpdateError.message };
  }

  const profileInsert =
    employee.role_type === "faculty"
      ? await supabase.from("faculty_profiles").insert({ employee_id: employee.id })
      : await supabase.from("staff_profiles").insert({ employee_id: employee.id });

  if (profileInsert.error) {
    await supabase.from("applications").update({ converted_employee_id: null }).eq("id", parsed.application_id);
    await supabase.from("employees").delete().eq("id", employee.id);
    return { ok: false as const, error: profileInsert.error.message };
  }

  await logAudit("convert_application_to_employee", "applications", parsed.application_id, { employee_id: employee.id });

  revalidatePath("/applications");
  revalidatePath(`/applications/${parsed.application_id}`);
  revalidatePath("/employees");

  return { ok: true as const, employeeId: employee.id };
}




