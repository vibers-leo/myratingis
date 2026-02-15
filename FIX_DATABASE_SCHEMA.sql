
-- 1. Profiles 테이블 누락 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS github TEXT,
ADD COLUMN IF NOT EXISTS twitter TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- 2. Follow 테이블 생성 (친구/팔로우 기능용)
CREATE TABLE IF NOT EXISTS public."Follow" (
    id SERIAL PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(follower_id, following_id)
);

-- Follow RLS 설정
ALTER TABLE public."Follow" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can see followers" ON public."Follow" FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public."Follow" FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public."Follow" FOR DELETE USING (auth.uid() = follower_id);

-- 3. api_keys 테이블 생성 (API 연동 기능용)
CREATE TABLE IF NOT EXISTS public.api_keys (
    key_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key TEXT UNIQUE NOT NULL,
    key_name TEXT DEFAULT 'MyRatingIs Key',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- api_keys RLS 설정
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own keys" ON public.api_keys 
    FOR ALL USING (auth.uid() = user_id);

-- 4. 캐시 갱신을 위해 스키마 정보 재로드 (Supabase 대시보드에서 실행 시 자동 반영됨)
