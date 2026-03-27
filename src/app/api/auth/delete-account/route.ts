// src/app/api/auth/delete-account/route.ts — 회원탈퇴 (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userId = authUser.id;
    console.log(`[Delete Account] Starting deletion for user: ${userId}`);

    // 관련 데이터 삭제 (CASCADE로 대부분 처리되지만 명시적 삭제)
    await Promise.allSettled([
      prisma.comments.deleteMany({ where: { user_id: userId } }),
      prisma.project_likes.deleteMany({ where: { user_id: userId } }),
      prisma.follows.deleteMany({ where: { OR: [{ follower_id: userId }, { following_id: userId }] } }),
      prisma.proposals.deleteMany({ where: { OR: [{ sender_id: userId }, { receiver_id: userId }] } }),
      prisma.mr_inquiries.deleteMany({ where: { OR: [{ sender_id: userId }, { receiver_id: userId }] } }),
      prisma.evaluations.deleteMany({ where: { user_id: userId } }),
      prisma.notifications.deleteMany({ where: { user_id: userId } }),
      prisma.bookmarks.deleteMany({ where: { user_id: userId } }),
      prisma.point_logs.deleteMany({ where: { user_id: userId } }),
    ]);

    // 컬렉션 삭제
    const collections = await prisma.collections.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    if (collections.length > 0) {
      const ids = collections.map(c => c.id);
      await prisma.collection_items.deleteMany({ where: { collection_id: { in: ids } } });
      await prisma.collections.deleteMany({ where: { user_id: userId } });
    }

    // 프로젝트 삭제
    await prisma.projects.deleteMany({ where: { author_id: userId } });

    // 프로필 삭제
    await prisma.profiles.delete({ where: { id: userId } });

    console.log(`[Delete Account] Successfully deleted user: ${userId}`);

    return NextResponse.json({ success: true, message: '계정이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('[Delete Account] Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
