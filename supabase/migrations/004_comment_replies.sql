-- 대댓글 기능을 위한 Comment 테이블 수정
-- parent_comment_id 컬럼 추가 (대댓글인 경우 부모 댓글 ID)
-- mentioned_user_id 컬럼 추가 (멘션된 사용자 ID)

ALTER TABLE "Comment" 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES "Comment"(comment_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_parent_id ON "Comment"(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentioned_user ON "Comment"(mentioned_user_id);

-- 대댓글 조회를 위한 뷰 (선택사항)
CREATE OR REPLACE VIEW comment_with_replies AS
SELECT 
  c.*,
  COUNT(r.comment_id) as reply_count
FROM "Comment" c
LEFT JOIN "Comment" r ON r.parent_comment_id = c.comment_id AND r.is_deleted = false
WHERE c.is_deleted = false
GROUP BY c.comment_id;
