-- ===================================
-- 좋아요/조회수 카운팅 시스템
-- Supabase SQL Editor에서 실행하세요
-- ===================================

-- 1. Project 테이블에 카운트 컬럼 추가
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 2. 인덱스 생성 (정렬 성능 향상)
CREATE INDEX IF NOT EXISTS idx_project_likes_count ON "Project"(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_project_views_count ON "Project"(views_count DESC);

-- 3. 좋아요 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION update_project_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Project" 
    SET likes_count = likes_count + 1 
    WHERE project_id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "Project" 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE project_id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. 댓글 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION update_project_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Project" 
    SET comments_count = comments_count + 1 
    WHERE project_id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "Project" 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE project_id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 생성 (좋아요)
DROP TRIGGER IF EXISTS trigger_update_likes_count ON "Like";
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON "Like"
FOR EACH ROW
EXECUTE FUNCTION update_project_likes_count();

-- 6. 트리거 생성 (댓글)
DROP TRIGGER IF EXISTS trigger_update_comments_count ON "Comment";
CREATE TRIGGER trigger_update_comments_count
AFTER INSERT OR DELETE ON "Comment"
FOR EACH ROW
EXECUTE FUNCTION update_project_comments_count();

-- 7. 조회수 증가 RPC 함수
CREATE OR REPLACE FUNCTION increment_views(project_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE "Project" 
  SET views_count = views_count + 1 
  WHERE "Project".project_id = increment_views.project_id;
END;
$$ LANGUAGE plpgsql;

-- 8. 기존 데이터 카운트 동기화
UPDATE "Project" p
SET likes_count = (
  SELECT COUNT(*) FROM "Like" l WHERE l.project_id = p.project_id
),
comments_count = (
  SELECT COUNT(*) FROM "Comment" c WHERE c.project_id = p.project_id
);

-- 완료 메시지
SELECT 'Project 카운팅 시스템이 성공적으로 설정되었습니다!' as message;
