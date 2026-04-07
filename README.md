# University HRMIS MVP

Production-leaning MVP for **UNIVERSITY HRMIS - Recruitment and Employee Records System**.

## Account UX (Improved)
- `/register` now clearly guides users to confirm email.
- Register/Login pages include **Resend confirmation email** actions.
- Super admin `/users` now supports:
  - **Invite User (Recommended)**: sends confirmation email link
  - **Create Instant Account**: immediate confirmed account for internal setup

## Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (used for invite/confirmation redirect, e.g. `http://localhost:3000`)

## Setup
1. `npm install`
2. copy `.env.example` to `.env.local` and fill values
3. run `supabase/migrations/001_init.sql`
4. run `supabase/seeds/001_seed.sql`
5. `npm run dev`

## User Creation Flows
1. Self-service: user registers on `/register`, confirms email, then can login.
2. Admin-managed (super_admin):
   - Open `/users`
   - Use **Invite User** to send confirmation link + assign role
   - or use **Create Instant Account** for direct internal access

## Notes
- If confirmation emails do not send, verify Supabase Auth email settings and SMTP configuration in your Supabase project.

## Migration Patch (Unauthorized Redirect Fix)
If users authenticate but still get /dashboard?error=unauthorized, run:
- supabase/migrations/002_user_roles_select_self.sql`nThis adds RLS select access for users to read their own role row.
