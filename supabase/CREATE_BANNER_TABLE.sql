-- ============================================
-- Banner 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public."Banner" (
    banner_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    page_type VARCHAR(50) NOT NULL DEFAULT 'discover', -- 'discover' | 'connect'
    title VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE public."Banner" ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능
CREATE POLICY "Banners are viewable by everyone."
  ON public."Banner" FOR SELECT
  USING ( true );

-- 관리자만 수정 가능 (role = 'admin' 체크)
-- 주의: role 컬럼이 'admin'이어야 함.
CREATE POLICY "Admins can insert banners"
  ON public."Banner" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update banners"
  ON public."Banner" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete banners"
  ON public."Banner" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
