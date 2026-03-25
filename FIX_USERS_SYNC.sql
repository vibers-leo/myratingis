-- FIX_USERS_SYNC.sql
-- This script ensures valid public.users rows exist for all auth.users
-- Run this if you encounter "Key is not present in table users" errors.

INSERT INTO public.users (id, email, nickname, created_at, updated_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'nickname', email) as nickname,
    created_at,
    now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Also verify Collection table FK constraints if needed (usually not needed if users table logic is fixed)
-- Ensure newly inserted users have default profile image if possible
UPDATE public.users 
SET profile_image_url = 'https://picsum.photos/seed/' || id || '/200' 
WHERE profile_image_url IS NULL;
