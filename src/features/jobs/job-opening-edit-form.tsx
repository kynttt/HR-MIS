"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { updateJobOpeningAction } from "./actions";
import { type JobOpeningInput, jobOpeningSchema } from "./schema";

type DepartmentOption = {
  id: string;
  department_name: string;
};

type JobOpeningEditFormProps = {
  jobId: string;
  departments: DepartmentOption[];
  defaultValues: JobOpeningInput;
};

export function JobOpeningEditForm({ jobId, departments, defaultValues }: JobOpeningEditFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<JobOpeningInput>({
    resolver: zodResolver(jobOpeningSchema),
    defaultValues
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setMessage(null);
      const result = await updateJobOpeningAction(jobId, values);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      router.push("/jobs?updated=1");
    });
  });

  return (
    <form className="grid gap-3 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4" onSubmit={onSubmit}>
      <h3 className="text-lg font-semibold text-[#061b31]">Edit Job Opening</h3>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]">Job Title</label>
        <Input {...form.register("job_title")} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#273951]">Department</label>
          <Select {...form.register("department_id")}>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.department_name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#273951]">Role Type</label>
          <Select {...form.register("role_type")}>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#273951]">Employment Type</label>
          <Select {...form.register("employment_type")}>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contractual">Contractual</option>
            <option value="job_order">Job Order</option>
          </Select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]">Description</label>
        <Textarea {...form.register("description")} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]">Qualifications</label>
        <Textarea {...form.register("qualifications")} />
      </div>
      {message ? <p className="text-sm text-[#64748d]">{message}</p> : null}
      <div className="flex items-center gap-2">
        <Button disabled={isPending || departments.length === 0} type="submit">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button asChild type="button" variant="secondary">
          <Link href="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    </form>
  );
}
