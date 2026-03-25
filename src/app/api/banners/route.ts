import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// 배너 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageType = searchParams.get('pageType'); // 'discover' or 'connect'
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let query = (supabase as any)
      .from('Banner')
      .select('*')
      .order('display_order', { ascending: true });

    if (pageType) {
      query = query.eq('page_type', pageType);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('배너 조회 실패:', error);
      return NextResponse.json(
        { error: '배너를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ banners: data });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 배너 생성
export async function POST(request: NextRequest) {
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
    const { title, image_url, link_url, page_type, display_order } = body;

    const { data, error } = await (supabase as any)
      .from('Banner')
      .insert({
        title,
        image_url,
        link_url,
        page_type,
        display_order: display_order || 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('배너 생성 실패:', error);
      return NextResponse.json(
        { error: '배너 생성에 실패했습니다.' },
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
