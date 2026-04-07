export const APP_NAME = "University HRMIS";
export const APP_TAGLINE = "Recruitment and Employee Records System";

export const ADMIN_ROLES = ["super_admin", "hr_admin", "department_admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];