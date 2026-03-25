-- Add is_deleted column to Project table
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_project_is_deleted ON "Project"(is_deleted);
