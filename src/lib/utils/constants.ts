export const APP_NAME = "University HRMIS";
export const APP_TAGLINE = "Recruitment and Employee Records System";

export const ADMIN_ROLES = ["super_admin", "hr_admin", "department_admin"] as const;
export const USER_ROLE = "user" as const;
export const ALL_USER_ROLES = [...ADMIN_ROLES, USER_ROLE] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AppUserRole = (typeof ALL_USER_ROLES)[number];

export function isAdminRole(role: AppUserRole | null | undefined): role is AdminRole {
  return typeof role === "string" && (ADMIN_ROLES as readonly string[]).includes(role);
}
