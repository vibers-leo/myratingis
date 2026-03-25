-- 1. Ensure all columns exist (Using ALTER TABLE to be safe if table already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='age_group') THEN
        ALTER TABLE public.profiles ADD COLUMN age_group text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='occupation') THEN
        ALTER TABLE public.profiles ADD COLUMN occupation text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='points') THEN
        ALTER TABLE public.profiles ADD COLUMN points integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='expertise') THEN
        ALTER TABLE public.profiles ADD COLUMN expertise jsonb DEFAULT '{"fields": []}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='interests') THEN
        ALTER TABLE public.profiles ADD COLUMN interests jsonb DEFAULT '{"genres": [], "fields": []}'::jsonb;
    END IF;
END $$;

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Re-create Policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- 4. Grant usage
grant usage on schema public to anon, authenticated;
grant all on public.profiles to anon, authenticated;
