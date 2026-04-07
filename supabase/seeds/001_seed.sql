-- Demo seed data for University HRMIS MVP

insert into public.departments (id, department_code, department_name, description, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'CS', 'Computer Science', 'School of Computing', true),
  ('22222222-2222-2222-2222-222222222222', 'HR', 'Human Resources', 'Administrative Services', true),
  ('33333333-3333-3333-3333-333333333333', 'ENG', 'English Department', 'College of Arts and Sciences', true)
on conflict (id) do nothing;

insert into public.job_openings (id, job_title, department_id, role_type, employment_type, description, qualifications, status)
values
  ('44444444-4444-4444-4444-444444444441', 'Assistant Professor I', '11111111-1111-1111-1111-111111111111', 'faculty', 'full_time', 'Teach undergraduate programming courses.', 'Master''s degree in CS or related field.', 'open'),
  ('44444444-4444-4444-4444-444444444442', 'HR Assistant', '22222222-2222-2222-2222-222222222222', 'staff', 'full_time', 'Support recruitment and employee records.', 'Bachelor''s degree and HR experience preferred.', 'open'),
  ('44444444-4444-4444-4444-444444444443', 'English Instructor', '33333333-3333-3333-3333-333333333333', 'faculty', 'part_time', 'Handle general education writing classes.', 'Relevant MA units and teaching background.', 'closed')
on conflict (id) do nothing;

insert into public.applicants (id, first_name, middle_name, last_name, email, phone, address)
values
  ('55555555-5555-5555-5555-555555555551', 'Ana', 'Lopez', 'Santos', 'ana.santos@example.edu', '09171234567', 'City A'),
  ('55555555-5555-5555-5555-555555555552', 'Marco', null, 'Reyes', 'marco.reyes@example.edu', '09179876543', 'City B')
on conflict (id) do nothing;

insert into public.applications (id, applicant_id, job_opening_id, status)
values
  ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', 'under_review'),
  ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444442', 'shortlisted')
on conflict (id) do nothing;

insert into public.application_notes (application_id, note_text)
values
  ('66666666-6666-6666-6666-666666666661', 'Initial screening passed.'),
  ('66666666-6666-6666-6666-666666666662', 'For final interview scheduling.')
on conflict do nothing;

insert into public.employees (
  id,
  employee_id_code,
  first_name,
  last_name,
  email,
  employment_status,
  employment_type,
  role_type,
  department_id,
  position_title,
  hire_date,
  is_active
)
values
  ('77777777-7777-7777-7777-777777777771', 'EMP-2026-001', 'Clara', 'Navarro', 'clara.navarro@example.edu', 'active', 'full_time', 'faculty', '11111111-1111-1111-1111-111111111111', 'Associate Professor', current_date - interval '120 days', true),
  ('77777777-7777-7777-7777-777777777772', 'EMP-2026-002', 'Paolo', 'Mendoza', 'paolo.mendoza@example.edu', 'active', 'full_time', 'staff', '22222222-2222-2222-2222-222222222222', 'HR Officer', current_date - interval '90 days', true)
on conflict (id) do nothing;

insert into public.faculty_profiles (employee_id, academic_rank, highest_education, specialization, teaching_status, tenure_status)
values
  ('77777777-7777-7777-7777-777777777771', 'Associate Professor', 'PhD Computer Science', 'Artificial Intelligence', 'full_load', 'tenured')
on conflict (employee_id) do nothing;

insert into public.staff_profiles (employee_id, staff_category, office_assignment)
values
  ('77777777-7777-7777-7777-777777777772', 'Administrative', 'Recruitment Desk')
on conflict (employee_id) do nothing;

-- Role seed (requires existing users in auth.users)
-- Create these users in Supabase Auth first then run this block.
do $$
declare
  super_admin_user uuid;
  hr_admin_user uuid;
  dept_admin_user uuid;
begin
  select id into super_admin_user from auth.users where email = 'superadmin@university.edu' limit 1;
  select id into hr_admin_user from auth.users where email = 'hradmin@university.edu' limit 1;
  select id into dept_admin_user from auth.users where email = 'deptadmin@university.edu' limit 1;

  if super_admin_user is not null then
    insert into public.profiles (id, full_name) values (super_admin_user, 'Super Admin') on conflict (id) do nothing;
    insert into public.user_roles (user_id, role) values (super_admin_user, 'super_admin') on conflict do nothing;
  end if;

  if hr_admin_user is not null then
    insert into public.profiles (id, full_name) values (hr_admin_user, 'HR Admin') on conflict (id) do nothing;
    insert into public.user_roles (user_id, role) values (hr_admin_user, 'hr_admin') on conflict do nothing;
  end if;

  if dept_admin_user is not null then
    insert into public.profiles (id, full_name) values (dept_admin_user, 'Department Admin') on conflict (id) do nothing;
    insert into public.user_roles (user_id, role) values (dept_admin_user, 'department_admin') on conflict do nothing;
  end if;
end $$;