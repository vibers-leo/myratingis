-- [MyRatingIs] Profiles Table Expansion
-- Adding demographic info fields for better reporting

-- 1. Add gender column
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender text;
    END IF;
END $$;

-- 2. Add age_range column (e.g. '10s', '20s', '30s', etc.)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age_range') THEN
        ALTER TABLE public.profiles ADD COLUMN age_range text;
    END IF;
END $$;

-- 3. Add occupation column
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'occupation') THEN
        ALTER TABLE public.profiles ADD COLUMN occupation text;
    END IF;
END $$;

-- Comment for clarity
COMMENT ON COLUMN public.profiles.gender IS '사용자 성별 (male, female, other, secret)';
COMMENT ON COLUMN public.profiles.age_range IS '사용자 연령대 (10s, 20s, 30s, 40s, 50s+)';
COMMENT ON COLUMN public.profiles.occupation IS '사용자 직업/분야 (student, dev, designer, marketer, pm, other)';
