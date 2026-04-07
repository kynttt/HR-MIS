import { notFound } from "next/navigation";

import { listDepartments } from "@/features/departments/service";
import { EmployeeEditForm } from "@/features/employees/employee-edit-form";
import { getEmployeeDetails } from "@/features/employees/service";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditEmployeePage({ params }: Props) {
  const { id } = await params;

  try {
    const [employee, departments] = await Promise.all([getEmployeeDetails(id), listDepartments()]);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#061b31]">Edit Employee</h2>
        <EmployeeEditForm
          defaultValues={{
            employee_id_code: employee.employee_id_code,
            first_name: employee.first_name,
            middle_name: employee.middle_name ?? undefined,
            last_name: employee.last_name,
            suffix: employee.suffix ?? undefined,
            email: employee.email,
            phone: employee.phone ?? undefined,
            sex: employee.sex ?? undefined,
            civil_status: employee.civil_status ?? undefined,
            birth_date: employee.birth_date ?? undefined,
            employment_status: employee.employment_status,
            employment_type: employee.employment_type,
            role_type: employee.role_type,
            department_id: employee.department_id,
            position_title: employee.position_title,
            hire_date: employee.hire_date,
            campus: employee.campus ?? undefined,
            address: employee.address ?? undefined,
            emergency_contact_name: employee.emergency_contact_name ?? undefined,
            emergency_contact_phone: employee.emergency_contact_phone ?? undefined,
            notes: employee.notes ?? undefined,
            is_active: employee.is_active,
            academic_rank: employee.faculty_profile?.academic_rank ?? undefined,
            highest_education: employee.faculty_profile?.highest_education ?? undefined,
            specialization: employee.faculty_profile?.specialization ?? undefined,
            teaching_status: employee.faculty_profile?.teaching_status ?? undefined,
            tenure_status: employee.faculty_profile?.tenure_status ?? undefined,
            staff_category: employee.staff_profile?.staff_category ?? undefined,
            office_assignment: employee.staff_profile?.office_assignment ?? undefined
          }}
          departments={departments.map((department) => ({ id: department.id, department_name: department.department_name }))}
          employeeId={employee.id}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
