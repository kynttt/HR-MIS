# University HRMIS

University HRMIS is a multi-tenant recruitment and employee records application built with Next.js and Supabase.

## Current Scope

### Public + Applicant Portal
- Public job board at `/apply` with organization-aware filtering (`?org=<slug>`), role/employment filters, and search.
- Two-column job browsing experience with role list and selected role details.
- Public role details and application form at `/apply/[jobId]`.
- Account-based applicant submissions with duplicate prevention per user/job/organization.
- Applicant workspace at `/profile`:
  - Overview dashboard
  - My Applications list with pagination
  - Application details page
  - Profile settings (account details + password update)

### Admin Portal
- Dashboard analytics and activity overview.
- Applications management:
  - List view with filters + pagination
  - Pipeline/Kanban view
  - Application details with status history, notes, documents, and employee conversion
- Jobs management (create, edit, status open/close, filtering, sorting, pagination).
- Departments management.
- Employees directory and profile pages.
- User management (invite, create instant account, role assignment).
- Security events view for abuse/rate-limit telemetry.

## Roles and Access

- `super_admin`
- `hr_admin`
- `department_admin`
- `user` (default for newly registered accounts)

Routing behavior:
- Unauthenticated users are redirected to login for protected routes.
- Admin roles are routed to `/dashboard`.
- Non-admin authenticated users are routed to `/profile`.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, RLS, Storage)
- Cloudinary (document uploads)
- Optional Upstash Redis (distributed rate limiting; falls back to in-memory)

## Environment Variables

Copy `.env.example` to `.env.local` and fill values.

Required to run the app:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Required for admin operations:
- `SUPABASE_SERVICE_ROLE_KEY`

Required for invite/login redirect URLs:
- `NEXT_PUBLIC_APP_URL` (example: `http://localhost:3000`)

Required for document upload:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional for distributed rate limiting:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Local Setup

1. Install dependencies:
   - `npm install`
2. Configure environment:
   - copy `.env.example` to `.env.local`
3. Apply database migrations in order:
   - `001_init.sql`
   - `002_user_roles_select_self.sql`
   - `003_security_events.sql`
   - `004_user_roles_hr_admin_access.sql`
   - `005_multi_tenant_public_apply.sql`
   - `006_applicant_auth_tracking.sql`
   - `007_default_user_role_and_applicant_policies.sql`
   - `008_apply_default_user_role_and_applicant_policies.sql`
4. Optional seed data:
   - `supabase/seeds/001_seed.sql`
5. Start dev server:
   - `npm run dev`

## Migration Notes

- `007` and `008` are intentionally split.
- `007` adds enum value `user`.
- `008` uses that enum value in function updates/backfills/policies.
- If running SQL manually, ensure `007` is committed before executing `008`.

## NPM Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`

## Quick Smoke Checklist

1. Register a new account and confirm email.
2. Login as the new account and verify redirect to `/profile`.
3. Browse `/apply`, select an open role, submit an application.
4. Verify duplicate apply prevention for the same role/account.
5. Login as admin and verify:
   - `/dashboard`
   - `/applications` and `/applications/pipeline`
   - `/jobs`, `/departments`, `/employees`, `/users`, `/security-events`
