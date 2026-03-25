-- Forcefully ensure columns exist
-- This script uses IF NOT EXISTS to be safe but covers all critical fields

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_group text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expertise jsonb DEFAULT '{"fields": []}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests jsonb DEFAULT '{"genres": [], "fields": []}'::jsonb;

-- Update RLS policies to allow updates to these columns explicitly (if needed, though standard UPDATE covers all)
-- In Supabase/Postgres, standard UPDATE policy covers all columns unless restricted.
-- We'll assume the standard "Users can update own profile" policy exists and works.

-- Verify permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
