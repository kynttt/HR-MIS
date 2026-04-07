"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import { convertApplicationToEmployeeAction } from "./actions";

type DepartmentOption = { id: string; department_name: string };

export function ConvertToEmployeeForm({ applicationId, departments }: { applicationId: string; departments: DepartmentOption[] }) {
  const [employeeIdCode, setEmployeeIdCode] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [positionTitle, setPositionTitle] = useState("");
  const [employmentType, setEmploymentType] = useState<"full_time" | "part_time" | "contractual" | "job_order">("full_time");
  const [employmentStatus, setEmploymentStatus] = useState<"active" | "probationary" | "resigned" | "retired" | "terminated">("active");
  const [hireDate, setHireDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4">
      <h3 className="text-sm font-semibold text-[#061b31]">Convert to Employee</h3>
      <Input placeholder="Employee ID code" value={employeeIdCode} onChange={(event) => setEmployeeIdCode(event.target.value)} />
      <Input placeholder="Position title" value={positionTitle} onChange={(event) => setPositionTitle(event.target.value)} />
      <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.department_name}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-2">
        <Select value={employmentType} onChange={(event) => setEmploymentType(event.target.value as "full_time" | "part_time" | "contractual" | "job_order")}>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contractual">Contractual</option>
          <option value="job_order">Job Order</option>
        </Select>
        <Select
          value={employmentStatus}
          onChange={(event) => setEmploymentStatus(event.target.value as "active" | "probationary" | "resigned" | "retired" | "terminated")}
        >
          <option value="active">Active</option>
          <option value="probationary">Probationary</option>
          <option value="resigned">Resigned</option>
          <option value="retired">Retired</option>
          <option value="terminated">Terminated</option>
        </Select>
      </div>
      <Input type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} />
      {message ? <p className="text-sm text-[#64748d]">{message}</p> : null}
      <Button
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await convertApplicationToEmployeeAction({
              application_id: applicationId,
              employee_id_code: employeeIdCode,
              department_id: departmentId,
              position_title: positionTitle,
              employment_type: employmentType,
              employment_status: employmentStatus,
              hire_date: hireDate
            });

            if (!result.ok) {
              setMessage(result.error);
              return;
            }

            setMessage(`Converted successfully. Employee ID: ${result.employeeId}`);
          });
        }}
        type="button"
      >
        {isPending ? "Converting..." : "Convert Applicant"}
      </Button>
    </div>
  );
}
