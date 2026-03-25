-- ===================================
-- 팔로우 기능을 위한 테이블 생성
-- Supabase SQL Editor에서 실행하세요
-- ===================================

-- 1. Follow 테이블 생성
CREATE TABLE IF NOT EXISTS "Follow" (
  follow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_follow_follower ON "Follow"(follower_id);
CREATE INDEX IF NOT EXISTS idx_follow_following ON "Follow"(following_id);

-- 3. RLS 활성화
ALTER TABLE "Follow" ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
DROP POLICY IF EXISTS "Users can view all follows" ON "Follow";
CREATE POLICY "Users can view all follows"
  ON "Follow" FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON "Follow";
CREATE POLICY "Users can follow others"
  ON "Follow" FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON "Follow";
CREATE POLICY "Users can unfollow"
  ON "Follow" FOR DELETE
  USING (auth.uid() = follower_id);

-- 완료 메시지
SELECT 'Follow 테이블 및 RLS 정책이 성공적으로 생성되었습니다!' as message;
