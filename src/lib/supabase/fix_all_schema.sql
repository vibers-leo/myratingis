-- [MyRatingIs] 최종 DB 스키마 보정 스크립트 (Ultimate Fix)
-- 등록 에러(`Could not find...`)를 해결하기 위해 누락될 수 있는 모든 컬럼을 검사하고 추가합니다.
-- Supabase SQL Editor에서 이 내용을 복사해 실행해주세요.

DO $$
BEGIN
    -- 1. alt_description (현재 에러의 주원인!)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'alt_description') THEN
        ALTER TABLE public."Project" ADD COLUMN alt_description text;
    END IF;

    -- 2. allow_michelin_rating
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'allow_michelin_rating') THEN
        ALTER TABLE public."Project" ADD COLUMN allow_michelin_rating boolean DEFAULT true;
    END IF;

    -- 3. allow_stickers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'allow_stickers') THEN
        ALTER TABLE public."Project" ADD COLUMN allow_stickers boolean DEFAULT true;
    END IF;

    -- 4. allow_secret_comments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'allow_secret_comments') THEN
        ALTER TABLE public."Project" ADD COLUMN allow_secret_comments boolean DEFAULT true;
    END IF;

    -- 5. audit_deadline
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'audit_deadline') THEN
        ALTER TABLE public."Project" ADD COLUMN audit_deadline timestamp with time zone;
    END IF;

    -- 6. scheduled_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'scheduled_at') THEN
        ALTER TABLE public."Project" ADD COLUMN scheduled_at timestamp with time zone;
    END IF;

    -- 7. is_growth_requested
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'is_growth_requested') THEN
        ALTER TABLE public."Project" ADD COLUMN is_growth_requested boolean DEFAULT false;
    END IF;

    -- 8. deleted_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'deleted_at') THEN
        ALTER TABLE public."Project" ADD COLUMN deleted_at timestamp with time zone;
    END IF;
    
    -- 9. views_count & likes_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'views_count') THEN
        ALTER TABLE public."Project" ADD COLUMN views_count integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'likes_count') THEN
        ALTER TABLE public."Project" ADD COLUMN likes_count integer DEFAULT 0;
    END IF;

    -- 10. custom_data (없을 경우 대비)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'custom_data') THEN
        ALTER TABLE public."Project" ADD COLUMN custom_data jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;
