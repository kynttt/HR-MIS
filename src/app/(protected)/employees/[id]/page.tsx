import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { EmployeeDocumentUploadForm } from "@/features/employees/employee-document-upload-form";
import { getEmployeeDetails } from "@/features/employees/service";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeDetailsPage({ params }: Props) {
  const { id } = await params;

  try {
    const employee = await getEmployeeDetails(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#061b31]">Employee Details</h2>
            <p className="text-sm text-[#64748d]">{employee.employee_id_code} - {employee.first_name} {employee.last_name}</p>
          </div>
          <Link className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white" href={`/employees/${employee.id}/edit`}>
            Edit Employee
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <p><span className="font-medium">Email:</span> {employee.email}</p>
              <p><span className="font-medium">Phone:</span> {employee.phone ?? "-"}</p>
              <p><span className="font-medium">Role:</span> {employee.role_type}</p>
              <p><span className="font-medium">Department:</span> {employee.department_name ?? "-"}</p>
              <p><span className="font-medium">Employment:</span> {employee.employment_type} / {employee.employment_status}</p>
              <p><span className="font-medium">Hire Date:</span> {employee.hire_date}</p>
              <p><span className="font-medium">Position:</span> {employee.position_title}</p>
              <p><span className="font-medium">Campus:</span> {employee.campus ?? "-"}</p>
            </div>

            {employee.role_type === "faculty" && employee.faculty_profile ? (
              <div className="mt-4 rounded-md border border-[#e5edf5] p-3 text-sm">
                <p className="font-semibold">Faculty Profile</p>
                <p>Academic Rank: {employee.faculty_profile.academic_rank ?? "-"}</p>
                <p>Highest Education: {employee.faculty_profile.highest_education ?? "-"}</p>
                <p>Specialization: {employee.faculty_profile.specialization ?? "-"}</p>
                <p>Teaching Status: {employee.faculty_profile.teaching_status ?? "-"}</p>
                <p>Tenure Status: {employee.faculty_profile.tenure_status ?? "-"}</p>
              </div>
            ) : null}

            {employee.role_type === "staff" && employee.staff_profile ? (
              <div className="mt-4 rounded-md border border-[#e5edf5] p-3 text-sm">
                <p className="font-semibold">Staff Profile</p>
                <p>Staff Category: {employee.staff_profile.staff_category ?? "-"}</p>
                <p>Office Assignment: {employee.staff_profile.office_assignment ?? "-"}</p>
              </div>
            ) : null}

            <div className="mt-4">
              <p className="font-semibold">Documents</p>
              <ul className="mt-2 space-y-2 text-sm">
                {employee.documents.length === 0 ? <li className="text-[#64748d]">No employee documents uploaded yet.</li> : null}
                {employee.documents.map((document) => (
                  <li key={document.id} className="rounded border border-[#e5edf5] p-2">
                    {document.document_type} - {document.original_file_name ?? document.file_path}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <EmployeeDocumentUploadForm employeeId={employee.id} />
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
