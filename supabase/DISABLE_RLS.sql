-- ============================================
-- 긴급 수정: RLS 비활성화 (임시)
-- ============================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1. Project 테이블 RLS 비활성화
ALTER TABLE public."Project" DISABLE ROW LEVEL SECURITY;

-- 2. users 테이블 RLS 비활성화
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Like 테이블 RLS 비활성화
ALTER TABLE public."Like" DISABLE ROW LEVEL SECURITY;

-- 4. Wishlist 테이블 RLS 비활성화
ALTER TABLE public."Wishlist" DISABLE ROW LEVEL SECURITY;

-- 5. Comment 테이블 RLS 비활성화
ALTER TABLE public."Comment" DISABLE ROW LEVEL SECURITY;

-- 6. Category 테이블 RLS 비활성화
ALTER TABLE public."Category" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 확인
-- ============================================
-- 아래 쿼리로 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('Project', 'users', 'Like', 'Wishlist', 'Comment', 'Category');

-- rowsecurity가 모두 false이면 성공
