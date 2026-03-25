-- ========================================
-- MyRatingIs - Firebase to Supabase Migration Schema
-- ========================================
-- 작성일: 2026-02-12
-- 목적: Firebase Firestore의 5개 컬렉션을 Supabase PostgreSQL로 완전 마이그레이션
--
-- 컬렉션 목록:
-- 1. users → profiles (확장)
-- 2. projects → projects
-- 3. evaluations → evaluations
-- 4. inquiries → inquiries
-- 5. proposals → proposals
-- 6. likes (서브컬렉션) → project_likes
-- ========================================

-- ========================================
-- 1. profiles 테이블 (users 컬렉션)
-- ========================================
-- 기존 Supabase profiles 테이블 확장
-- Firebase users 컬렉션의 모든 필드 포함

-- 먼저 기존 profiles 테이블이 있는지 확인하고, 없으면 생성
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles 테이블에 Firebase users 필드 추가 (이미 있으면 무시)
DO $$
BEGIN
  -- 기본 정보
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT UNIQUE NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username') THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='nickname') THEN
    ALTER TABLE public.profiles ADD COLUMN nickname TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='profile_image') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_image TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_public') THEN
    ALTER TABLE public.profiles ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cover_image_url') THEN
    ALTER TABLE public.profiles ADD COLUMN cover_image_url TEXT;
  END IF;

  -- 소셜 링크 (JSONB)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='social_links') THEN
    ALTER TABLE public.profiles ADD COLUMN social_links JSONB DEFAULT '{"website": "", "github": "", "twitter": "", "instagram": ""}'::jsonb;
  END IF;

  -- 관심사 (JSONB)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='interests') THEN
    ALTER TABLE public.profiles ADD COLUMN interests JSONB DEFAULT '{"genres": [], "fields": []}'::jsonb;
  END IF;

  -- 전문성 (JSONB)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='expertise') THEN
    ALTER TABLE public.profiles ADD COLUMN expertise JSONB DEFAULT '{"fields": []}'::jsonb;
  END IF;

  -- 개인 정보
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='gender') THEN
    ALTER TABLE public.profiles ADD COLUMN gender TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='age_group') THEN
    ALTER TABLE public.profiles ADD COLUMN age_group TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='occupation') THEN
    ALTER TABLE public.profiles ADD COLUMN occupation TEXT;
  END IF;

  -- 온보딩 완료 여부
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarding_completed') THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- profiles 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ========================================
-- 2. projects 테이블
-- ========================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  title TEXT NOT NULL,
  summary TEXT,
  content_text TEXT,
  description TEXT,
  category_id INTEGER,
  thumbnail_url TEXT,

  -- 가시성 및 상태
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  audit_deadline TIMESTAMPTZ,
  is_growth_requested BOOLEAN DEFAULT false,

  -- 작성자 정보
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,

  -- 통계
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  evaluations_count INTEGER DEFAULT 0,

  -- 추가 정보
  site_url TEXT,
  rendering_type TEXT,
  alt_description TEXT,

  -- 커스텀 데이터 (JSONB)
  custom_data JSONB DEFAULT '{}'::jsonb
);

-- projects 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_author_id ON public.projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_author_email ON public.projects(author_email);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON public.projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_views_count ON public.projects(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_likes_count ON public.projects(likes_count DESC);

-- custom_data의 JSONB 필드에 대한 인덱스 (GIN)
CREATE INDEX IF NOT EXISTS idx_projects_custom_data ON public.projects USING GIN (custom_data);

-- ========================================
-- 3. evaluations 테이블
-- ========================================
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 프로젝트 및 사용자 정보
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_nickname TEXT,
  username TEXT,
  user_job TEXT,

  -- 평가 내용
  score NUMERIC(3, 2), -- 0.00 ~ 5.00
  proposal TEXT, -- 평가자의 제안/의견
  expertise TEXT[], -- 전문성 배열

  -- 커스텀 답변 (JSONB)
  custom_answers JSONB DEFAULT '{}'::jsonb,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건: 한 사용자가 한 프로젝트에 하나의 평가만 작성
  UNIQUE(project_id, user_id)
);

