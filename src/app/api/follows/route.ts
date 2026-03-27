// src/app/api/follows/route.ts — 팔로우 API (Prisma)
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
    const { following_id } = body;

    if (!following_id) return NextResponse.json({ error: 'following_id 필수' }, { status: 400 });
    if (authUser.id === following_id) return NextResponse.json({ error: '자기 자신을 팔로우할 수 없습니다.' }, { status: 400 });

    const existing = await prisma.follows.findFirst({
      where: { follower_id: authUser.id, following_id },
    });

    if (existing) {
      await prisma.follows.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false, message: '언팔로우' });
    } else {
      await prisma.follows.create({
        data: { follower_id: authUser.id, following_id },
      });
      return NextResponse.json({ following: true, message: '팔로우 완료' });
    }
  } catch (error) {
    console.error('[API/Follows] POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (followerId && followingId) {
      const follow = await prisma.follows.findFirst({
        where: { follower_id: followerId, following_id: followingId },
      });
      return NextResponse.json({ following: !!follow });
    }

    if (userId && type === 'followers') {
      const follows = await prisma.follows.findMany({
        where: { following_id: userId },
        orderBy: { created_at: 'desc' },
      });
      const followerIds = follows.map(f => f.follower_id);
      const profiles = followerIds.length > 0
        ? await prisma.profiles.findMany({
            where: { id: { in: followerIds } },
            select: { id: true, username: true, avatar_url: true },
          })
        : [];
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      const enriched = follows.map(f => ({
        ...f,
        follower_id: f.follower_id,
        user: profileMap.get(f.follower_id) || null,
      }));
      return NextResponse.json({ followers: enriched, count: follows.length });
    }

    if (userId && type === 'following') {
      const follows = await prisma.follows.findMany({
        where: { follower_id: userId },
        orderBy: { created_at: 'desc' },
      });
      const followingIds = follows.map(f => f.following_id);
      const profiles = followingIds.length > 0
        ? await prisma.profiles.findMany({
            where: { id: { in: followingIds } },
            select: { id: true, username: true, avatar_url: true },
          })
        : [];
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      const enriched = follows.map(f => ({
        ...f,
        following_id: f.following_id,
        user: profileMap.get(f.following_id) || null,
      }));
      return NextResponse.json({ following: enriched, count: follows.length });
    }

    if (userId) {
      const [followersCount, followingCount] = await Promise.all([
        prisma.follows.count({ where: { following_id: userId } }),
        prisma.follows.count({ where: { follower_id: userId } }),
      ]);
      return NextResponse.json({ followersCount, followingCount });
    }

    return NextResponse.json({ error: '파라미터 필요' }, { status: 400 });
  } catch (error) {
    console.error('[API/Follows] GET error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
