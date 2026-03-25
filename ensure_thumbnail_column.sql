-- Ensure Project table has thumbnail_url column
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "thumbnail_url" TEXT;

-- Also ensure it exists in 'projects' if table casing is flexible/different
CREATE TABLE IF NOT EXISTS projects (id serial); -- dummy check to avoid error if not exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "thumbnail_url" TEXT;
    END IF;
END $$;

-- Check if site_url and media_type exist too, as we used them in the API
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "site_url" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "media_type" TEXT;
