-- Create new tables for Social Features

-- 1. Project Likes (Already exists in some form, but ensuring standard table)
CREATE TABLE IF NOT EXISTS "ProjectLike" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "Project"("project_id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE("project_id", "user_id")
);

-- 2. Collections (Bookmarks)
CREATE TABLE IF NOT EXISTS "Collection" (
  "collection_id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL DEFAULT 'My Collection',
  "type" TEXT DEFAULT 'default', -- default, series, etc.
  "is_public" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS "CollectionItem" (
  "id" SERIAL PRIMARY KEY,
  "collection_id" INTEGER NOT NULL REFERENCES "Collection"("collection_id") ON DELETE CASCADE,
  "project_id" INTEGER NOT NULL REFERENCES "Project"("project_id") ON DELETE CASCADE,
  "added_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE("collection_id", "project_id")
);

-- 3. Project Inquiries (1:1 Questions)
CREATE TABLE IF NOT EXISTS "ProjectInquiry" (
  "inquiry_id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "Project"("project_id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, -- Sender
  "content" TEXT NOT NULL,
  "is_private" BOOLEAN DEFAULT true, -- Usually 1:1 is private
  "status" TEXT DEFAULT 'pending', -- pending, answered, closed
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS "ProjectInquiryReply" (
  "reply_id" SERIAL PRIMARY KEY,
  "inquiry_id" INTEGER NOT NULL REFERENCES "ProjectInquiry"("inquiry_id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, -- Responder (usually owner)
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- RLS Policies
ALTER TABLE "ProjectLike" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CollectionItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectInquiryReply" ENABLE ROW LEVEL SECURITY;

-- ProjectLike Policies
CREATE POLICY "Public likes are viewable by everyone" ON "ProjectLike" FOR SELECT USING (true);
CREATE POLICY "Users can insert their own like" ON "ProjectLike" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own like" ON "ProjectLike" FOR DELETE USING (auth.uid() = user_id);

-- Collection Policies
CREATE POLICY "Users can view their own collections" ON "Collection" FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can create collections" ON "Collection" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON "Collection" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON "Collection" FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view items in accessible collections" ON "CollectionItem" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "Collection" c WHERE c.collection_id = "CollectionItem".collection_id AND (c.user_id = auth.uid() OR c.is_public = true))
);
CREATE POLICY "Users can add items to own collections" ON "CollectionItem" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM "Collection" c WHERE c.collection_id = "CollectionItem".collection_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can remove items from own collections" ON "CollectionItem" FOR DELETE USING (
  EXISTS (SELECT 1 FROM "Collection" c WHERE c.collection_id = "CollectionItem".collection_id AND c.user_id = auth.uid())
);

-- Inquiry Policies
CREATE POLICY "Owners and Senders can view inquiries" ON "ProjectInquiry" FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM "Project" p WHERE p.project_id = "ProjectInquiry".project_id AND p.user_id = auth.uid())
);
CREATE POLICY "Users can create inquiries" ON "ProjectInquiry" FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle likes count trigger
CREATE OR REPLACE FUNCTION update_project_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE "Project" SET likes_count = likes_count + 1 WHERE project_id = NEW.project_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE "Project" SET likes_count = GREATEST(0, likes_count - 1) WHERE project_id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_likes_count
AFTER INSERT OR DELETE ON "ProjectLike"
FOR EACH ROW EXECUTE FUNCTION update_project_likes_count();
