export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          organization_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          organization_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "super_admin" | "hr_admin" | "department_admin" | "user";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "super_admin" | "hr_admin" | "department_admin" | "user";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "super_admin" | "hr_admin" | "department_admin" | "user";
          created_at?: string;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          organization_id: string;
          department_code: string;
          department_name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      job_openings: {
        Row: {
          id: string;
          organization_id: string;
          job_title: string;
          department_id: string;
          role_type: "faculty" | "staff";
          employment_type: "full_time" | "part_time" | "contractual" | "job_order";
          description: string | null;
          qualifications: string | null;
          status: "open" | "closed";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      applicants: {
        Row: {
          id: string;
          organization_id: string;
          auth_user_id: string | null;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          suffix: string | null;
          email: string;
          phone: string | null;
          address: string | null;
          birth_date: string | null;
          sex: string | null;
          civil_status: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      applications: {
        Row: {
          id: string;
          organization_id: string;
          applicant_id: string;
          submitted_by_user_id: string | null;
          job_opening_id: string;
          status: import("@/types/domain").ApplicationStatus;
          submitted_at: string;
          updated_at: string;
          converted_employee_id: string | null;
        };
      };
      security_events: {
        Row: {
          id: string;
          event: string;
          scope: string;
          key_hash: string;
          retry_after_ms: number;
          remaining: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event: string;
          scope: string;
          key_hash: string;
          retry_after_ms: number;
          remaining: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event?: string;
          scope?: string;
          key_hash?: string;
          retry_after_ms?: number;
          remaining?: number;
          metadata?: Json;
          created_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          organization_id: string;
          employee_id_code: string;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          suffix: string | null;
          email: string;
          phone: string | null;
          sex: string | null;
          civil_status: string | null;
          birth_date: string | null;
          employment_status: import("@/types/domain").EmploymentStatus;
          employment_type: import("@/types/domain").EmploymentType;
          role_type: import("@/types/domain").RoleType;
          department_id: string;
          position_title: string;
          hire_date: string;
          campus: string | null;
          address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};


