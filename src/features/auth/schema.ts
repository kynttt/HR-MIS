import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(8)
  })
  .refine((value) => value.password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match"
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;