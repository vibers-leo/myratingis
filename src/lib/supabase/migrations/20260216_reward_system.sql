-- ========================================
-- 보상약속(보약) 시스템 마이그레이션
-- ========================================
-- 테이블: reward_items, project_rewards, reward_claims
-- RPC: claim_fcfs_reward, run_lottery
-- 트리거: update_reward_claimed_count
-- 실행: Supabase SQL Editor에서 실행
-- ========================================

-- ========================================
-- 1. reward_items (보상 카탈로그)
-- ========================================
CREATE TABLE IF NOT EXISTS public.reward_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'point'
    CHECK (category IN ('point', 'coffee', 'convenience', 'chicken', 'department', 'etc')),
  image_url TEXT,
  point_cost INTEGER NOT NULL DEFAULT 0,
  retail_price INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_items_category ON public.reward_items(category);
CREATE INDEX IF NOT EXISTS idx_reward_items_active ON public.reward_items(is_active);

ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward_items_select" ON public.reward_items
  FOR SELECT USING (true);

CREATE POLICY "reward_items_admin" ON public.reward_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 기본 시드 데이터
INSERT INTO public.reward_items (name, description, category, point_cost, retail_price, is_active, stock) VALUES
  ('아메리카노', '스타벅스 아메리카노 Tall', 'coffee', 500, 4500, true, -1),
  ('카페라떼', '스타벅스 카페라떼 Tall', 'coffee', 600, 5000, true, -1),
  ('편의점 3천원권', 'GS25/CU 모바일 상품권', 'convenience', 600, 3000, true, -1),
  ('편의점 5천원권', 'GS25/CU 모바일 상품권', 'convenience', 1000, 5000, true, -1),
  ('편의점 1만원권', 'GS25/CU 모바일 상품권', 'convenience', 2000, 10000, true, -1),
  ('치킨', 'BBQ/BHC 기프티콘', 'chicken', 3000, 20000, true, -1),
  ('배스킨라빈스 파인트', '배스킨라빈스 파인트 아이스크림', 'etc', 1200, 8500, true, -1),
  ('백화점 상품권 5만원', '신세계/롯데 상품권', 'department', 8000, 50000, true, -1)
ON CONFLICT DO NOTHING;

-- ========================================
-- 2. project_rewards (프로젝트별 보상 풀)
-- ========================================
CREATE TABLE IF NOT EXISTS public.project_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL DEFAULT 'point'
    CHECK (reward_type IN ('point', 'coupon')),
  reward_item_id UUID REFERENCES public.reward_items(id),
  amount_per_person INTEGER NOT NULL DEFAULT 0,
  total_slots INTEGER NOT NULL DEFAULT 0,
  claimed_count INTEGER DEFAULT 0,
  distribution_method TEXT NOT NULL DEFAULT 'fcfs'
    CHECK (distribution_method IN ('fcfs', 'lottery', 'author')),
  total_cost INTEGER DEFAULT 0,
  platform_fee INTEGER DEFAULT 0,
  tax INTEGER DEFAULT 0,
  total_charged INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled', 'pending_lottery')),
  lottery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_rewards_project ON public.project_rewards(project_id);
CREATE INDEX IF NOT EXISTS idx_project_rewards_status ON public.project_rewards(status);

ALTER TABLE public.project_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_rewards_select" ON public.project_rewards
  FOR SELECT USING (true);

CREATE POLICY "project_rewards_insert" ON public.project_rewards
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE author_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "project_rewards_update" ON public.project_rewards
  FOR UPDATE USING (
    project_id IN (SELECT id FROM public.projects WHERE author_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ========================================
-- 3. reward_claims (보상 수령 기록)
-- ========================================
CREATE TABLE IF NOT EXISTS public.reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_reward_id UUID NOT NULL REFERENCES public.project_rewards(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_item_id UUID REFERENCES public.reward_items(id),
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'claimed', 'delivered', 'cancelled', 'refunded')),
  delivery_info JSONB DEFAULT '{}'::jsonb,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  UNIQUE(project_reward_id, user_id)
);

-- 포인트샵 주문 (프로젝트와 무관한 포인트 구매)
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_item_id UUID NOT NULL REFERENCES public.reward_items(id),
  points_spent INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'ordered'
    CHECK (status IN ('ordered', 'processing', 'delivered', 'cancelled', 'refunded')),
  delivery_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reward_claims_user ON public.reward_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_project ON public.reward_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_reward ON public.reward_claims(project_reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_status ON public.reward_claims(status);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON public.shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON public.shop_orders(status);

ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward_claims_select_own" ON public.reward_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reward_claims_select_author" ON public.reward_claims
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE author_id = auth.uid())
  );

