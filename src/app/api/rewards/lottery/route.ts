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

    // 3. 권한 확인 (admin 또는 프로젝트 작성자)
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('author_id')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    if (project.author_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 4. RPC로 추첨 실행
    const { data: result, error } = await supabaseAdmin.rpc('run_lottery', {
      p_project_id: project_id,
    });

    if (error) {
      console.error('[Lottery] RPC error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!result?.success) {
      const errorMessages: Record<string, string> = {
        no_reward: '보상이 설정되지 않았습니다.',
        not_lottery_type: '추첨 방식의 보상이 아닙니다.',
      };

      return NextResponse.json({
        success: false,
        error: errorMessages[result?.error] || result?.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      winners: result.winners,
      message: `${result.winners}명이 당첨되었습니다.`,
    });
  } catch (error: any) {
    console.error('[Lottery] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
