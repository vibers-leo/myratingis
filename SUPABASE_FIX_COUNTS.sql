-- ==========================================
-- 카운팅 트리거 권한 수정 및 데이터 동기화
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요
-- ==========================================

-- 1. 좋아요 카운트 함수: SECURITY DEFINER 추가 (RLS 우회)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 댓글 카운트 함수: SECURITY DEFINER 추가 (RLS 우회)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 기존 카운트 데이터 강제 동기화 (0으로 표시되는 문제 해결)
UPDATE "Project" p
SET likes_count = (
  SELECT COUNT(*) FROM "Like" l WHERE l.project_id = p.project_id
),
comments_count = (
  SELECT COUNT(*) FROM "Comment" c WHERE c.project_id = p.project_id
);

-- 4. 조회수(views) 데이터를 views_count로 마이그레이션 (필요한 경우)
UPDATE "Project"
SET views_count = views
WHERE views_count = 0 AND views > 0;

SELECT '카운팅 권한 수정 및 동기화가 완료되었습니다.' as result;
