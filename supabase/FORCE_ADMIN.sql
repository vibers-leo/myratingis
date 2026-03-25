-- 1. 안전장치: 필수 컬럼이 있는지 다시 확인하고 생성
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. 강제 관리자 지정 (Upsert: 없으면 생성, 있으면 수정)
INSERT INTO public.users (id, email, nickname, role)
SELECT 
    id, 
    email, 
    '관리자' as nickname, -- 닉네임이 없으면 '관리자'로 설정
    'admin' as role
FROM auth.users
WHERE email = 'duscontactus@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin';

-- 3. 확인: 이제는 반드시 1개의 행(관리자 계정)이 나와야 합니다.
SELECT id, email, role, nickname FROM public.users WHERE role = 'admin';
