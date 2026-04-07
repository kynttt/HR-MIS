"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { updateEmployeeAction } from "./actions";
import { type EmployeeUpdateInput, employeeUpdateSchema } from "./schema";

type DepartmentOption = {
  id: string;
  department_name: string;
};

type EmployeeEditFormProps = {
  employeeId: string;
  departments: DepartmentOption[];
  defaultValues: EmployeeUpdateInput;
};

export function EmployeeEditForm({ employeeId, departments, defaultValues }: EmployeeEditFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EmployeeUpdateInput>({
    resolver: zodResolver(employeeUpdateSchema),
    defaultValues
  });

  const roleType = form.watch("role_type");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setMessage(null);
      const result = await updateEmployeeAction(employeeId, values);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Employee profile updated.");
    });
  });

  return (
    <form className="space-y-4 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold text-[#061b31]">Edit Employee</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm">Employee Code</label>
          <Input {...form.register("employee_id_code")} />
        </div>
        <div>
          <label className="mb-1 block text-sm">First Name</label>
          <Input {...form.register("first_name")} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Last Name</label>
          <Input {...form.register("last_name")} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <Input type="email" {...form.register("email")} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Phone</label>
          <Input {...form.register("phone")} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Role Type</label>
          <Select {...form.register("role_type")}>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm">Department</label>
          <Select {...form.register("department_id")}>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.department_name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Employment Type</label>
          <Select {...form.register("employment_type")}>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contractual">Contractual</option>
            <option value="job_order">Job Order</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Employment Status</label>
          <Select {...form.register("employment_status")}>
            <option value="active">Active</option>
            <option value="probationary">Probationary</option>
            <option value="resigned">Resigned</option>
            <option value="retired">Retired</option>
            <option value="terminated">Terminated</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Hire Date</label>
          <Input type="date" {...form.register("hire_date")} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm">Position Title</label>
        <Input {...form.register("position_title")} />
      </div>
      {roleType === "faculty" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Academic Rank" {...form.register("academic_rank")} />
          <Input placeholder="Highest Education" {...form.register("highest_education")} />
          <Input placeholder="Specialization" {...form.register("specialization")} />
          <Input placeholder="Teaching Status" {...form.register("teaching_status")} />
          <Input placeholder="Tenure Status" {...form.register("tenure_status")} />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Staff Category" {...form.register("staff_category")} />
          <Input placeholder="Office Assignment" {...form.register("office_assignment")} />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm">Notes</label>
        <Textarea {...form.register("notes")} />
      </div>
      {message ? <p className="text-sm text-[#273951]">{message}</p> : null}
      <Button disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
