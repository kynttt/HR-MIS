import { z } from "zod";

export const publicApplicationSchema = z.object({
  job_opening_id: z.string().uuid(),
  first_name: z.string().min(2).max(120),
  middle_name: z.string().max(120).optional(),
  last_name: z.string().min(2).max(120),
  suffix: z.string().max(30).optional(),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  address: z.string().max(400).optional()
});

export const applicationStatusSchema = z.object({
  application_id: z.string().uuid(),
  status: z.enum([
    "submitted",
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "interviewed",
    "for_requirements",
    "accepted",
    "rejected",
    "withdrawn"
  ]),
  remarks: z.string().max(500).optional()
});

export const applicationNoteSchema = z.object({
  application_id: z.string().uuid(),
  note_text: z.string().min(2).max(1000)
});

export const convertApplicationSchema = z.object({
  application_id: z.string().uuid(),
  employee_id_code: z.string().min(3).max(40),
  department_id: z.string().uuid(),
  position_title: z.string().min(2).max(180),
  employment_type: z.enum(["full_time", "part_time", "contractual", "job_order"]),
  employment_status: z.enum(["active", "probationary", "resigned", "retired", "terminated"]),
  hire_date: z.string().min(4)
});

export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>;
export type ApplicationNoteInput = z.infer<typeof applicationNoteSchema>;
export type ConvertApplicationInput = z.infer<typeof convertApplicationSchema>;