CREATE POLICY "reward_claims_select_admin" ON public.reward_claims
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "reward_claims_insert" ON public.reward_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_orders_select_own" ON public.shop_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "shop_orders_select_admin" ON public.shop_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "shop_orders_insert" ON public.shop_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 4. 트리거: claimed_count 자동 업데이트
-- ========================================
CREATE OR REPLACE FUNCTION public.update_reward_claimed_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'claimed') THEN
    UPDATE public.project_rewards
    SET claimed_count = claimed_count + 1,
        status = CASE
          WHEN claimed_count + 1 >= total_slots THEN 'completed'
          ELSE status
        END
    WHERE id = NEW.project_reward_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != 'claimed' AND NEW.status = 'claimed') THEN
    UPDATE public.project_rewards
    SET claimed_count = claimed_count + 1,
        status = CASE
          WHEN claimed_count + 1 >= total_slots THEN 'completed'
          ELSE status
        END
    WHERE id = NEW.project_reward_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.status = 'claimed') THEN
    UPDATE public.project_rewards
    SET claimed_count = GREATEST(claimed_count - 1, 0)
    WHERE id = OLD.project_reward_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_reward_claimed_count ON public.reward_claims;
CREATE TRIGGER trg_reward_claimed_count
  AFTER INSERT OR UPDATE OR DELETE ON public.reward_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reward_claimed_count();

