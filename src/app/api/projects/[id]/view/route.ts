import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  if (!projectId) {
    return NextResponse.json(
      { error: '잘못된 프로젝트 ID입니다.' },
      { status: 400 }
    );
  }

  try {
    const parsedId = parseInt(projectId);
    const isNumeric = !isNaN(parsedId);

    // 1. "Project" 테이블 (integer PK) 업데이트
    if (isNumeric) {
      const { error: rpcError } = await supabaseAdmin
        .rpc('increment_views', { project_id: parsedId });

      if (rpcError) {
        // RPC 실패 시 직접 업데이트
        const { data: currentProject } = await supabaseAdmin
          .from('Project')
          .select('views_count')
          .eq('project_id', parsedId)
          .single();

        if (currentProject) {
          await supabaseAdmin
            .from('Project')
            .update({ views_count: (currentProject.views_count || 0) + 1 })
            .eq('project_id', parsedId);
        }
      }
    }

    // 2. "projects" 테이블 (UUID 또는 문자열 PK) 업데이트
    const { data: proj } = await (supabaseAdmin as any)
      .from('projects')
      .select('id, views_count')
      .eq('id', projectId)
      .single();

    if (proj) {
      await (supabaseAdmin as any)
        .from('projects')
        .update({ views_count: (proj.views_count || 0) + 1 })
        .eq('id', projectId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('조회수 증가 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
