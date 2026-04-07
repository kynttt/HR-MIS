import { z } from "zod";

export const jobOpeningSchema = z.object({
  job_title: z.string().min(3).max(200),
  department_id: z.string().uuid(),
  role_type: z.enum(["faculty", "staff"]),
  employment_type: z.enum(["full_time", "part_time", "contractual", "job_order"]),
  description: z.string().max(3000).optional(),
  qualifications: z.string().max(3000).optional()
});

export type JobOpeningInput = z.infer<typeof jobOpeningSchema>;