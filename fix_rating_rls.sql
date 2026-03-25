-- 1. Enable RLS on ProjectRating if not enabled (it should be)
ALTER TABLE "ProjectRating" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure clean slate or update them
DROP POLICY IF EXISTS "Users can read own ratings" ON "ProjectRating";
DROP POLICY IF EXISTS "Users can insert own ratings" ON "ProjectRating";
DROP POLICY IF EXISTS "Users can update own ratings" ON "ProjectRating";
DROP POLICY IF EXISTS "Public can read ratings for public projects" ON "ProjectRating"; 

-- 3. Create Policy: Users can see their OWN ratings
CREATE POLICY "Users can read own ratings"
ON "ProjectRating"
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create Policy: Users can insert their own ratings
-- (Allows inserting if user_id matches auth.uid, OR if valid guest_id is handled by server-side logic usually, but for RLS we focus on auth users)
CREATE POLICY "Users can insert own ratings"
ON "ProjectRating"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Create Policy: Users can update their own ratings
CREATE POLICY "Users can update own ratings"
ON "ProjectRating"
FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Grant basic permissions
GRANT ALL ON "ProjectRating" TO authenticated;
GRANT ALL ON "ProjectRating" TO service_role;
