import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;

  try {
    // RPC 함수로 PostgREST 스키마 캐시 우회
    const { data: ratings, error } = await supabaseAdmin
      .rpc('get_ratings_by_project', { p_project_id: projectId });

    if (error) throw error;

    return NextResponse.json({
        success: true,
        ratings: ratings || []
    });
  } catch (error: any) {
    console.error("Ratings Fetch Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
