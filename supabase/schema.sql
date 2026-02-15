-- MyRatingIs Database Schema (Supabase Auth Integrated)
-- User 테이블을 삭제하고 Supabase Auth와 1:1 매핑되는 public.users 테이블을 사용합니다.
-- 이 스크립트를 Supabase SQL Editor에서 실행하여 전체 스키마를 재구성하세요.
-- 주의: 기존 데이터가 있다면 백업 후 실행하세요. (DROP TABLE이 포함되어 있지 않으므로 새 프로젝트 기준입니다)

-- ============================================
-- 1. Users 테이블 (public.users)
-- Supabase Auth의 auth.users와 동기화되는 프로필 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  profile_image_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role VARCHAR(50) NOT NULL DEFAULT 'user'
);

-- RLS 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.users FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.users FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
  ON public.users FOR UPDATE
  USING ( auth.uid() = id );

-- ============================================
-- 2. Category 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public."Category" (
    category_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(100) NOT NULL,
    parent_id INT,
    FOREIGN KEY (parent_id) REFERENCES public."Category"(category_id) ON DELETE SET NULL
);

-- ============================================
-- 3. Project 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public."Project" (
    project_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL, -- Supabase Auth UUID 사용
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    rendering_type VARCHAR(50),
    custom_data TEXT,
    thumbnail_url VARCHAR(500),
    content_text TEXT,
    views INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES public."Category"(category_id) ON DELETE RESTRICT
);

-- ============================================
-- 4. Like 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public."Like" (
    user_id UUID NOT NULL, -- Supabase Auth UUID 사용
    project_id INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES public."Project"(project_id) ON DELETE CASCADE
);

-- ============================================
-- 5. Wishlist 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public."Wishlist" (
    user_id UUID NOT NULL, -- Supabase Auth UUID 사용
    project_id INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES public."Project"(project_id) ON DELETE CASCADE
);

-- ============================================
-- 6. Comment 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public."Comment" (
    comment_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL, -- Supabase Auth UUID 사용
    project_id INT NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES public."Project"(project_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES public."Comment"(comment_id) ON DELETE CASCADE
);

-- ============================================
-- 7. Proposal 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public."Proposal" (
    proposal_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL, -- Supabase Auth UUID 사용
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ============================================
-- 8. OutsourcingRequest 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public."OutsourcingRequest" (
    request_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL, -- Supabase Auth UUID 사용
    title VARCHAR(255) NOT NULL,
    budget VARCHAR(100),
    required_duration VARCHAR(100),
    required_skills VARCHAR(500),
    details TEXT,
    is_complete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category_id INT,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES public."Category"(category_id) ON DELETE SET NULL
);

-- ============================================
-- 9. JobPosting 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public."JobPosting" (
    posting_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL, -- Supabase Auth UUID 사용
    company_name VARCHAR(255),
    location VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    job_type VARCHAR(100),
    required_skills TEXT,
    description TEXT,
    deadline DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category_id INT,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES public."Category"(category_id) ON DELETE SET NULL
);

-- ============================================
-- 트리거: Auth 회원가입 시 public.users 자동 생성
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, profile_image_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nickname',
    NEW.raw_user_meta_data->>'profile_image_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 연결 (이미 존재하면 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- 기본 카테고리 데이터
-- ============================================
INSERT INTO public."Category" (name, parent_id) VALUES
    ('전체', NULL),
    ('AI', NULL),
    ('영상/모션그래픽', NULL),
    ('그래픽 디자인', NULL),
    ('웹 디자인', NULL),
    ('일러스트', NULL),
    ('3D', NULL),
    ('사진', NULL)
ON CONFLICT DO NOTHING;
