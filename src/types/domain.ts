export type UserRole = "super_admin" | "hr_admin" | "department_admin" | "user";
export type RoleType = "faculty" | "staff";
export type EmploymentType = "full_time" | "part_time" | "contractual" | "job_order";
export type EmploymentStatus = "active" | "probationary" | "resigned" | "retired" | "terminated";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "interview_scheduled"
  | "interviewed"
  | "for_requirements"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type DocumentType =
  | "resume"
  | "diploma"
  | "tor"
  | "certificates"
  | "prc_license"
  | "contract"
  | "other";
