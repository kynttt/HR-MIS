"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createDepartmentAction } from "./actions";
import { type DepartmentInput, departmentSchema } from "./schema";

export function DepartmentCreateForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      department_code: "",
      department_name: "",
      description: "",
      is_active: true
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = await createDepartmentAction(values);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      form.reset();
      setMessage("Department created.");
    });
  });

  return (
    <form className="grid gap-3 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4" onSubmit={onSubmit}>
      <h3 className="text-lg font-semibold text-[#061b31]">Create Department</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#273951]">Code</label>
          <Input {...form.register("department_code")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#273951]">Name</label>
          <Input {...form.register("department_name")} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#273951]">Description</label>
        <Textarea {...form.register("description")} />
      </div>
      {message ? <p className="text-sm text-[#64748d]">{message}</p> : null}
      <div>
        <Button disabled={isPending} type="submit">
          {isPending ? "Saving..." : "Save Department"}
        </Button>
      </div>
    </form>
  );
}
