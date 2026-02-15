-- ========================================
-- ProjectRating 진단 쿼리
-- Supabase SQL Editor에서 실행하세요
-- ========================================

-- 1. project_id 컬럼의 실제 타입 확인
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'ProjectRating'
AND column_name = 'project_id';

-- 2. 현재 남아있는 제약조건(CONSTRAINT) 확인
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = '"ProjectRating"'::regclass;

-- 3. 현재 남아있는 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ProjectRating';

-- 4. upsert_rating 함수 정의 확인
SELECT prosrc
FROM pg_proc
WHERE proname = 'upsert_rating';
