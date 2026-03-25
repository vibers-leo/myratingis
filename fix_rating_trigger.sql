-- ========================================
-- 원인: update_project_rating_count() 트리거가
--       "Project".project_id(bigint) = NEW.project_id(text) 비교 시 에러
-- 해결: 트리거 함수를 UUID/정수 모두 처리하도록 수정
-- Supabase SQL Editor에서 실행하세요
-- ========================================

-- 트리거 함수 재작성
CREATE OR REPLACE FUNCTION update_project_rating_count()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- 정수형 project_id (기존 Project 테이블)만 업데이트
    -- UUID 형식이면 projects 테이블이므로 스킵
    IF NEW.project_id ~ '^\d+$' THEN
        UPDATE "Project"
        SET rating_count = rating_count + 1
        WHERE project_id = NEW.project_id::bigint;
    END IF;
    RETURN NEW;
END;
$$;

-- 스키마 리로드
NOTIFY pgrst, 'reload schema';

-- 테스트: UUID 프로젝트로 upsert_rating 호출
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
