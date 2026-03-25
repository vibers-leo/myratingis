-- 1. Ensure expertise column is JSONB
ALTER TABLE "profiles" 
ALTER COLUMN "expertise" TYPE JSONB USING "expertise"::jsonb;

-- 2. Enable RLS (if not already)
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

-- 3. Allow users to UPDATE their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON "profiles";
CREATE POLICY "Users can update own profile" 
ON "profiles" 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Allow users to INSERT their own profile (in case it's missing)
DROP POLICY IF EXISTS "Users can insert own profile" ON "profiles";
CREATE POLICY "Users can insert own profile" 
ON "profiles" 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 5. Allow users to Read their own profile
-- (Usually "Public profiles are viewable by everyone" is better, but let's ensure minimal access first)
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON "profiles";
-- CREATE POLICY "Public profiles are viewable by everyone" ON "profiles" FOR SELECT USING (true);
