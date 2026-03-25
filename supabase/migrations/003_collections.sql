-- Collection (컬렉션 폴더) 테이블
CREATE TABLE IF NOT EXISTS "Collection" (
  collection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CollectionItem (컬렉션에 저장된 프로젝트) 테이블
CREATE TABLE IF NOT EXISTS "CollectionItem" (
  collection_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES "Collection"(collection_id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES "Project"(project_id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, project_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_collection_user_id ON "Collection"(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_item_collection_id ON "CollectionItem"(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_item_project_id ON "CollectionItem"(project_id);

-- RLS 정책
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CollectionItem" ENABLE ROW LEVEL SECURITY;

-- Collection 정책
CREATE POLICY "Users can view their own collections"
  ON "Collection" FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own collections"
  ON "Collection" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON "Collection" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON "Collection" FOR DELETE
  USING (auth.uid() = user_id);

-- CollectionItem 정책
CREATE POLICY "Users can view items in their collections"
  ON "CollectionItem" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Collection"
      WHERE collection_id = "CollectionItem".collection_id
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Users can add items to their collections"
  ON "CollectionItem" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Collection"
      WHERE collection_id = "CollectionItem".collection_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from their collections"
  ON "CollectionItem" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "Collection"
      WHERE collection_id = "CollectionItem".collection_id
      AND user_id = auth.uid()
    )
  );
