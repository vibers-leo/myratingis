// src/lib/auth/jwt.ts — JWT 토큰 생성/검증
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d'; // 7일

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT 토큰 생성
 */
export function createToken(payload: { sub: string; email: string; role?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * JWT 토큰 검증 — 유효하면 payload 반환, 아니면 null
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Authorization 헤더 또는 쿠키에서 토큰 추출
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim();
}
