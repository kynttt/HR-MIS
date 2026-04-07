import Link from "next/link"
import { listEmployees } from "@/features/employees/service"
import { listDepartments } from "@/features/departments/service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { SortHeader } from "@/components/ui/sort-header"
import { Users } from "lucide-react"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EmployeesPage({ searchParams }: Props) {
  const query = await searchParams

  const q = typeof query.q === "string" ? query.q : ""
  const roleType = typeof query.roleType === "string" ? query.roleType : ""
  const departmentId = typeof query.departmentId === "string" ? query.departmentId : ""
  const employmentStatus = typeof query.employmentStatus === "string" ? query.employmentStatus : ""
  const active = typeof query.active === "string" ? query.active : ""

  const [employees, departments] = await Promise.all([
    listEmployees({ q, roleType, departmentId, employmentStatus, active }),
    listDepartments()
  ])

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#061b31]"><Users className="h-6 w-6" />Employees</h2>

      <form className="grid gap-2 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4 md:grid-cols-5">
        <Input defaultValue={q} name="q" placeholder="Search name/email/code" />
        <Select defaultValue={roleType} name="roleType">
          <option value="">All roles</option>
          <option value="faculty">Faculty</option>
          <option value="staff">Staff</option>
        </Select>
        <Select defaultValue={departmentId} name="departmentId">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.department_name}</option>
          ))}
        </Select>
        <Select defaultValue={employmentStatus} name="employmentStatus">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="probationary">Probationary</option>
          <option value="resigned">Resigned</option>
          <option value="retired">Retired</option>
          <option value="terminated">Terminated</option>
        </Select>
        <Select defaultValue={active} name="active">
          <option value="">All</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </Select>
        <Button type="submit" size="sm">Apply Filters</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-[#e5edf5] bg-[#f6f9fc]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Code</TableHead>
              <SortHeader name="name" label="Name" currentSort="" currentOrder="asc" />
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <SortHeader name="status" label="Status" currentSort="" currentOrder="asc" />
              <SortHeader name="active" label="Active" currentSort="" currentOrder="asc" />
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-[#64748d] py-6">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="text-[#061b31]">{employee.employee_id_code}</TableCell>
                  <TableCell className="font-medium text-[#061b31]">
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell className="text-[#64748d]">{employee.email}</TableCell>
                  <TableCell className="text-[#64748d] capitalize">{employee.role_type}</TableCell>
                  <TableCell className="text-[#64748d]">{employee.department_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        employee.employment_status === "active"
                          ? "success"
                          : employee.employment_status === "probationary"
                          ? "warning"
                          : "muted"
                      }
                    >
                      {employee.employment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.is_active ? "success" : "muted"}>
                      {employee.is_active ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/employees/${employee.id}`} className="text-xs text-brand-700 hover:text-brand-500">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}




