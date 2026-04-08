import { Badge } from "@/components/ui/badge";
import { DepartmentCreateForm } from "@/features/departments/department-create-form";
import { toggleDepartmentAction } from "@/features/departments/actions";
import { listDepartments } from "@/features/departments/service";
import { Building2 } from "lucide-react";

export default async function DepartmentsPage() {
  const departments = await listDepartments();

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#061b31]"><Building2 className="h-6 w-6" />Departments</h2>
      <DepartmentCreateForm />
      <div className="overflow-x-auto rounded-lg border border-[#e5edf5] bg-[#f6f9fc]">
        <table className="w-full text-sm">
          <thead className="bg-[#ffffff] text-left text-[#64748d]">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-[#64748d]" colSpan={4}>
                  No departments yet.
                </td>
              </tr>
            ) : (
              departments.map((department) => (
                <tr key={department.id} className="border-t border-[#e5edf5]">
                  <td className="px-3 py-2">{department.department_code}</td>
                  <td className="px-3 py-2">{department.department_name}</td>
                  <td className="px-3 py-2">{department.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}</td>
                  <td className="px-3 py-2">
                    <form action={toggleDepartmentAction.bind(null, department.id, !department.is_active)}>
                      <button className="text-sm text-brand-700" type="submit">
                        Set {department.is_active ? "Inactive" : "Active"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}





