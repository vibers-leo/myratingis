// API Rate Limiting 유틸리티
// 메모리 기반 (프로덕션에서는 Redis 권장)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number;  // 시간 창 (밀리초)
  maxRequests: number;  // 최대 요청 수
}

// 기본 설정: 1분에 60회
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

/**
 * Rate limit 체크
 * @param identifier - IP 주소 또는 사용자 ID
 * @param config - Rate limit 설정
 * @returns true면 요청 허용, false면 제한
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // 새 엔트리 또는 리셋 시간 경과
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }
  
  // 요청 수 증가
  entry.count++;
  
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = entry.resetTime - now;
  
  return { allowed, remaining, resetIn };
}

/**
 * Rate limit 미들웨어 응답 생성
 */
export function rateLimitResponse(resetIn: number) {
  return new Response(
    JSON.stringify({
      error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      retryAfter: Math.ceil(resetIn / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil(resetIn / 1000).toString(),
      },
    }
  );
}

/**
 * 클라이언트 IP 가져오기 (Request 헤더에서)
 */
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare 등의 프록시 헤더 확인
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  // 기본값
  return "unknown";
}

// 주기적으로 만료된 엔트리 정리 (메모리 누수 방지)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // 1분마다 정리
}

// 특정 엔드포인트용 설정
export const RATE_LIMIT_CONFIGS = {
  // 로그인: 1분에 5회
  login: { windowMs: 60 * 1000, maxRequests: 5 },
  // 회원가입: 1시간에 3회
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  // 일반 API: 1분에 60회
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  // 업로드: 1분에 10회
  upload: { windowMs: 60 * 1000, maxRequests: 10 },
};
