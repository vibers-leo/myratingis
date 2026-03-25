-- 1. Add rating_count column to Project table
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 2. Update existing counts
UPDATE "Project" p
SET rating_count = (
    SELECT COUNT(*) 
    FROM "ProjectRating" pr 
    WHERE pr.project_id = p.project_id
);

-- 3. Create Function to update counts
CREATE OR REPLACE FUNCTION update_project_rating_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE "Project"
        SET rating_count = rating_count + 1
        WHERE project_id = NEW.project_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE "Project"
        SET rating_count = rating_count - 1
        WHERE project_id = OLD.project_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Trigger (Drop if exists to be safe)
DROP TRIGGER IF EXISTS trg_update_rating_count ON "ProjectRating";

CREATE TRIGGER trg_update_rating_count
AFTER INSERT OR DELETE ON "ProjectRating"
FOR EACH ROW
EXECUTE FUNCTION update_project_rating_count();

-- 5. Indexing for Performance
CREATE INDEX IF NOT EXISTS idx_project_rating_count ON "Project" (rating_count DESC);
CREATE INDEX IF NOT EXISTS idx_project_created_at ON "Project" (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_visibility ON "Project" (visibility);
