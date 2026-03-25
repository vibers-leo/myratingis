-- 1. users 테이블에 role 컬럼이 없으면 추가합니다.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. 관리자 권한 부여 (이메일 기준)
-- auth.users 테이블에서 해당 이메일을 가진 사용자의 ID를 찾아 public.users를 업데이트합니다.
UPDATE public.users
SET role = 'admin'
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'duscontactus@gmail.com'
);

-- 만약 public.users 테이블에도 email 컬럼이 있다면 아래 쿼리도 같이 실행되어 확실하게 처리됩니다.
UPDATE public.users
SET role = 'admin'
WHERE email = 'duscontactus@gmail.com';

-- 3. 변경사항 적용을 위해 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';

-- 4. 결과 확인
SELECT id, email, role FROM public.users WHERE role = 'admin';
