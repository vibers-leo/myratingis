// src/app/api/comments/route.ts — 댓글 CRUD (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId가 필요합니다.' }, { status: 400 });
    }

    const currentUser = await getAuthUser(request);
    const currentUserId = currentUser?.id || null;

    // 프로젝트 소유자
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { author_id: true },
    });
    const projectOwnerId = project?.author_id;

    const comments = await prisma.comments.findMany({
      where: { project_id: projectId, is_deleted: false },
      orderBy: { created_at: 'desc' },
    });

    // 사용자 정보 조회
    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))] as string[];
    const profiles = userIds.length > 0
      ? await prisma.profiles.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, avatar_url: true, profile_image: true },
        })
      : [];
    const userMap = new Map(profiles.map(p => [p.id, p]));

    // 비밀 댓글 필터 + 사용자 정보 병합
    const filteredData = comments.map(comment => {
      const profile = comment.user_id ? userMap.get(comment.user_id) : null;
      let content = comment.content;

      if (comment.is_secret) {
        const isAuthor = currentUserId && comment.user_id === currentUserId;
        const isProjectOwner = currentUserId && projectOwnerId === currentUserId;
        if (!isAuthor && !isProjectOwner) {
          content = '비밀 댓글입니다.';
        }
      }

      return {
        comment_id: comment.id,
        user_id: comment.user_id,
        project_id: comment.project_id,
        content,
        parent_comment_id: comment.parent_comment_id,
        is_secret: comment.is_secret,
        created_at: comment.created_at,
        user: profile ? {
          username: profile.username || 'Unknown',
          profile_image_url: profile.avatar_url || profile.profile_image || '/globe.svg',
        } : { username: 'Unknown', profile_image_url: '/globe.svg' },
        replies: [] as any[],
      };
    });

    // 대댓글 구조화
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];
    filteredData.forEach(c => { commentMap.set(c.comment_id, c); });
    filteredData.forEach(c => {
      if (c.parent_comment_id) {
        const parent = commentMap.get(c.parent_comment_id);
        if (parent) parent.replies.push(c);
      } else {
        rootComments.push(c);
      }
    });

    return NextResponse.json({ comments: rootComments });
  } catch (error) {
    console.error('[API/Comments] GET error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, project_id, content, parentCommentId, isSecret, locationX, locationY } = body;
    const targetProjectId = projectId || project_id;

    if (!targetProjectId || !content) {
      return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
    }

    const comment = await prisma.comments.create({
      data: {
        user_id: authUser.id,
        project_id: targetProjectId,
        content,
        parent_comment_id: parentCommentId || null,
        is_secret: isSecret || false,
        location_x: locationX || null,
        location_y: locationY || null,
      },
    });

    // 사용자 정보
    const profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { username: true, avatar_url: true, profile_image: true },
    });

    return NextResponse.json({
      message: '댓글 작성 완료',
      comment: {
        ...comment,
        comment_id: comment.id,
        user: {
          username: profile?.username || 'Unknown',
          profile_image_url: profile?.avatar_url || profile?.profile_image || '/globe.svg',
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[API/Comments] POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('commentId');
    if (!commentId) return NextResponse.json({ error: 'commentId 필요' }, { status: 400 });

    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      select: { user_id: true },
    });

    if (!comment) return NextResponse.json({ error: '댓글 없음' }, { status: 404 });
    if (comment.user_id !== authUser.id) return NextResponse.json({ error: '삭제 권한 없음' }, { status: 403 });

    await prisma.comments.update({
      where: { id: commentId },
      data: { is_deleted: true },
    });

    return NextResponse.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('[API/Comments] DELETE error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
