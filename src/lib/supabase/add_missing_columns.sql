-- [MyRatingIs] Add missing columns to Project table
-- Run this SQL in Supabase SQL Editor

-- 'allow_michelin_rating' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'allow_michelin_rating'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN allow_michelin_rating boolean DEFAULT true;
    END IF;
END $$;

-- 'allow_stickers' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'allow_stickers'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN allow_stickers boolean DEFAULT true;
    END IF;
END $$;

-- 'allow_secret_comments' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'allow_secret_comments'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN allow_secret_comments boolean DEFAULT true;
    END IF;
END $$;

-- 'audit_deadline' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'audit_deadline'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN audit_deadline timestamp with time zone;
    END IF;
END $$;

-- 'scheduled_at' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'scheduled_at'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN scheduled_at timestamp with time zone;
    END IF;
END $$;

-- 'is_growth_requested' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'is_growth_requested'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN is_growth_requested boolean DEFAULT false;
    END IF;
END $$;

-- 'views_count' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'views_count'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN views_count integer DEFAULT 0;
    END IF;
END $$;

-- 'likes_count' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN likes_count integer DEFAULT 0;
    END IF;
END $$;

-- 'visibility' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'visibility'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN visibility text DEFAULT 'public';
    END IF;
END $$;

-- 'deleted_at' 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN deleted_at timestamp with time zone;
    END IF;
END $$;
