// src/app/api/collections/route.ts — 컬렉션 관리 (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const collections = await prisma.collections.findMany({
      where: { user_id: authUser.id },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('[API/Collections] GET error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, is_public } = body;

    if (!name) {
      return NextResponse.json({ error: '컬렉션 이름이 필요합니다.' }, { status: 400 });
    }

    const collection = await prisma.collections.create({
      data: {
        user_id: authUser.id,
        name,
        description: description || '',
        is_public: is_public || false,
      },
    });

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('[API/Collections] POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
