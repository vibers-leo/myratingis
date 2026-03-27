// src/middleware.ts — JWT 기반 미들웨어 (Supabase 제거)
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // JWT 기반 인증은 클라이언트 localStorage에서 관리
  // 미들웨어에서는 단순 통과 (API 라우트에서 인증 검증)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/mypage/:path*',
    '/project/upload/:path*',
    '/project/edit/:path*',
    '/review/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
  ],
};
