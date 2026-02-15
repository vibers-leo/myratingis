-- ========================================
-- 누락된 RPC 함수 생성 + 트리거 수정
-- Supabase SQL Editor에서 실행하세요
-- ========================================

-- ===== STEP 1: get_ratings_with_profiles RPC 생성 =====
-- report API가 이 함수를 호출하지만 데이터베이스에 존재하지 않음
-- ProjectRating + profiles LEFT JOIN으로 평가 + 프로필 정보 반환

DROP FUNCTION IF EXISTS get_ratings_with_profiles(text);

CREATE OR REPLACE FUNCTION get_ratings_with_profiles(p_project_id TEXT)
RETURNS TABLE (
    id BIGINT,
    project_id TEXT,
    user_id UUID,
    guest_id TEXT,
    score DOUBLE PRECISION,
    score_1 DOUBLE PRECISION,
    score_2 DOUBLE PRECISION,
    score_3 DOUBLE PRECISION,
    score_4 DOUBLE PRECISION,
    score_5 DOUBLE PRECISION,
    score_6 DOUBLE PRECISION,
    vote_type TEXT,
    proposal TEXT,
    custom_answers JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    profile_username TEXT,
    profile_expertise JSONB,
    profile_occupation TEXT,
    profile_age_group TEXT,
    profile_gender TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.project_id,
        r.user_id,
        r.guest_id,
        r.score,
        r.score_1,
        r.score_2,
        r.score_3,
        r.score_4,
        r.score_5,
        r.score_6,
        r.vote_type,
        r.proposal,
        r.custom_answers,
        r.created_at,
        r.updated_at,
        p.username AS profile_username,
        p.expertise AS profile_expertise,
        p.occupation AS profile_occupation,
        p.age_group AS profile_age_group,
        p.gender AS profile_gender
    FROM "ProjectRating" r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.project_id = p_project_id
    ORDER BY r.created_at DESC;
END;
$$;

-- ===== STEP 2: update_project_evaluations_count 트리거 수정 =====
-- update_project_rating_count와 같은 bigint = text 문제가 있을 수 있음
-- 정수형 project_id만 처리하고, UUID면 스킵

CREATE OR REPLACE FUNCTION update_project_evaluations_count()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 정수형 project_id인 경우만 Project 테이블 업데이트
        IF NEW.project_id ~ '^\d+$' THEN
            UPDATE "Project"
            SET evaluation_count = COALESCE(evaluation_count, 0) + 1
            WHERE project_id = NEW.project_id::bigint;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.project_id ~ '^\d+$' THEN
            UPDATE "Project"
            SET evaluation_count = GREATEST(COALESCE(evaluation_count, 0) - 1, 0)
            WHERE project_id = OLD.project_id::bigint;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ===== STEP 3: update_project_likes_count 트리거도 같은 패턴으로 수정 =====
CREATE OR REPLACE FUNCTION update_project_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.project_id ~ '^\d+$' THEN
            UPDATE "Project"
            SET like_count = COALESCE(like_count, 0) + 1
            WHERE project_id = NEW.project_id::bigint;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.project_id ~ '^\d+$' THEN
            UPDATE "Project"
            SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
            WHERE project_id = OLD.project_id::bigint;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ===== STEP 4: 스키마 리로드 =====
NOTIFY pgrst, 'reload schema';

-- ===== STEP 5: get_ratings_with_profiles 테스트 =====
-- 실제 프로젝트 ID로 테스트 (결과가 있으면 성공)
SELECT * FROM get_ratings_with_profiles('fb5bba9a-b445-46b9-9597-0cf73a9f243d') LIMIT 5;
