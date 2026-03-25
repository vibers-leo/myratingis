-- public.users 테이블에 interests 컬럼 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '{}'::jsonb;

-- 트리거 함수 업데이트: user_metadata의 interests도 동기화
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, profile_image_url, interests)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nickname',
    NEW.raw_user_meta_data->>'profile_image_url',
    COALESCE(NEW.raw_user_meta_data->'interests', '{}'::jsonb)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