-- evaluations 인덱스
CREATE INDEX IF NOT EXISTS idx_evaluations_project_id ON public.evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON public.evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_email ON public.evaluations(user_email);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON public.evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_score ON public.evaluations(score DESC);

-- ========================================
-- 4. inquiries 테이블 (1:1 문의)
-- ========================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 프로젝트 정보
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_title TEXT,

  -- 수신자 정보
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_email TEXT NOT NULL,

  -- 발신자 정보
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT,

  -- 문의 내용
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  inquiry_type TEXT DEFAULT 'general' CHECK (inquiry_type IN ('general', 'proposal')),
  is_private BOOLEAN DEFAULT false,

  -- 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'closed')),

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- inquiries 인덱스
CREATE INDEX IF NOT EXISTS idx_inquiries_receiver_id ON public.inquiries(receiver_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_receiver_email ON public.inquiries(receiver_email);
CREATE INDEX IF NOT EXISTS idx_inquiries_sender_id ON public.inquiries(sender_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_sender_email ON public.inquiries(sender_email);
CREATE INDEX IF NOT EXISTS idx_inquiries_project_id ON public.inquiries(project_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- ========================================
-- 5. proposals 테이블 (협업 제안)
-- ========================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 프로젝트 정보
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_title TEXT,

  -- 발신자 정보
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_photo TEXT,

  -- 수신자 정보
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_email TEXT,

  -- 제안 내용
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  contact TEXT NOT NULL, -- 연락처 (이메일)

  -- 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'accepted', 'rejected', 'closed')),

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- proposals 인덱스
CREATE INDEX IF NOT EXISTS idx_proposals_receiver_id ON public.proposals(receiver_id);
CREATE INDEX IF NOT EXISTS idx_proposals_receiver_email ON public.proposals(receiver_email);
CREATE INDEX IF NOT EXISTS idx_proposals_sender_id ON public.proposals(sender_id);
CREATE INDEX IF NOT EXISTS idx_proposals_sender_email ON public.proposals(sender_email);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON public.proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at DESC);

-- ========================================
-- 6. project_likes 테이블 (좋아요)
-- ========================================
CREATE TABLE IF NOT EXISTS public.project_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 프로젝트 및 사용자 정보
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건: 한 사용자가 한 프로젝트에 하나의 좋아요만
  UNIQUE(project_id, user_id)
);

-- project_likes 인덱스
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON public.project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON public.project_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_created_at ON public.project_likes(created_at DESC);

-- ========================================
-- Row Level Security (RLS) 정책
-- ========================================
-- 기존 정책들을 먼저 삭제하고 새로 생성

-- 1. profiles 테이블 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- 모든 사용자가 공개 프로필 읽기 가능
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 삭제 가능
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- 2. projects 테이블 RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- 공개 프로젝트는 모두가 조회 가능
CREATE POLICY "Public projects are viewable by everyone"
  ON public.projects FOR SELECT
  USING (visibility = 'public' OR author_id = auth.uid());

-- 인증된 사용자는 프로젝트 생성 가능
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- 작성자는 자신의 프로젝트만 수정 가능
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = author_id);

-- 작성자는 자신의 프로젝트만 삭제 가능
CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = author_id);

-- 3. evaluations 테이블 RLS
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Project authors and evaluators can view evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Authenticated users can create evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users can update own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users can delete own evaluations" ON public.evaluations;

-- 프로젝트 작성자와 평가 작성자는 평가 조회 가능
CREATE POLICY "Project authors and evaluators can view evaluations"
  ON public.evaluations FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT author_id FROM public.projects WHERE id = project_id)
  );

