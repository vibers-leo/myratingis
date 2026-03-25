-- 1. Enable RLS on tables (if not already)
ALTER TABLE "ProjectRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectPoll" ENABLE ROW LEVEL SECURITY;

-- 2. Allow ANONYMOUS (Guest) INSERTs for Ratings
-- Drop existing policy to avoid conflict
DROP POLICY IF EXISTS "Enable insert for everyone" ON "ProjectRating";
DROP POLICY IF EXISTS "Everyone can insert ratings" ON "ProjectRating";

CREATE POLICY "Everyone can insert ratings"
ON "ProjectRating"
FOR INSERT
TO public
WITH CHECK (true);

-- 3. Allow READ access for Project Owner (and everyone for now to ensure visibility in report)
-- Ideally, we only allow owner, but for debugging, let's open read
DROP POLICY IF EXISTS "Enable read for everyone" ON "ProjectRating";
DROP POLICY IF EXISTS "Everyone can read ratings" ON "ProjectRating";

CREATE POLICY "Everyone can read ratings"
ON "ProjectRating"
FOR SELECT
TO public
USING (true);

-- 4. Repeat for ProjectPoll
DROP POLICY IF EXISTS "Enable insert for everyone" ON "ProjectPoll";
DROP POLICY IF EXISTS "Everyone can insert polls" ON "ProjectPoll";

CREATE POLICY "Everyone can insert polls"
ON "ProjectPoll"
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read for everyone" ON "ProjectPoll";
DROP POLICY IF EXISTS "Everyone can read polls" ON "ProjectPoll";

CREATE POLICY "Everyone can read polls"
ON "ProjectPoll"
FOR SELECT
TO public
USING (true);

-- 5. Fix Profiles Foreign Key if missing
-- Ensure ProjectRating has a foreign key to profiles, allowing nulls (for guests)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ProjectRating_user_id_fkey') THEN
        ALTER TABLE "ProjectRating"
        ADD CONSTRAINT "ProjectRating_user_id_fkey"
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. Ensure Guest Columns exist
ALTER TABLE "ProjectRating" ADD COLUMN IF NOT EXISTS guest_id TEXT;
ALTER TABLE "ProjectRating" ADD COLUMN IF NOT EXISTS proposal TEXT;

-- 7. Grant permissions to anon/authenticated roles explicitly
GRANT ALL ON "ProjectRating" TO anon, authenticated, service_role;
GRANT ALL ON "ProjectPoll" TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 8. [CRITICAL] Ensure Unique Constraints for UPSERT to work
-- Dropping potential duplicates first might be needed in production, but here we just try to add index
CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_project_user ON "ProjectRating" (project_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_project_guest ON "ProjectRating" (project_id, guest_id) WHERE guest_id IS NOT NULL;

-- 9. Recover/Migrate 'Project' table to standard casing if needed (Optional safety)
-- In case queries fail because of "Project" vs "projects"
