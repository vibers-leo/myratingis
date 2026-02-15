-- ========================================
-- ProjectRating 최종 수정 (진단 + 수정 + 테스트)
-- Supabase SQL Editor에서 실행하세요
-- ========================================

-- ===== STEP 1: 진단 - 외래키, 트리거, RLS 정책 확인 =====

-- 1a. 외래키 제약조건 확인 (bigint FK가 원인일 수 있음)
DO $$
DECLARE
    fk RECORD;
BEGIN
    RAISE NOTICE '=== Foreign Key Constraints ===';
    FOR fk IN
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint
        WHERE conrelid = '"ProjectRating"'::regclass AND contype = 'f'
    LOOP
        RAISE NOTICE 'FK: % -> %', fk.conname, fk.def;
    END LOOP;
END $$;

-- 1b. 트리거 확인
DO $$
DECLARE
    trg RECORD;
BEGIN
    RAISE NOTICE '=== Triggers ===';
    FOR trg IN
        SELECT tgname FROM pg_trigger
        WHERE tgrelid = '"ProjectRating"'::regclass AND NOT tgisinternal
    LOOP
        RAISE NOTICE 'Trigger: %', trg.tgname;
    END LOOP;
END $$;

-- 1c. 모든 제약조건 확인
DO $$
DECLARE
    con RECORD;
BEGIN
    RAISE NOTICE '=== All Constraints ===';
    FOR con IN
        SELECT conname, contype, pg_get_constraintdef(oid) as def
        FROM pg_constraint
        WHERE conrelid = '"ProjectRating"'::regclass
    LOOP
        RAISE NOTICE 'Constraint: % (type: %) -> %', con.conname, con.contype, con.def;
    END LOOP;
END $$;

-- ===== STEP 2: 모든 FK 제약조건 삭제 (pkey 제외) =====
DO $$
DECLARE
    con RECORD;
BEGIN
    FOR con IN
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = '"ProjectRating"'::regclass
        AND contype != 'p'  -- primary key 제외
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE "ProjectRating" DROP CONSTRAINT IF EXISTS %I', con.conname);
            RAISE NOTICE 'Dropped constraint: % (type: %)', con.conname, con.contype;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop constraint: % (skipped)', con.conname;
        END;
    END LOOP;
END $$;

-- ===== STEP 3: 모든 인덱스 삭제 (pkey 제외) =====
DO $$
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'ProjectRating'
        AND indexname NOT LIKE '%pkey%'
    LOOP
        BEGIN
            EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
            RAISE NOTICE 'Dropped index: %', idx.indexname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop index: % (skipped)', idx.indexname;
        END;
    END LOOP;
END $$;

-- ===== STEP 4: 새 유니크 인덱스 생성 =====
CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_project_user
ON "ProjectRating" (project_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_project_guest
ON "ProjectRating" (project_id, guest_id)
WHERE guest_id IS NOT NULL;

-- ===== STEP 5: 함수 완전 삭제 후 재생성 =====
-- (DROP 먼저 해야 PostgREST 캐시가 확실히 갱신됨)
DROP FUNCTION IF EXISTS upsert_rating(text, uuid, text, double precision, double precision, double precision, double precision, double precision, double precision, double precision, text, jsonb, text);
DROP FUNCTION IF EXISTS upsert_rating(bigint, uuid, text, double precision, double precision, double precision, double precision, double precision, double precision, double precision, text, jsonb, text);
DROP FUNCTION IF EXISTS upsert_rating(bigint, uuid, text, float, float, float, float, float, float, float, text, jsonb, text);

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

-- ===== STEP 6: 스키마 리로드 =====
NOTIFY pgrst, 'reload schema';

-- ===== STEP 7: 테스트 (직접 함수 호출) =====
SELECT upsert_rating(
    'fb5bba9a-b445-46b9-9597-0cf73a9f243d'::text,
    NULL::uuid,
    'test-diag-12345'::text,
    3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0,
    'test proposal'::text,
    '{}'::jsonb,
    NULL::text
);

-- 테스트 데이터 정리
DELETE FROM "ProjectRating" WHERE guest_id = 'test-diag-12345';
