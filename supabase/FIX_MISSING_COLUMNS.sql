-- 1. users 테이블에 누락될 수 있는 컬럼들을 안전하게 추가합니다.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS interests jsonb DEFAULT '{"genres": [], "fields": []}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_image_url text DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nickname text;

-- 2. Supabase(PostgREST)의 스키마 캐시를 강제로 새로고침합니다.
-- 이 명령어가 실행되면 'Could not find column in schema cache' 오류가 해결됩니다.
NOTIFY pgrst, 'reload schema';

-- 3. 확인용: 변경된 테이블 정보 조회 (실행 결과 확인용)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users';
