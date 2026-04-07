import { z } from "zod";

export const employeeUpdateSchema = z.object({
  employee_id_code: z.string().min(3).max(40),
  first_name: z.string().min(2).max(120),
  middle_name: z.string().max(120).optional(),
  last_name: z.string().min(2).max(120),
  suffix: z.string().max(30).optional(),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  sex: z.string().max(20).optional(),
  civil_status: z.string().max(30).optional(),
  birth_date: z.string().optional(),
  employment_status: z.enum(["active", "probationary", "resigned", "retired", "terminated"]),
  employment_type: z.enum(["full_time", "part_time", "contractual", "job_order"]),
  role_type: z.enum(["faculty", "staff"]),
  department_id: z.string().uuid(),
  position_title: z.string().min(2).max(180),
  hire_date: z.string().min(4),
  campus: z.string().max(120).optional(),
  address: z.string().max(400).optional(),
  emergency_contact_name: z.string().max(120).optional(),
  emergency_contact_phone: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
  is_active: z.boolean(),
  academic_rank: z.string().optional(),
  highest_education: z.string().optional(),
  specialization: z.string().optional(),
  teaching_status: z.string().optional(),
  tenure_status: z.string().optional(),
  staff_category: z.string().optional(),
  office_assignment: z.string().optional()
});

export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;