-- 인증된 사용자는 평가 생성 가능
CREATE POLICY "Authenticated users can create evaluations"
  ON public.evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 평가 작성자는 자신의 평가만 수정 가능
CREATE POLICY "Users can update own evaluations"
  ON public.evaluations FOR UPDATE
  USING (auth.uid() = user_id);

-- 평가 작성자는 자신의 평가만 삭제 가능
CREATE POLICY "Users can delete own evaluations"
  ON public.evaluations FOR DELETE
  USING (auth.uid() = user_id);

-- 4. inquiries 테이블 RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Sender and receiver can view inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Receiver can update inquiry status" ON public.inquiries;

-- 발신자와 수신자만 문의 조회 가능
CREATE POLICY "Sender and receiver can view inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 인증된 사용자는 문의 생성 가능
CREATE POLICY "Authenticated users can create inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 수신자는 문의 상태 업데이트 가능
CREATE POLICY "Receiver can update inquiry status"
  ON public.inquiries FOR UPDATE
  USING (auth.uid() = receiver_id);

-- 5. proposals 테이블 RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Sender and receiver can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Receiver can update proposal status" ON public.proposals;

-- 발신자와 수신자만 제안 조회 가능
CREATE POLICY "Sender and receiver can view proposals"
  ON public.proposals FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 인증된 사용자는 제안 생성 가능
CREATE POLICY "Authenticated users can create proposals"
  ON public.proposals FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 수신자는 제안 상태 업데이트 가능
CREATE POLICY "Receiver can update proposal status"
  ON public.proposals FOR UPDATE
  USING (auth.uid() = receiver_id);

-- 6. project_likes 테이블 RLS
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Everyone can view likes" ON public.project_likes;
DROP POLICY IF EXISTS "Authenticated users can like projects" ON public.project_likes;
DROP POLICY IF EXISTS "Users can unlike projects" ON public.project_likes;

-- 모든 사용자가 좋아요 조회 가능
CREATE POLICY "Everyone can view likes"
  ON public.project_likes FOR SELECT
  USING (true);

-- 인증된 사용자는 좋아요 추가 가능
CREATE POLICY "Authenticated users can like projects"
  ON public.project_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 좋아요만 삭제 가능
CREATE POLICY "Users can unlike projects"
  ON public.project_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 트리거 및 함수
-- ========================================

-- 1. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles updated_at 트리거
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- projects updated_at 트리거
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- evaluations updated_at 트리거
DROP TRIGGER IF EXISTS update_evaluations_updated_at ON public.evaluations;
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. projects 통계 자동 업데이트 함수 (좋아요 개수)
CREATE OR REPLACE FUNCTION public.update_project_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.projects
    SET likes_count = likes_count + 1
    WHERE id = NEW.project_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.projects
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- project_likes 트리거
DROP TRIGGER IF EXISTS update_project_likes_count_trigger ON public.project_likes;
CREATE TRIGGER update_project_likes_count_trigger
  AFTER INSERT OR DELETE ON public.project_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_likes_count();

-- 3. projects 통계 자동 업데이트 함수 (평가 개수)
CREATE OR REPLACE FUNCTION public.update_project_evaluations_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.projects
    SET evaluations_count = evaluations_count + 1
    WHERE id = NEW.project_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.projects
    SET evaluations_count = GREATEST(evaluations_count - 1, 0)
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- evaluations 트리거
DROP TRIGGER IF EXISTS update_project_evaluations_count_trigger ON public.evaluations;
CREATE TRIGGER update_project_evaluations_count_trigger
  AFTER INSERT OR DELETE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_evaluations_count();

-- ========================================
-- 완료!
-- ========================================
-- 이 스키마를 Supabase SQL Editor에서 실행하세요.
-- 실행 후 다음 단계:
-- 1. Supabase Dashboard에서 테이블 생성 확인
-- 2. RLS 정책 활성화 확인
-- 3. 마이그레이션 스크립트로 데이터 이전
-- ========================================
