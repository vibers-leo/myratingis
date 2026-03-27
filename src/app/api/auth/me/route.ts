// src/app/api/auth/me/route.ts — 현재 로그인 사용자 조회
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/helpers';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다.' }, { status: 404 });
    }

    const { password_hash, ...safeProfile } = profile;

    return NextResponse.json({
      user: {
        id: safeProfile.id,
        email: safeProfile.email,
        username: safeProfile.username,
        nickname: safeProfile.nickname,
        avatar_url: safeProfile.avatar_url || safeProfile.profile_image,
        role: safeProfile.role,
        profile: safeProfile,
      },
    });
  } catch (error) {
    console.error('[Auth/Me] 서버 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
