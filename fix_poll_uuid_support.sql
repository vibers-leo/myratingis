-- ========================================
-- ProjectPoll UUID 지원 마이그레이션
-- ========================================
-- 목적: ProjectPoll.project_id를 bigint에서 text로 변경하여
--       UUID 기반 프로젝트(projects 테이블)도 투표할 수 있도록 합니다.
-- 실행: Supabase SQL Editor에서 실행하세요.
-- ========================================

-- 1. 기존 인덱스 삭제 (project_id 타입 변경 전에 필요)
DROP INDEX IF EXISTS idx_poll_user;
DROP INDEX IF EXISTS idx_poll_guest;

-- 2. project_id 타입을 bigint → text로 변경
ALTER TABLE "ProjectPoll" ALTER COLUMN project_id TYPE text USING project_id::text;

-- 3. 유니크 인덱스 재생성 (text 타입 기준)
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_user
ON "ProjectPoll" (project_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_guest
ON "ProjectPoll" (project_id, guest_id)
WHERE guest_id IS NOT NULL;

-- 스키마 리로드
NOTIFY pgrst, 'reload schema';
