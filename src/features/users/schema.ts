import { z } from "zod";

export const userRoleSchema = z.enum(["super_admin", "hr_admin", "department_admin", "user"]);

export const inviteUserSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  role: userRoleSchema
});

export const createUserSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  role: userRoleSchema
});

export const updateUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: userRoleSchema
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
