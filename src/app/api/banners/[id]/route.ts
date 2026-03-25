import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// 배너 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 확인
    const { data: admin } = await (supabase as any)
      .from('Admin')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, image_url, link_url, page_type, display_order, is_active } = body;

    const { data, error } = await (supabase as any)
      .from('Banner')
      .update({
        title,
        image_url,
        link_url,
        page_type,
        display_order,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('banner_id', id)
      .select()
      .single();

    if (error) {
      console.error('배너 수정 실패:', error);
      return NextResponse.json(
        { error: '배너 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ banner: data });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 배너 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 확인
    const { data: admin } = await (supabase as any)
      .from('Admin')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { error } = await (supabase as any)
      .from('Banner')
      .delete()
      .eq('banner_id', id);

    if (error) {
      console.error('배너 삭제 실패:', error);
      return NextResponse.json(
        { error: '배너 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '배너가 삭제되었습니다.' });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
