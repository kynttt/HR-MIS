import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { ApplicationDocumentUploadForm } from "@/features/applications/application-document-upload-form";
import { ApplicationNoteForm } from "@/features/applications/application-note-form";
import { ApplicationStatusForm } from "@/features/applications/application-status-form";
import { ConvertToEmployeeForm } from "@/features/applications/convert-to-employee-form";
import { ApplicationDocumentRemoveButton } from "@/features/applications/application-document-remove-button";
import { getApplicationDetails } from "@/features/applications/service";
import { listDepartments } from "@/features/departments/service";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailsPage({ params }: Props) {
  const { id } = await params;

  try {
    const [application, departments] = await Promise.all([getApplicationDetails(id), listDepartments()]);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#061b31]">Application Details</h2>
          <p className="text-sm text-[#64748d]">Track recruitment progress and conversion workflow.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <h3 className="text-lg font-semibold">Applicant Information</h3>
            <div className="mt-3 grid gap-2 text-sm text-[#273951] md:grid-cols-2">
              <p>
                <span className="font-medium">Name:</span> {application.applicant.first_name} {application.applicant.last_name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {application.applicant.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {application.applicant.phone ?? "-"}
              </p>
              <p>
                <span className="font-medium">Current Status:</span> {application.status}
              </p>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold">Application Notes</h4>
              <ul className="mt-2 space-y-2 text-sm text-[#273951]">
                {application.notes.length === 0 ? <li className="text-[#64748d]">No notes yet.</li> : null}
                {application.notes.map((note) => (
                  <li key={note.id} className="rounded border border-[#e5edf5] p-2">
                    {note.note_text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold">Status History</h4>
              <ul className="mt-2 space-y-2 text-sm text-[#273951]">
                {application.status_history.length === 0 ? <li className="text-[#64748d]">No status history yet.</li> : null}
                {application.status_history.map((item) => (
                  <li key={item.id} className="rounded border border-[#e5edf5] p-2">
                    {item.from_status ?? "-"} to {item.to_status} ({new Date(item.changed_at).toLocaleString()})
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold">Documents</h4>
              <ul className="mt-2 space-y-2 text-sm text-[#273951]">
                {application.documents.length === 0 ? <li className="text-[#64748d]">No documents uploaded yet.</li> : null}
                {application.documents.map((document) => (
                  <li key={document.id} className="rounded border border-[#e5edf5] p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium capitalize">{document.document_type}</p>
                        <p className="truncate text-xs text-[#64748d]">{document.original_file_name ?? document.file_path}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <a
                          href={document.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-[#533afd] hover:underline"
                        >
                          View
                        </a>
                        <ApplicationDocumentRemoveButton
                          applicationId={application.id}
                          documentId={document.id}
                          fileName={document.original_file_name ?? document.document_type}
                        />
                      </div>
                    </div>
                    {document.is_image ? (
                      <a href={document.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block max-w-full">
                        <Image
                          src={document.file_url}
                          alt={document.original_file_name ?? `${document.document_type} image`}
                          width={160}
                          height={96}
                          unoptimized
                          className="h-24 w-40 max-w-full rounded-md border border-[#e5edf5] bg-[#f8fafc] object-contain"
                        />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            {application.converted_employee_id ? (
              <p className="mt-4 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Converted to employee record. <Link className="underline" href={`/employees/${application.converted_employee_id}`}>Open employee profile</Link>
              </p>
            ) : null}
          </Card>

          <div className="space-y-4">
            <ApplicationStatusForm applicationId={application.id} currentStatus={application.status} />
            <ApplicationNoteForm applicationId={application.id} />
            <ApplicationDocumentUploadForm applicationId={application.id} />
            {application.status === "accepted" && !application.converted_employee_id ? (
              <ConvertToEmployeeForm
                applicationId={application.id}
                departments={departments.map((department) => ({ id: department.id, department_name: department.department_name }))}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}









