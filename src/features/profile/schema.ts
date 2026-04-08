import { z } from "zod";

export const updateProfileDetailsSchema = z.object({
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters.").max(120),
  has_applicant_profile: z.enum(["0", "1"]).default("0"),
  first_name: z.string().trim().max(80).optional(),
  middle_name: z.string().trim().max(80).optional(),
  last_name: z.string().trim().max(80).optional(),
  suffix: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  birth_date: z.string().trim().optional(),
  sex: z.string().trim().max(30).optional(),
  civil_status: z.string().trim().max(30).optional()
});

export const updatePasswordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters."),
    confirm_password: z.string().min(8, "Please confirm your password.")
  })
  .refine((value) => value.new_password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match."
  });

export type UpdateProfileDetailsInput = z.infer<typeof updateProfileDetailsSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
