import { z } from "zod";

export const departmentSchema = z.object({
  department_code: z.string().min(2).max(20),
  department_name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true)
});

export type DepartmentInput = z.infer<typeof departmentSchema>;