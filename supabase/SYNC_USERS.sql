-- ==========================================
-- 1. 트리거 함수 및 트리거 재설정 (미래 회원가입 보장)
-- ==========================================

-- 트리거 함수 생성 (닉네임이 없으면 이메일 앞부분 사용)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, profile_image_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'profile_image_url', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 삭제 및 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 2. 누락된 사용자 데이터 일괄 복구 (현재 오류 해결)
-- ==========================================

INSERT INTO public.users (id, email, nickname, role, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'nickname', split_part(email, '@', 1)) as nickname,
  'user' as role,
  created_at,
  NOW() as updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 3. 결과 확인
-- ==========================================
SELECT count(*) as "복구된_유저_수" FROM public.users;
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 10;
