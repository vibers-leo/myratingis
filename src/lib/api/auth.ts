// lib/api/auth.ts — API Key 인증 (Prisma 기반)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';

export interface AuthenticatedRequest {
  userId: string;
  apiKey: string;
  rateLimit: number;
}

/**
 * API Key 검증 및 사용자 인증
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; error: string; status: number }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or invalid Authorization header.', status: 401 };
  }

  const apiKey = authHeader.replace('Bearer ', '').trim();
  if (!apiKey || apiKey.length < 10) {
    return { success: false, error: 'Invalid API key format', status: 401 };
  }

  try {
    const keyData = await prisma.api_keys.findFirst({
      where: { api_key: apiKey, is_active: true },
    });

    if (!keyData) {
      return { success: false, error: 'Invalid or inactive API key', status: 401 };
    }

    if (keyData.expires_at && keyData.expires_at < new Date()) {
      return { success: false, error: 'API key has expired', status: 401 };
    }

    // 마지막 사용 시간 업데이트
    await prisma.api_keys.update({
      where: { id: keyData.id },
      data: { last_used_at: new Date() },
    });

    return {
      success: true,
      data: {
        userId: keyData.user_id,
        apiKey,
        rateLimit: keyData.rate_limit_per_minute || 60,
      },
    };
  } catch (error) {
    console.error('[API Auth] Error:', error);
    return { success: false, error: 'Internal server error', status: 500 };
  }
}

/**
 * 권한 확인 (scopes)
 */
export async function checkScope(apiKey: string, requiredScope: string): Promise<boolean> {
  try {
    const data = await prisma.api_keys.findFirst({
      where: { api_key: apiKey },
      select: { scopes: true },
    });

    if (!data || !data.scopes) return false;
    return data.scopes.includes(requiredScope);
  } catch {
    return false;
  }
}
