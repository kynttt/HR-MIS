-- Add `user` enum value first. It must be committed before usage.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'user'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'user';
  END IF;
END $$;
