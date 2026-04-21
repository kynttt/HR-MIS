export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_configurations: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          is_enabled: boolean
          model: string
          ollama_base_url: string | null
          organization_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          model: string
          ollama_base_url?: string | null
          organization_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          model?: string
          ollama_base_url?: string | null
          organization_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      applicants: {
        Row: {
          address: string | null
          auth_user_id: string | null
          birth_date: string | null
          civil_status: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          middle_name: string | null
          organization_id: string
          phone: string | null
          sex: string | null
          suffix: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          civil_status?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          middle_name?: string | null
          organization_id: string
          phone?: string | null
          sex?: string | null
          suffix?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          civil_status?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string | null
          organization_id?: string
          phone?: string | null
          sex?: string | null
          suffix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicants_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      application_ai_scores: {
        Row: {
          application_id: string
          created_at: string
          highlights: string[]
          id: string
          job_opening_id: string
          model: string
          organization_id: string
          provider: string
          rationale: string | null
          score: number
          tokens_used: number | null
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          highlights?: string[]
          id?: string
          job_opening_id: string
          model: string
          organization_id: string
          provider: string
          rationale?: string | null
          score: number
          tokens_used?: number | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          highlights?: string[]
          id?: string
          job_opening_id?: string
          model?: string
          organization_id?: string
          provider?: string
          rationale?: string | null
          score?: number
          tokens_used?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_ai_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_ai_scores_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_ai_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          id: string
          original_file_name: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          id?: string
          original_file_name?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string
          id?: string
          original_file_name?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_notes: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          id: string
          note_text: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_text: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          remarks: string | null
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          application_id: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          remarks?: string | null
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          application_id?: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          remarks?: string | null
          to_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          converted_employee_id: string | null
          id: string
          job_opening_id: string
          organization_id: string
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
          submitted_by_user_id: string | null
          updated_at: string
        }
        Insert: {
          applicant_id: string
          converted_employee_id?: string | null
          id?: string
          job_opening_id: string
          organization_id: string
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          converted_employee_id?: string | null
          id?: string
          job_opening_id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_converted_employee_fk"
            columns: ["converted_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          department_code: string
          department_name: string
          description: string | null
          id: string
          is_active: boolean
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_code: string
          department_name: string
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_code?: string
          department_name?: string
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          employee_id: string
          file_path: string
          id: string
          original_file_name: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          employee_id: string
          file_path: string
          id?: string
          original_file_name?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          employee_id?: string
          file_path?: string
          id?: string
          original_file_name?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          birth_date: string | null
          campus: string | null
          civil_status: string | null
          created_at: string
          department_id: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id_code: string
          employment_status: Database["public"]["Enums"]["employment_status"]
          employment_type: Database["public"]["Enums"]["employment_type"]
          first_name: string
          hire_date: string
          id: string
          is_active: boolean
          last_name: string
          middle_name: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          position_title: string
          role_type: Database["public"]["Enums"]["role_type"]
          sex: string | null
          source_application_id: string | null
          suffix: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          campus?: string | null
          civil_status?: string | null
          created_at?: string
          department_id: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id_code: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          employment_type: Database["public"]["Enums"]["employment_type"]
          first_name: string
          hire_date: string
          id?: string
          is_active?: boolean
          last_name: string
          middle_name?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          position_title: string
          role_type: Database["public"]["Enums"]["role_type"]
          sex?: string | null
          source_application_id?: string | null
          suffix?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          campus?: string | null
          civil_status?: string | null
          created_at?: string
          department_id?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id_code?: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          employment_type?: Database["public"]["Enums"]["employment_type"]
          first_name?: string
          hire_date?: string
          id?: string
          is_active?: boolean
          last_name?: string
          middle_name?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          position_title?: string
          role_type?: Database["public"]["Enums"]["role_type"]
          sex?: string | null
          source_application_id?: string | null
          suffix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_source_application_id_fkey"
            columns: ["source_application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_profiles: {
        Row: {
          academic_rank: string | null
          created_at: string
          employee_id: string
          highest_education: string | null
          id: string
          specialization: string | null
          teaching_status: string | null
          tenure_status: string | null
          updated_at: string
        }
        Insert: {
          academic_rank?: string | null
          created_at?: string
          employee_id: string
          highest_education?: string | null
          id?: string
          specialization?: string | null
          teaching_status?: string | null
          tenure_status?: string | null
          updated_at?: string
        }
        Update: {
          academic_rank?: string | null
          created_at?: string
          employee_id?: string
          highest_education?: string | null
          id?: string
          specialization?: string | null
          teaching_status?: string | null
          tenure_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_openings: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          job_title: string
          organization_id: string
          qualifications: string | null
          role_type: Database["public"]["Enums"]["role_type"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          description?: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          id?: string
          job_title: string
          organization_id: string
          qualifications?: string | null
          role_type: Database["public"]["Enums"]["role_type"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          description?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          job_title?: string
          organization_id?: string
          qualifications?: string | null
          role_type?: Database["public"]["Enums"]["role_type"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_openings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          event: string
          id: string
          key_hash: string
          metadata: Json
          remaining: number
          retry_after_ms: number
          scope: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          key_hash: string
          metadata?: Json
          remaining?: number
          retry_after_ms?: number
          scope: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          key_hash?: string
          metadata?: Json
          remaining?: number
          retry_after_ms?: number
          scope?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          office_assignment: string | null
          staff_category: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          office_assignment?: string | null
          staff_category?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          office_assignment?: string | null
          staff_category?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_organization_id: { Args: never; Returns: string }
      default_organization_id: { Args: never; Returns: string }
      has_role: {
        Args: { roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      is_admin_user: { Args: never; Returns: boolean }
    }
    Enums: {
      application_status:
        | "submitted"
        | "under_review"
        | "shortlisted"
        | "interview_scheduled"
        | "interviewed"
        | "for_requirements"
        | "accepted"
        | "rejected"
        | "withdrawn"
      document_type:
        | "resume"
        | "diploma"
        | "tor"
        | "certificates"
        | "prc_license"
        | "contract"
        | "other"
      employment_status:
        | "active"
        | "probationary"
        | "resigned"
        | "retired"
        | "terminated"
      employment_type: "full_time" | "part_time" | "contractual" | "job_order"
      role_type: "faculty" | "staff"
      user_role: "super_admin" | "hr_admin" | "department_admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "submitted",
        "under_review",
        "shortlisted",
        "interview_scheduled",
        "interviewed",
        "for_requirements",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      document_type: [
        "resume",
        "diploma",
        "tor",
        "certificates",
        "prc_license",
        "contract",
        "other",
      ],
      employment_status: [
        "active",
        "probationary",
        "resigned",
        "retired",
        "terminated",
      ],
      employment_type: ["full_time", "part_time", "contractual", "job_order"],
      role_type: ["faculty", "staff"],
      user_role: ["super_admin", "hr_admin", "department_admin", "user"],
    },
  },
} as const

