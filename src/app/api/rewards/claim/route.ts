import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (!user || authError) {
      return NextResponse.json({ error: '인증에 실패했습니다.' }, { status: 401 });
    }

    // 2. 요청 파싱
    const { project_id } = await req.json();
    if (!project_id) {
      return NextResponse.json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 });
    }

    // 3. project_rewards 조회
    const { data: reward } = await supabaseAdmin
      .from('project_rewards')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (!reward) {
      return NextResponse.json({ error: '이 프로젝트에는 보상이 설정되지 않았습니다.' }, { status: 404 });
    }

    if (reward.status !== 'active' && reward.status !== 'pending_lottery') {
      return NextResponse.json({ error: '보상이 이미 마감되었습니다.' }, { status: 400 });
    }

    // 4. distribution_method에 따른 분기
    let result;

    if (reward.distribution_method === 'fcfs') {
      // 선착순: RPC 호출
      const { data, error } = await supabaseAdmin.rpc('claim_fcfs_reward', {
        p_project_id: project_id,
        p_user_id: user.id,
      });

      if (error) {
        console.error('[Reward Claim] RPC error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      result = data;
    } else if (reward.distribution_method === 'lottery' || reward.distribution_method === 'author') {
      // 추첨/작가선정: 응모 등록
      const { data, error } = await supabaseAdmin.rpc('claim_lottery_entry', {
        p_project_id: project_id,
        p_user_id: user.id,
      });

      if (error) {
        console.error('[Reward Claim] RPC error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      result = data;
    } else {
      return NextResponse.json({ error: '알 수 없는 배분 방식입니다.' }, { status: 400 });
    }

    // 5. 결과 처리
    if (!result?.success) {
      const errorMessages: Record<string, string> = {
        no_reward: '보상이 설정되지 않았습니다.',
        slots_full: '보상이 모두 소진되었습니다.',
        already_claimed: '이미 보상을 수령했습니다.',
        already_entered: '이미 응모했습니다.',
        no_evaluation: '먼저 평가를 완료해주세요.',
      };

      return NextResponse.json({
        success: false,
        error: errorMessages[result?.error] || result?.error || '보상 수령에 실패했습니다.',
      }, { status: 400 });
    }

    // 6. 알림 발송 (선착순 즉시 지급 시)
    if (reward.distribution_method === 'fcfs') {
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: user.id,
          type: 'reward',
          title: '보상이 지급되었습니다! 🎉',
          message: `${result.amount}P 보상이 지급되었습니다.`,
          link: '/mypage',
          read: false,
        });
      } catch (e) {
        console.warn('[Reward Claim] Notification failed:', e);
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Reward Claim] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
