// src/app/auth/callback/route.ts — OAuth 콜백 (현재 비활성)
// 자체 JWT 인증으로 전환됨. 향후 Google OAuth 직접 구현 시 사용.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // 소셜 로그인은 현재 준비 중
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('소셜 로그인은 준비 중입니다. 이메일로 로그인해주세요.')}`);
}
