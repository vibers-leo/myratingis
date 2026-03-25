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
    const { project_id, user_id: targetUserId } = await req.json();
    if (!project_id || !targetUserId) {
      return NextResponse.json({ error: '프로젝트 ID와 사용자 ID가 필요합니다.' }, { status: 400 });
    }

    // 3. 프로젝트 작성자 확인
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('author_id')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // admin 또는 프로젝트 작성자만 가능
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    if (project.author_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 4. project_rewards 조회
    const { data: reward } = await supabaseAdmin
      .from('project_rewards')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (!reward) {
      return NextResponse.json({ error: '보상이 설정되지 않았습니다.' }, { status: 404 });
    }

    // 5. 해당 사용자의 claim 찾기
    const { data: claim } = await supabaseAdmin
      .from('reward_claims')
      .select('*')
      .eq('project_reward_id', reward.id)
      .eq('user_id', targetUserId)
      .single();

    if (!claim) {
      return NextResponse.json({ error: '해당 사용자의 응모 기록이 없습니다.' }, { status: 404 });
    }

    if (claim.status === 'claimed') {
      return NextResponse.json({ error: '이미 보상이 지급되었습니다.' }, { status: 400 });
    }

    // 6. claim 상태 업데이트
    await supabaseAdmin
      .from('reward_claims')
      .update({ status: 'claimed', claimed_at: new Date().toISOString() })
      .eq('id', claim.id);

    // 7. 포인트 지급 (point 타입)
    if (reward.reward_type === 'point') {
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('points')
        .eq('id', targetUserId)
        .single();

      await supabaseAdmin
        .from('profiles')
        .update({ points: (targetProfile?.points || 0) + reward.amount_per_person })
        .eq('id', targetUserId);

      await supabaseAdmin.from('point_logs').insert({
        user_id: targetUserId,
        amount: reward.amount_per_person,
        reason: `작가 선정 보상 (Project ${project_id})`,
      });
    }

    // 8. 알림
    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      type: 'reward',
      title: '축하합니다! 작가님이 보상을 선정했습니다! 🏆',
      message: `${reward.amount_per_person}P 보상이 지급되었습니다.`,
      link: '/mypage',
      read: false,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Award] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
