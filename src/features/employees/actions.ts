"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { deleteFileFromCloudinary, uploadFileToCloudinary } from "@/lib/cloudinary/server";
import { logAudit } from "@/lib/utils/audit";

import { employeeUpdateSchema } from "./schema";
async function uploadEmployeeFile(params: {
  employeeId: string;
  documentType: string;
  file: File;
}): Promise<{ ok: true; filePath: string } | { ok: false; error: string }> {
  const { employeeId, documentType, file } = params;

  try {
    const uploaded = await uploadFileToCloudinary(file, `university-hrmis/employees/${employeeId}/${documentType}`);
    return { ok: true, filePath: uploaded.secureUrl };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Cloudinary upload failed." };
  }
}

export async function updateEmployeeAction(employeeId: string, input: unknown) {
  const parsed = employeeUpdateSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({
      employee_id_code: parsed.employee_id_code,
      first_name: parsed.first_name,
      middle_name: parsed.middle_name ?? null,
      last_name: parsed.last_name,
      suffix: parsed.suffix ?? null,
      email: parsed.email,
      phone: parsed.phone ?? null,
      sex: parsed.sex ?? null,
      civil_status: parsed.civil_status ?? null,
      birth_date: parsed.birth_date || null,
      employment_status: parsed.employment_status,
      employment_type: parsed.employment_type,
      role_type: parsed.role_type,
      department_id: parsed.department_id,
      position_title: parsed.position_title,
      hire_date: parsed.hire_date,
      campus: parsed.campus ?? null,
      address: parsed.address ?? null,
      emergency_contact_name: parsed.emergency_contact_name ?? null,
      emergency_contact_phone: parsed.emergency_contact_phone ?? null,
      notes: parsed.notes ?? null,
      is_active: parsed.is_active
    })
    .eq("id", employeeId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (parsed.role_type === "faculty") {
    await supabase
      .from("faculty_profiles")
      .upsert(
        {
          employee_id: employeeId,
          academic_rank: parsed.academic_rank ?? null,
          highest_education: parsed.highest_education ?? null,
          specialization: parsed.specialization ?? null,
          teaching_status: parsed.teaching_status ?? null,
          tenure_status: parsed.tenure_status ?? null
        },
        { onConflict: "employee_id" }
      );
  } else {
    await supabase
      .from("staff_profiles")
      .upsert(
        {
          employee_id: employeeId,
          staff_category: parsed.staff_category ?? null,
          office_assignment: parsed.office_assignment ?? null
        },
        { onConflict: "employee_id" }
      );
  }

  await logAudit("update_employee", "employees", employeeId, { role_type: parsed.role_type });

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath(`/employees/${employeeId}/edit`);
  return { ok: true as const };
}

export async function uploadEmployeeDocumentAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const employeeIdEntry = formData.get("employee_id");
  const documentTypeEntry = formData.get("document_type");
  const file = formData.get("file");

  const employeeId = typeof employeeIdEntry === "string" ? employeeIdEntry : "";
  const documentType = typeof documentTypeEntry === "string" ? documentTypeEntry : "other";

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "File is required." };
  }

  const uploadResult = await uploadEmployeeFile({
    employeeId,
    documentType,
    file
  });

  if (!uploadResult.ok) {
    return { ok: false as const, error: uploadResult.error };
  }

  const { error: insertError } = await supabase.from("employee_documents").insert({
    employee_id: employeeId,
    document_type: documentType,
    file_path: uploadResult.filePath,
    original_file_name: file.name,
    uploaded_by: session?.user.id ?? null
  });

  if (insertError) {
    return { ok: false as const, error: insertError.message };
  }

  await logAudit("upload_employee_document", "employees", employeeId, { document_type: documentType });

  revalidatePath(`/employees/${employeeId}`);
  return { ok: true as const };
}

export async function deleteEmployeeDocumentAction(formData: FormData) {
  const supabase = await createClient();

  const employeeIdEntry = formData.get("employee_id");
  const documentIdEntry = formData.get("document_id");

  const employeeId = typeof employeeIdEntry === "string" ? employeeIdEntry : "";
  const documentId = typeof documentIdEntry === "string" ? documentIdEntry : "";

  if (!employeeId || !documentId) {
    return { ok: false as const, error: "Missing document reference." };
  }

  const { data: document, error: fetchError } = await supabase
    .from("employee_documents")
    .select("id, file_path")
    .eq("id", documentId)
    .eq("employee_id", employeeId)
    .single();

  if (fetchError || !document) {
    return { ok: false as const, error: fetchError?.message ?? "Document not found." };
  }

  const { error: deleteError } = await supabase
    .from("employee_documents")
    .delete()
    .eq("id", documentId)
    .eq("employee_id", employeeId);

  if (deleteError) {
    return { ok: false as const, error: deleteError.message };
  }

  if (/^https?:\/\//i.test(document.file_path)) {
    try {
      await deleteFileFromCloudinary(document.file_path);
    } catch {
      // Best effort cleanup for external file storage.
    }
  } else {
    await supabase.storage.from("employee-documents").remove([document.file_path]);
  }

  await logAudit("delete_employee_document", "employees", employeeId, { document_id: documentId });

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);

  return { ok: true as const };
}

