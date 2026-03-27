// src/app/api/auth/signup/route.ts — 회원가입 API (자체 JWT)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nickname } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existing = await prisma.profiles.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해싱
    const passwordHash = await hashPassword(password);
    const displayName = nickname || email.split('@')[0];

    // 프로필 생성
    const profile = await prisma.profiles.create({
      data: {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        username: displayName,
        nickname: displayName,
        provider: 'email',
        role: 'user',
        points: 1000, // 가입 보너스
      },
    });

    // JWT 생성
    const token = createToken({
      sub: profile.id,
      email: profile.email!,
      role: profile.role || 'user',
    });

    const { password_hash, ...safeProfile } = profile;

    return NextResponse.json({
      message: '회원가입 성공',
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
    console.error('[Auth/Signup] 서버 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
