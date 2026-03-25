-- ========================================
-- ProjectRating RPC 함수 (PostgREST 스키마 캐시 우회)
-- ========================================
-- 목적: PostgREST가 project_id의 text 타입 변경을 인식하지 못하는 문제를
--       RPC 함수로 우회합니다. 함수 내부에서 직접 SQL을 실행하므로 캐시 무관.
-- 실행: Supabase SQL Editor에서 실행하세요.
-- ========================================

-- 1. 프로젝트별 전체 평가 조회
CREATE OR REPLACE FUNCTION get_ratings_by_project(p_project_id TEXT)
RETURNS TABLE (
    id bigint,
    created_at timestamptz,
    updated_at timestamptz,
    project_id text,
    user_id uuid,
    guest_id text,
    score float8,
    score_1 float8,
    score_2 float8,
    score_3 float8,
    score_4 float8,
    score_5 float8,
    score_6 float8,
    proposal text,
    custom_answers jsonb,
    vote_type text
)
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT r.id, r.created_at, r.updated_at, r.project_id, r.user_id, r.guest_id,
           r.score, r.score_1, r.score_2, r.score_3, r.score_4, r.score_5, r.score_6,
           r.proposal, r.custom_answers, r.vote_type
    FROM "ProjectRating" r
    WHERE r.project_id = p_project_id;
$$;

-- 2. 특정 유저/게스트의 평가 조회
CREATE OR REPLACE FUNCTION get_user_rating(
    p_project_id TEXT,
    p_user_id UUID DEFAULT NULL,
    p_guest_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id bigint,
    created_at timestamptz,
    updated_at timestamptz,
    project_id text,
    user_id uuid,
    guest_id text,
    score float8,
    score_1 float8,
    score_2 float8,
    score_3 float8,
    score_4 float8,
    score_5 float8,
    score_6 float8,
    proposal text,
    custom_answers jsonb,
    vote_type text
)
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT r.id, r.created_at, r.updated_at, r.project_id, r.user_id, r.guest_id,
           r.score, r.score_1, r.score_2, r.score_3, r.score_4, r.score_5, r.score_6,
           r.proposal, r.custom_answers, r.vote_type
    FROM "ProjectRating" r
    WHERE r.project_id = p_project_id
    AND (
        (p_user_id IS NOT NULL AND r.user_id = p_user_id)
        OR
        (p_guest_id IS NOT NULL AND r.guest_id = p_guest_id)
    )
    LIMIT 1;
$$;

-- 3. 평가 저장 (Upsert)
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
BEGIN
    IF p_user_id IS NOT NULL THEN
        INSERT INTO "ProjectRating" (project_id, user_id, guest_id, score, score_1, score_2, score_3, score_4, score_5, score_6, proposal, custom_answers, vote_type, updated_at)
        VALUES (p_project_id, p_user_id, NULL, p_score, p_score_1, p_score_2, p_score_3, p_score_4, p_score_5, p_score_6, p_proposal, p_custom_answers, p_vote_type, NOW())
        ON CONFLICT (project_id, user_id) WHERE user_id IS NOT NULL
        DO UPDATE SET
            score = EXCLUDED.score,
            score_1 = EXCLUDED.score_1,
            score_2 = EXCLUDED.score_2,
            score_3 = EXCLUDED.score_3,
            score_4 = EXCLUDED.score_4,
            score_5 = EXCLUDED.score_5,
            score_6 = EXCLUDED.score_6,
            proposal = COALESCE(EXCLUDED.proposal, "ProjectRating".proposal),
            custom_answers = COALESCE(EXCLUDED.custom_answers, "ProjectRating".custom_answers),
            vote_type = COALESCE(EXCLUDED.vote_type, "ProjectRating".vote_type),
            updated_at = NOW();
    ELSIF p_guest_id IS NOT NULL THEN
        INSERT INTO "ProjectRating" (project_id, user_id, guest_id, score, score_1, score_2, score_3, score_4, score_5, score_6, proposal, custom_answers, vote_type, updated_at)
        VALUES (p_project_id, NULL, p_guest_id, p_score, p_score_1, p_score_2, p_score_3, p_score_4, p_score_5, p_score_6, p_proposal, p_custom_answers, p_vote_type, NOW())
        ON CONFLICT (project_id, guest_id) WHERE guest_id IS NOT NULL
        DO UPDATE SET
            score = EXCLUDED.score,
            score_1 = EXCLUDED.score_1,
            score_2 = EXCLUDED.score_2,
            score_3 = EXCLUDED.score_3,
            score_4 = EXCLUDED.score_4,
            score_5 = EXCLUDED.score_5,
            score_6 = EXCLUDED.score_6,
            proposal = COALESCE(EXCLUDED.proposal, "ProjectRating".proposal),
            custom_answers = COALESCE(EXCLUDED.custom_answers, "ProjectRating".custom_answers),
            vote_type = COALESCE(EXCLUDED.vote_type, "ProjectRating".vote_type),
            updated_at = NOW();
    END IF;
END;
$$;

-- 4. 프로필 포함 평가 조회 (리포트용)
CREATE OR REPLACE FUNCTION get_ratings_with_profiles(p_project_id TEXT)
RETURNS TABLE (
    id bigint,
    project_id text,
    user_id uuid,
    guest_id text,
    score float8,
    score_1 float8,
    score_2 float8,
    score_3 float8,
    score_4 float8,
    score_5 float8,
    score_6 float8,
    proposal text,
    custom_answers jsonb,
    vote_type text,
    created_at timestamptz,
    profile_username text,
    profile_expertise jsonb,
    profile_occupation text,
    profile_age_group text,
    profile_gender text
)
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT r.id, r.project_id, r.user_id, r.guest_id,
           r.score, r.score_1, r.score_2, r.score_3, r.score_4, r.score_5, r.score_6,
           r.proposal, r.custom_answers, r.vote_type, r.created_at,
           p.username, p.expertise, p.occupation, p.age_group, p.gender
    FROM "ProjectRating" r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.project_id = p_project_id;
$$;

-- 스키마 리로드
NOTIFY pgrst, 'reload schema';
