// 간단한 인메모리 Rate Limiter (Vercel Serverless 환경용)
// 인스턴스 간 공유 안 되지만, 기본 방어는 가능

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24시간
const MAX_REQUESTS_PER_USER = 20; // 사용자당 일 20회
const MAX_REQUESTS_PER_IP = 10; // 비로그인 IP당 일 10회

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const userLimits = new Map<string, RateLimitEntry>();
const ipLimits = new Map<string, RateLimitEntry>();

// 오래된 항목 정리 (메모리 누수 방지)
function cleanup(map: Map<string, RateLimitEntry>) {
  const now = Date.now();
  for (const [key, entry] of map) {
    if (now > entry.resetAt) map.delete(key);
  }
}

export function checkRateLimit(identifier: string, isUser: boolean): { allowed: boolean; remaining: number } {
  const map = isUser ? userLimits : ipLimits;
  const max = isUser ? MAX_REQUESTS_PER_USER : MAX_REQUESTS_PER_IP;
  const now = Date.now();

  // 100개 넘으면 정리
  if (map.size > 100) cleanup(map);

  const entry = map.get(identifier);

  if (!entry || now > entry.resetAt) {
    map.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count };
}
