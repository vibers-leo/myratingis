// src/app/api/banners/route.ts — 배너 API (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser, isAdmin } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const activeOnly = request.nextUrl.searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (activeOnly) where.is_active = true;

    const banners = await prisma.banners.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('[API/Banners] Error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const admin = await isAdmin(authUser.id, authUser.email);
    if (!admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, image_url, link_url, display_order } = body;

    const banner = await prisma.banners.create({
      data: {
        title: title || '',
        image_url: image_url || null,
        link_url: link_url || null,
        display_order: display_order || 0,
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('[API/Banners] POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
