-- ========================================
-- ProjectRating 제약조건 + 인덱스 정리 및 upsert 함수 수정
-- ========================================
-- 핵심 원인: 기존 CONSTRAINT(project_rating_user_unique 등)가
--           bigint 타입으로 남아있어서 ON CONFLICT에서 bigint = text 에러 발생
-- 해결: CONSTRAINT 삭제 → 인덱스 삭제 → 타입 확인 → 새 인덱스 → 함수 재작성
-- 실행: Supabase SQL Editor에서 실행하세요.
-- ========================================

-- 1. 기존 CONSTRAINT 삭제 (DROP INDEX로는 삭제 불가!)
ALTER TABLE "ProjectRating" DROP CONSTRAINT IF EXISTS project_rating_user_unique;
ALTER TABLE "ProjectRating" DROP CONSTRAINT IF EXISTS project_rating_guest_unique;
ALTER TABLE "ProjectRating" DROP CONSTRAINT IF EXISTS projectrating_project_id_user_id_key;
ALTER TABLE "ProjectRating" DROP CONSTRAINT IF EXISTS projectrating_project_id_guest_id_key;
ALTER TABLE "ProjectRating" DROP CONSTRAINT IF EXISTS ProjectRating_project_id_user_id_key;
ALTER TABLE "ProjectRating" DROP CONSTRAINT IF EXISTS ProjectRating_project_id_guest_id_key;

-- 2. 기존 인덱스도 삭제
DROP INDEX IF EXISTS idx_rating_user;
DROP INDEX IF EXISTS idx_rating_guest;
DROP INDEX IF EXISTS idx_rating_project_user;
DROP INDEX IF EXISTS idx_rating_project_guest;

-- 3. 혹시 남아있는 project_id 관련 인덱스 모두 삭제 (동적)
DO $$
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'ProjectRating'
        AND indexname NOT LIKE '%pkey%'
        AND indexdef LIKE '%project_id%'
    LOOP
        BEGIN
            EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
            RAISE NOTICE 'Dropped index: %', idx.indexname;
        EXCEPTION WHEN OTHERS THEN
            -- 인덱스가 constraint에 종속된 경우 constraint로 삭제 시도
            BEGIN
                EXECUTE format('ALTER TABLE "ProjectRating" DROP CONSTRAINT IF EXISTS %I', idx.indexname);
                RAISE NOTICE 'Dropped constraint: %', idx.indexname;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop: % (skipped)', idx.indexname;
            END;
        END;
    END LOOP;
END $$;

-- 4. project_id 타입 확인 및 변경
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
        RAISE NOTICE 'project_id is already text - OK';
    END IF;
END $$;

-- 5. 새 유니크 인덱스 생성 (text 타입 기준)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_project_user
ON "ProjectRating" (project_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_project_guest
ON "ProjectRating" (project_id, guest_id)
WHERE guest_id IS NOT NULL;

-- 6. upsert_rating 함수 재생성 (ON CONFLICT 제거, SELECT→UPDATE/INSERT 방식)
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
    -- 기존 평가 조회
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

    -- 기존 평가가 있으면 UPDATE
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
    -- 없으면 INSERT
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
