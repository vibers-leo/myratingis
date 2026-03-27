// src/app/api/comments/[id]/route.ts — 개별 댓글 삭제 (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const comment = await prisma.comments.findUnique({
      where: { id },
      select: { user_id: true },
    });

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (comment.user_id !== authUser.id) {
      return NextResponse.json({ error: '본인의 댓글만 삭제할 수 있습니다.' }, { status: 403 });
    }

    await prisma.comments.update({
      where: { id },
      data: { is_deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API/Comments/Delete] Error:', error);
    return NextResponse.json({ error: error.message || '댓글 삭제 중 오류' }, { status: 500 });
  }
}
