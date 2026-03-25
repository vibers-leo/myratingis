-- [MyRatingIs] Add 'alt_description' column to Project table
-- Run this SQL in Supabase SQL Editor

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Project'
        AND column_name = 'alt_description'
    ) THEN
        ALTER TABLE public."Project" ADD COLUMN alt_description text;
    END IF;
END $$;