-- ========================================
-- 5. RPC: claim_fcfs_reward (선착순 보상 수령)
-- ========================================
CREATE OR REPLACE FUNCTION public.claim_fcfs_reward(
  p_project_id UUID,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reward RECORD;
  v_amount INTEGER;
  v_claim_id UUID;
BEGIN
  -- 1. Lock the reward row
  SELECT * INTO v_reward FROM public.project_rewards
  WHERE project_id = p_project_id AND status = 'active'
  FOR UPDATE;

  IF v_reward IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_reward');
  END IF;

  -- 2. Check slots
  IF v_reward.claimed_count >= v_reward.total_slots THEN
    RETURN jsonb_build_object('success', false, 'error', 'slots_full');
  END IF;

  -- 3. Check duplicate
  IF EXISTS (
    SELECT 1 FROM public.reward_claims
    WHERE project_reward_id = v_reward.id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed');
  END IF;

  -- 4. Check evaluation exists
  IF NOT EXISTS (
    SELECT 1 FROM "ProjectRating"
    WHERE project_id = p_project_id::text AND user_id = p_user_id::text
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_evaluation');
  END IF;

  v_amount := v_reward.amount_per_person;

  -- 5. Insert claim (status: claimed → triggers claimed_count update)
  INSERT INTO public.reward_claims (
    project_reward_id, project_id, user_id,
    reward_type, reward_item_id, amount, status
  ) VALUES (
    v_reward.id, p_project_id, p_user_id,
    v_reward.reward_type, v_reward.reward_item_id, v_amount, 'claimed'
  ) RETURNING id INTO v_claim_id;

  -- 6. Award points if type is 'point'
  IF v_reward.reward_type = 'point' THEN
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + v_amount
    WHERE id = p_user_id;

    INSERT INTO public.point_logs (user_id, amount, reason)
    VALUES (p_user_id, v_amount, '평가 보상 수령 (Project ' || p_project_id || ')');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'claim_id', v_claim_id,
    'amount', v_amount,
    'type', v_reward.reward_type
  );
END;
$$;

-- ========================================
-- 6. RPC: claim_lottery_entry (추첨 응모)
-- ========================================
CREATE OR REPLACE FUNCTION public.claim_lottery_entry(
  p_project_id UUID,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reward RECORD;
  v_claim_id UUID;
BEGIN
  SELECT * INTO v_reward FROM public.project_rewards
  WHERE project_id = p_project_id AND status IN ('active', 'pending_lottery')
  FOR UPDATE;

  IF v_reward IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_reward');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reward_claims
    WHERE project_reward_id = v_reward.id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_entered');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "ProjectRating"
    WHERE project_id = p_project_id::text AND user_id = p_user_id::text
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_evaluation');
  END IF;

  INSERT INTO public.reward_claims (
    project_reward_id, project_id, user_id,
    reward_type, reward_item_id, amount, status
  ) VALUES (
    v_reward.id, p_project_id, p_user_id,
    v_reward.reward_type, v_reward.reward_item_id,
    v_reward.amount_per_person, 'pending'
  ) RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object('success', true, 'claim_id', v_claim_id, 'status', 'pending');
END;
$$;

-- ========================================
-- 7. RPC: run_lottery (추첨 실행)
-- ========================================
CREATE OR REPLACE FUNCTION public.run_lottery(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reward RECORD;
  v_winner RECORD;
  v_winner_count INTEGER := 0;
BEGIN
  SELECT * INTO v_reward FROM public.project_rewards
  WHERE project_id = p_project_id
  FOR UPDATE;

  IF v_reward IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_reward');
  END IF;

  IF v_reward.distribution_method != 'lottery' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_lottery_type');
  END IF;

  -- Select random winners
  FOR v_winner IN
    SELECT id, user_id FROM public.reward_claims
    WHERE project_reward_id = v_reward.id AND status = 'pending'
    ORDER BY random()
    LIMIT v_reward.total_slots
  LOOP
    -- Mark as claimed
    UPDATE public.reward_claims SET status = 'claimed' WHERE id = v_winner.id;

    -- Award points if type is 'point'
    IF v_reward.reward_type = 'point' THEN
      UPDATE public.profiles
      SET points = COALESCE(points, 0) + v_reward.amount_per_person
      WHERE id = v_winner.user_id;

      INSERT INTO public.point_logs (user_id, amount, reason)
      VALUES (v_winner.user_id, v_reward.amount_per_person,
              '추첨 당첨 보상 (Project ' || p_project_id || ')');
    END IF;

    -- Notification for winner
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
      v_winner.user_id, 'reward',
      '축하합니다! 보상 추첨에 당첨되었습니다! 🎉',
      v_reward.amount_per_person || 'P 보상이 지급되었습니다.',
      '/mypage', false
    );

    v_winner_count := v_winner_count + 1;
  END LOOP;

  -- Cancel non-winners
  UPDATE public.reward_claims
  SET status = 'cancelled'
  WHERE project_reward_id = v_reward.id AND status = 'pending';

  -- Notify non-winners
  INSERT INTO public.notifications (user_id, type, title, message, link, read)
  SELECT user_id, 'reward',
    '추첨 결과 안내',
    '아쉽게도 이번 추첨에 선정되지 않았습니다. 다음 기회를 노려주세요!',
    '/mypage', false
  FROM public.reward_claims
  WHERE project_reward_id = v_reward.id AND status = 'cancelled';

  -- Update reward status
  UPDATE public.project_rewards
  SET status = 'completed'
  WHERE id = v_reward.id;

  RETURN jsonb_build_object('success', true, 'winners', v_winner_count);
END;
$$;

-- ========================================
-- 8. RPC: purchase_reward_item (포인트샵 구매)
-- ========================================
CREATE OR REPLACE FUNCTION public.purchase_reward_item(
  p_user_id UUID,
  p_item_id UUID,
  p_delivery_info JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item RECORD;
  v_points INTEGER;
  v_claim_id UUID;
BEGIN
  -- 1. Get item
  SELECT * INTO v_item FROM public.reward_items
  WHERE id = p_item_id AND is_active = true
  FOR UPDATE;

  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
  END IF;

  -- 2. Check stock
  IF v_item.stock != -1 AND v_item.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'out_of_stock');
  END IF;

  -- 3. Check user points
  SELECT points INTO v_points FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF v_points IS NULL OR v_points < v_item.point_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_points',
      'required', v_item.point_cost, 'current', COALESCE(v_points, 0));
  END IF;

  -- 4. Deduct points
  UPDATE public.profiles
  SET points = points - v_item.point_cost
  WHERE id = p_user_id;

  -- 5. Log point deduction
  INSERT INTO public.point_logs (user_id, amount, reason)
  VALUES (p_user_id, -v_item.point_cost, '포인트샵 구매: ' || v_item.name);

  -- 6. Create shop order
  INSERT INTO public.shop_orders (
    user_id, reward_item_id, points_spent, status, delivery_info
  ) VALUES (
    p_user_id, p_item_id, v_item.point_cost, 'ordered', p_delivery_info
  ) RETURNING id INTO v_claim_id;

  -- 7. Reduce stock if not infinite
  IF v_item.stock != -1 THEN
    UPDATE public.reward_items SET stock = stock - 1 WHERE id = p_item_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_claim_id,
    'item_name', v_item.name,
    'points_spent', v_item.point_cost,
    'remaining_points', v_points - v_item.point_cost
  );
END;
$$;

-- 스키마 리로드
NOTIFY pgrst, 'reload schema';
