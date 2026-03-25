-- 관리자 권한 시스템
-- Supabase SQL Editor에서 실행하세요

-- 1. 관리자 테이블 생성
CREATE TABLE IF NOT EXISTS public."Admin" (
  admin_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'super_admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. RLS 활성화
ALTER TABLE public."Admin" ENABLE ROW LEVEL SECURITY;

-- 3. 관리자만 조회 가능
CREATE POLICY "Admins can view admin list"
  ON public."Admin" FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public."Admin")
  );

-- 4. 슈퍼 관리자만 추가/삭제 가능
CREATE POLICY "Super admins can manage admins"
  ON public."Admin" FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public."Admin" WHERE role = 'super_admin'
    )
  );

-- 5. 배너 테이블 생성
CREATE TABLE IF NOT EXISTS public."Banner" (
  banner_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  page_type VARCHAR(50) NOT NULL, -- 'discover' 또는 'connect'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 배너 RLS
ALTER TABLE public."Banner" ENABLE ROW LEVEL SECURITY;

-- 누구나 활성 배너 조회 가능
CREATE POLICY "Anyone can view active banners"
  ON public."Banner" FOR SELECT
  USING (is_active = true);

-- 관리자만 배너 관리 가능
CREATE POLICY "Admins can manage banners"
  ON public."Banner" FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public."Admin")
  );

-- 7. 첫 번째 관리자 추가 (본인 이메일로 변경)
-- INSERT INTO public."Admin" (user_id, role)
-- SELECT id, 'super_admin' FROM auth.users WHERE email = 'your-email@example.com';

-- 확인
SELECT * FROM public."Admin";
SELECT * FROM public."Banner";
