// src/app/api/auth/login/route.ts — 로그인 API (자체 JWT)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 프로필 조회
    const profile = await prisma.profiles.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!profile || !profile.password_hash) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const valid = await verifyPassword(password, profile.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 생성
    const token = createToken({
      sub: profile.id,
      email: profile.email!,
      role: profile.role || 'user',
    });

    // 프로필 정보 반환 (비밀번호 제외)
    const { password_hash, ...safeProfile } = profile;

    return NextResponse.json({
      message: '로그인 성공',
      token,
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
    console.error('[Auth/Login] 서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
