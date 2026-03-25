import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;

  try {
    // 1. 현재 사용자 확인 (선택적)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    }

    // 2. project_rewards 조회
    const { data: reward, error: rewardError } = await supabaseAdmin
      .from('project_rewards')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json({ success: true, reward: null });
    }

    // 3. reward_item 조회 (coupon 타입일 때)
    let rewardItem = null;
    if (reward.reward_item_id) {
      const { data } = await supabaseAdmin
        .from('reward_items')
        .select('*')
        .eq('id', reward.reward_item_id)
        .single();
      rewardItem = data;
    }

    // 4. 수령자 목록 (가림처리)
    const { data: claims } = await supabaseAdmin
      .from('reward_claims')
      .select('id, user_id, status, claimed_at, amount')
      .eq('project_reward_id', reward.id)
      .order('claimed_at', { ascending: false });

    // 수령자 닉네임 가림처리
    const claimList = [];
    if (claims && claims.length > 0) {
      const userIds = claims.map((c: any) => c.user_id);
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, username, nickname')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, p.username || p.nickname || 'User'])
      );

      for (const claim of claims) {
        const name = profileMap.get(claim.user_id) || 'User';
        const masked = name.length > 2
          ? name.substring(0, 2) + '*'.repeat(3)
          : name.substring(0, 1) + '*'.repeat(3);

        claimList.push({
          id: claim.id,
          maskedName: masked,
          status: claim.status,
          amount: claim.amount,
          claimed_at: claim.claimed_at,
        });
      }
    }

    // 5. 현재 사용자 수령 상태
    let myClaimStatus: string | null = null;
    if (userId) {
      const myClaim = claims?.find((c: any) => c.user_id === userId);
      myClaimStatus = myClaim?.status || null;
    }

    return NextResponse.json({
      success: true,
      reward: {
        id: reward.id,
        reward_type: reward.reward_type,
        amount_per_person: reward.amount_per_person,
        total_slots: reward.total_slots,
        claimed_count: reward.claimed_count,
        distribution_method: reward.distribution_method,
        status: reward.status,
        lottery_date: reward.lottery_date,
        reward_item: rewardItem,
      },
      claims: claimList,
      myClaimStatus,
    });
  } catch (error: any) {
    console.error('[Rewards GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
