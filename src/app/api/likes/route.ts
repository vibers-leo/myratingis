// src/app/api/likes/route.ts — 좋아요 API (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const body = await request.json();
    const targetProjectId = body.projectId || body.project_id;

    if (!targetProjectId) {
      return NextResponse.json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 });
    }

    // 이미 좋아요했는지 확인
    const existing = await prisma.project_likes.findFirst({
      where: { user_id: authUser.id, project_id: targetProjectId },
    });

    if (existing) {
      await prisma.project_likes.delete({ where: { id: existing.id } });
      // likes_count 감소
      await prisma.projects.update({
        where: { id: targetProjectId },
        data: { likes_count: { decrement: 1 } },
      });
      return NextResponse.json({ liked: false, message: '좋아요 취소' });
    } else {
      await prisma.project_likes.create({
        data: { user_id: authUser.id, project_id: targetProjectId },
      });
      // likes_count 증가
      await prisma.projects.update({
        where: { id: targetProjectId },
        data: { likes_count: { increment: 1 } },
      });
      return NextResponse.json({ liked: true, message: '좋아요 추가' });
    }
  } catch (error) {
    console.error('[API/Likes] Error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId') || searchParams.get('project_id');

    if (userId && projectId) {
      const like = await prisma.project_likes.findFirst({
        where: { user_id: userId, project_id: projectId },
      });
      return NextResponse.json({ liked: !!like });
    }

    if (userId) {
      const likes = await prisma.project_likes.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
          projects: {
            select: { id: true, title: true, thumbnail_url: true, author_id: true },
          },
        },
      });

      const enrichedLikes = likes.map(like => ({
        project_id: like.project_id,
        created_at: like.created_at,
        Project: like.projects ? {
          project_id: like.projects.id,
          title: like.projects.title,
          thumbnail_url: like.projects.thumbnail_url,
          user_id: like.projects.author_id,
        } : null,
      }));

      return NextResponse.json({ likes: enrichedLikes });
    }

    if (projectId) {
      const count = await prisma.project_likes.count({
        where: { project_id: projectId },
      });
      return NextResponse.json({ count });
    }

    return NextResponse.json({ error: '파라미터 필요' }, { status: 400 });
  } catch (error) {
    console.error('[API/Likes] Error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
