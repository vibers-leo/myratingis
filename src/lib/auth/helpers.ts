// src/lib/auth/helpers.ts — API 라우트용 인증 헬퍼
import { NextRequest } from 'next/server';
import { verifyToken, extractToken, JwtPayload } from './jwt';
import prisma from '@/lib/db';

/**
 * API 라우트에서 현재 인증된 사용자 가져오기
 * Authorization: Bearer <jwt> 헤더에서 추출
 */
export async function getAuthUser(request: NextRequest): Promise<{
  id: string;
  email: string;
  role?: string;
} | null> {
  const authHeader = request.headers.get('Authorization');
  const token = extractToken(authHeader);

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

/**
 * 관리자 이메일 목록
 */
export const ADMIN_EMAILS = [
  'design@designdlab.co.kr',
  'highspringroad@gmail.com',
  'juuunoder@gmail.com',
  'juuuno@naver.com',
  'juuuno1116@gmail.com',
  'designd@designd.co.kr',
  'designdlab@designdlab.co.kr',
  'admin@myratingis.com',
];

/**
 * 관리자 여부 확인
 */
export async function isAdmin(userId: string, email?: string): Promise<boolean> {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) return true;

  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return profile?.role === 'admin';
}
