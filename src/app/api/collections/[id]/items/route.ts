// src/app/api/collections/[id]/items/route.ts — 컬렉션 아이템 (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params;
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 });
    }

    // 소유자 확인
    const collection = await prisma.collections.findUnique({
      where: { id: collectionId },
      select: { user_id: true },
    });

    if (!collection) {
      return NextResponse.json({ error: '컬렉션을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (collection.user_id !== authUser.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 중복 확인
    const existing = await prisma.collection_items.findFirst({
      where: { collection_id: collectionId, project_id: projectId },
    });

    if (existing) {
      return NextResponse.json({ error: '이미 컬렉션에 추가된 프로젝트입니다.' }, { status: 400 });
    }

    const item = await prisma.collection_items.create({
      data: { collection_id: collectionId, project_id: projectId },
    });

    return NextResponse.json({ item, message: '컬렉션에 추가되었습니다.' });
  } catch (error) {
    console.error('[API/CollectionItems] POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params;
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 });
    }

    const collection = await prisma.collections.findUnique({
      where: { id: collectionId },
      select: { user_id: true },
    });

    if (!collection || collection.user_id !== authUser.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    await prisma.collection_items.deleteMany({
      where: { collection_id: collectionId, project_id: projectId },
    });

    return NextResponse.json({ message: '컬렉션에서 제거되었습니다.' });
  } catch (error) {
    console.error('[API/CollectionItems] DELETE error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
