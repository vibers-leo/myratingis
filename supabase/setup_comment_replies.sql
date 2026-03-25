-- ===================================
-- 대댓글 기능을 위한 Comment 테이블 수정
-- Supabase SQL Editor에서 실행하세요
-- ===================================

-- 1. parent_comment_id 컬럼 추가 (대댓글)
ALTER TABLE "Comment" 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES "Comment"(comment_id) ON DELETE CASCADE;

-- 2. mentioned_user_id 컬럼 추가 (멘션)
ALTER TABLE "Comment" 
ADD COLUMN IF NOT EXISTS mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_parent_id ON "Comment"(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentioned_user ON "Comment"(mentioned_user_id);

-- 완료 메시지
SELECT 'Comment 테이블에 대댓글 컬럼이 성공적으로 추가되었습니다!' as message;
