-- ========================================
-- ProjectRating UUID 지원 마이그레이션
-- ========================================
-- 목적: ProjectRating.project_id를 bigint에서 text로 변경하여
--       UUID 기반 프로젝트(projects 테이블)도 평가할 수 있도록 합니다.
-- 실행: Supabase SQL Editor에서 실행하세요.
-- ========================================

-- 1. 기존 부분 인덱스 삭제 (project_id 타입 변경 전에 필요)
DROP INDEX IF EXISTS idx_rating_user;
DROP INDEX IF EXISTS idx_rating_guest;

-- 2. project_id 타입을 bigint → text로 변경
-- 기존 정수값은 자동으로 문자열로 변환됩니다 (예: 42 → "42")
ALTER TABLE "ProjectRating" ALTER COLUMN project_id TYPE text USING project_id::text;

-- 3. 부분 유니크 인덱스 재생성 (text 타입 기준)
-- 로그인 유저용
CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_user
ON "ProjectRating" (project_id, user_id)
WHERE user_id IS NOT NULL;

-- 게스트 유저용
CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_guest
ON "ProjectRating" (project_id, guest_id)
WHERE guest_id IS NOT NULL;
