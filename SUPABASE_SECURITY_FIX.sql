-- 🛡️ Supabase Security & RLS Fixes (Updated with correct function signatures)
-- Run this in your Supabase SQL Editor to clear the "Critical" alerts.

-- 1. Enable RLS on all public tables mentioned in the alerts
ALTER TABLE IF EXISTS public."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."JobPosting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."OutsourcingRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Proposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Wishlist" ENABLE ROW LEVEL SECURITY;

-- 2. Add basic 'Public Access' policies (Adjust these as needed)
-- Category
DROP POLICY IF EXISTS "Allow public read access on Category" ON public."Category";
CREATE POLICY "Allow public read access on Category" ON public."Category" FOR SELECT USING (true);

-- Comment
DROP POLICY IF EXISTS "Allow public read access on Comment" ON public."Comment";
CREATE POLICY "Allow public read access on Comment" ON public."Comment" FOR SELECT USING (true);

-- 3. Fix "Function Search Path Mutable" warnings
-- Note: Function names MUST include their argument types to be correctly identified by ALTER FUNCTION.

-- Visit Tracking
DO $$ 
BEGIN
    ALTER FUNCTION public.increment_daily_visits(date) SET search_path = public;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Function increment_daily_visits(date) not found or already fixed.';
END $$;

-- Search Trends
DO $$ 
BEGIN
    ALTER FUNCTION public.increment_search_count(text) SET search_path = public;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Function increment_search_count(text) not found or already fixed.';
END $$;

-- Auth Triggers
DO $$ 
BEGIN
    ALTER FUNCTION public.handle_new_user() SET search_path = public;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Function handle_new_user() not found or already fixed.';
END $$;

-- Social Counters
DO $$ 
BEGIN
    ALTER FUNCTION public.update_project_likes_count() SET search_path = public;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Function update_project_likes_count() not found or already fixed.';
END $$;

DO $$ 
BEGIN
    ALTER FUNCTION public.update_project_rating_count() SET search_path = public;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Function update_project_rating_count() not found or already fixed.';
END $$;

-- Others (Optional/guessed)
DO $$ 
BEGIN
    ALTER FUNCTION public.confirm_new_user() SET search_path = public;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Function confirm_new_user() not found.';
END $$;

DO $$ 
BEGIN
    ALTER FUNCTION public.on_auth_user_created_confirm() SET search_path = public;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Function on_auth_user_created_confirm() not found.';
END $$;
