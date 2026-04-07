-- University HRMIS MVP schema
create extension if not exists "pgcrypto";

create type public.user_role as enum ('super_admin', 'hr_admin', 'department_admin');
create type public.role_type as enum ('faculty', 'staff');
create type public.employment_type as enum ('full_time', 'part_time', 'contractual', 'job_order');
create type public.employment_status as enum ('active', 'probationary', 'resigned', 'retired', 'terminated');
create type public.application_status as enum (
  'submitted',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'interviewed',
  'for_requirements',
  'accepted',
  'rejected',
  'withdrawn'
);
create type public.document_type as enum ('resume', 'diploma', 'tor', 'certificates', 'prc_license', 'contract', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  department_code text not null unique,
  department_name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_openings (
  id uuid primary key default gen_random_uuid(),
  job_title text not null,
  department_id uuid not null references public.departments(id),
  role_type public.role_type not null,
  employment_type public.employment_type not null,
  description text,
  qualifications text,
  status text not null check (status in ('open', 'closed')) default 'open',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  middle_name text,
  last_name text not null,
  suffix text,
  email text not null,
  phone text,
  address text,
  birth_date date,
  sex text,
  civil_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id),
  job_opening_id uuid not null references public.job_openings(id),
  status public.application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  converted_employee_id uuid,
  unique (applicant_id, job_opening_id)
);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  document_type public.document_type not null,
  file_path text not null,
  original_file_name text,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  note_text text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  remarks text
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_id_code text not null unique,
  source_application_id uuid references public.applications(id),
  first_name text not null,
  middle_name text,
  last_name text not null,
  suffix text,
  email text not null,
  phone text,
  sex text,
  civil_status text,
  birth_date date,
  employment_status public.employment_status not null default 'active',
  employment_type public.employment_type not null,
  role_type public.role_type not null,
  department_id uuid not null references public.departments(id),
  position_title text not null,
  hire_date date not null,
  campus text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applications
  add constraint applications_converted_employee_fk
  foreign key (converted_employee_id) references public.employees(id);

create table public.faculty_profiles (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references public.employees(id) on delete cascade,
  academic_rank text,
  highest_education text,
  specialization text,
  teaching_status text,
  tenure_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references public.employees(id) on delete cascade,
  staff_category text,
  office_assignment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  document_type public.document_type not null,
  file_path text not null,
  original_file_name text,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_roles_user on public.user_roles(user_id);
create index idx_jobs_department_status on public.job_openings(department_id, status);
create index idx_applications_status on public.applications(status);
create index idx_applications_job on public.applications(job_opening_id);
create index idx_applications_submitted_at on public.applications(submitted_at desc);
create index idx_applicants_email on public.applicants(lower(email));
create index idx_employees_department on public.employees(department_id);
create index idx_employees_role on public.employees(role_type);
create index idx_employees_active on public.employees(is_active);
create index idx_employee_docs_employee on public.employee_documents(employee_id);
create index idx_application_docs_application on public.application_documents(application_id);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = any(roles)
  );
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['super_admin', 'hr_admin', 'department_admin']::public.user_role[]);
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create trigger set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at_user_roles before update on public.user_roles for each row execute function public.set_updated_at();
create trigger set_updated_at_departments before update on public.departments for each row execute function public.set_updated_at();
create trigger set_updated_at_job_openings before update on public.job_openings for each row execute function public.set_updated_at();
create trigger set_updated_at_applicants before update on public.applicants for each row execute function public.set_updated_at();
create trigger set_updated_at_applications before update on public.applications for each row execute function public.set_updated_at();
create trigger set_updated_at_application_documents before update on public.application_documents for each row execute function public.set_updated_at();
create trigger set_updated_at_application_notes before update on public.application_notes for each row execute function public.set_updated_at();
create trigger set_updated_at_employees before update on public.employees for each row execute function public.set_updated_at();
create trigger set_updated_at_faculty_profiles before update on public.faculty_profiles for each row execute function public.set_updated_at();
create trigger set_updated_at_staff_profiles before update on public.staff_profiles for each row execute function public.set_updated_at();
create trigger set_updated_at_employee_documents before update on public.employee_documents for each row execute function public.set_updated_at();
create trigger set_updated_at_audit_logs before update on public.audit_logs for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.departments enable row level security;
alter table public.job_openings enable row level security;
alter table public.applicants enable row level security;
alter table public.applications enable row level security;
alter table public.application_documents enable row level security;
alter table public.application_notes enable row level security;
alter table public.application_status_history enable row level security;
alter table public.employees enable row level security;
alter table public.faculty_profiles enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.employee_documents enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_self_or_admin" on public.profiles for select using (id = auth.uid() or public.is_admin_user());
create policy "profiles_update_self_or_admin" on public.profiles for update using (id = auth.uid() or public.is_admin_user()) with check (id = auth.uid() or public.is_admin_user());
create policy "roles_admin_only" on public.user_roles for all using (public.has_role(array['super_admin']::public.user_role[])) with check (public.has_role(array['super_admin']::public.user_role[]));

create policy "departments_admin_only" on public.departments for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "jobs_admin_only" on public.job_openings for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "public_can_create_applicant" on public.applicants for insert with check (true);
create policy "admin_can_view_applicants" on public.applicants for select using (public.is_admin_user());
create policy "admin_can_update_applicants" on public.applicants for update using (public.is_admin_user()) with check (public.is_admin_user());

create policy "public_can_submit_applications" on public.applications for insert with check (true);
create policy "admin_manage_applications" on public.applications for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "admin_manage_application_docs" on public.application_documents for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin_manage_application_notes" on public.application_notes for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin_manage_application_status_history" on public.application_status_history for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "admin_manage_employees" on public.employees for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin_manage_faculty_profiles" on public.faculty_profiles for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin_manage_staff_profiles" on public.staff_profiles for all using (public.is_admin_user()) with check (public.is_admin_user());
create policy "admin_manage_employee_docs" on public.employee_documents for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "admin_manage_audit" on public.audit_logs for all using (public.is_admin_user()) with check (public.is_admin_user());

insert into storage.buckets (id, name, public)
values ('application-documents', 'application-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('employee-documents', 'employee-documents', false)
on conflict (id) do nothing;

create policy "application_docs_admin_read" on storage.objects for select using (bucket_id = 'application-documents' and public.is_admin_user());
create policy "application_docs_admin_write" on storage.objects for insert with check (bucket_id = 'application-documents' and public.is_admin_user());
create policy "application_docs_admin_update" on storage.objects for update using (bucket_id = 'application-documents' and public.is_admin_user());
create policy "application_docs_admin_delete" on storage.objects for delete using (bucket_id = 'application-documents' and public.is_admin_user());

create policy "employee_docs_admin_read" on storage.objects for select using (bucket_id = 'employee-documents' and public.is_admin_user());
create policy "employee_docs_admin_write" on storage.objects for insert with check (bucket_id = 'employee-documents' and public.is_admin_user());
create policy "employee_docs_admin_update" on storage.objects for update using (bucket_id = 'employee-documents' and public.is_admin_user());
create policy "employee_docs_admin_delete" on storage.objects for delete using (bucket_id = 'employee-documents' and public.is_admin_user());