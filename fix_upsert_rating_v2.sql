-- ========================================
-- upsert_rating 함수 수정 (ON CONFLICT 우회)
-- ========================================
-- 문제: ON CONFLICT 절에서 기존 bigint 인덱스와 새 text 타입 충돌
-- 해결: DELETE + INSERT 방식으로 변경하여 ON CONFLICT 완전 우회
-- 실행: Supabase SQL Editor에서 실행하세요.
-- ========================================

-- 0. 먼저 현재 상태 진단 (결과 확인용)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'ProjectRating' AND column_name = 'project_id';

-- 1. 혹시 남아있을 수 있는 기존 인덱스 모두 삭제
DO $$
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'ProjectRating'
        AND indexname NOT LIKE '%pkey%'
        AND (indexdef LIKE '%project_id%' AND (indexdef LIKE '%user_id%' OR indexdef LIKE '%guest_id%'))
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
        RAISE NOTICE 'Dropped index: %', idx.indexname;
    END LOOP;
END $$;

-- 2. project_id 타입 재확인 및 변경 (이미 text면 무시됨)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ProjectRating'
        AND column_name = 'project_id'
        AND data_type != 'text'
    ) THEN
        ALTER TABLE "ProjectRating" ALTER COLUMN project_id TYPE text USING project_id::text;
        RAISE NOTICE 'project_id changed to text';
    ELSE
        RAISE NOTICE 'project_id is already text';
    END IF;
END $$;

-- 3. 새 부분 유니크 인덱스 생성
CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_project_user
ON "ProjectRating" (project_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_project_guest
ON "ProjectRating" (project_id, guest_id)
WHERE guest_id IS NOT NULL;

-- 4. upsert_rating 함수 재생성 (ON CONFLICT 대신 DELETE + INSERT)
CREATE OR REPLACE FUNCTION upsert_rating(
    p_project_id TEXT,
    p_user_id UUID DEFAULT NULL,
    p_guest_id TEXT DEFAULT NULL,
    p_score FLOAT DEFAULT 3,
    p_score_1 FLOAT DEFAULT 3,
    p_score_2 FLOAT DEFAULT 3,
    p_score_3 FLOAT DEFAULT 3,
    p_score_4 FLOAT DEFAULT 3,
    p_score_5 FLOAT DEFAULT 3,
    p_score_6 FLOAT DEFAULT 3,
    p_proposal TEXT DEFAULT NULL,
    p_custom_answers JSONB DEFAULT '{}'::jsonb,
    p_vote_type TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    existing_id bigint;
    old_proposal TEXT;
    old_custom_answers JSONB;
    old_vote_type TEXT;
BEGIN
    -- 1) 기존 평가 조회 (SELECT은 타입 문제 없음)
    IF p_user_id IS NOT NULL THEN
        SELECT id, proposal, custom_answers, vote_type
        INTO existing_id, old_proposal, old_custom_answers, old_vote_type
        FROM "ProjectRating"
        WHERE project_id = p_project_id AND user_id = p_user_id
        LIMIT 1;
    ELSIF p_guest_id IS NOT NULL THEN
        SELECT id, proposal, custom_answers, vote_type
        INTO existing_id, old_proposal, old_custom_answers, old_vote_type
        FROM "ProjectRating"
        WHERE project_id = p_project_id AND guest_id = p_guest_id
        LIMIT 1;
    END IF;

    -- 2) 기존 평가가 있으면 UPDATE (id로 조회하므로 타입 문제 없음)
    IF existing_id IS NOT NULL THEN
        UPDATE "ProjectRating" SET
            score = p_score,
            score_1 = p_score_1,
            score_2 = p_score_2,
            score_3 = p_score_3,
            score_4 = p_score_4,
            score_5 = p_score_5,
            score_6 = p_score_6,
            proposal = COALESCE(p_proposal, old_proposal),
            custom_answers = COALESCE(p_custom_answers, old_custom_answers),
            vote_type = COALESCE(p_vote_type, old_vote_type),
            updated_at = NOW()
        WHERE id = existing_id;
    -- 3) 없으면 INSERT (ON CONFLICT 없이 직접 삽입)
    ELSE
        INSERT INTO "ProjectRating" (
            project_id, user_id, guest_id,
            score, score_1, score_2, score_3, score_4, score_5, score_6,
            proposal, custom_answers, vote_type, updated_at
        ) VALUES (
            p_project_id,
            CASE WHEN p_user_id IS NOT NULL THEN p_user_id ELSE NULL END,
            CASE WHEN p_guest_id IS NOT NULL THEN p_guest_id ELSE NULL END,
            p_score, p_score_1, p_score_2, p_score_3, p_score_4, p_score_5, p_score_6,
            p_proposal, p_custom_answers, p_vote_type, NOW()
        );
    END IF;
END;
$$;

-- 스키마 리로드
NOTIFY pgrst, 'reload schema';
