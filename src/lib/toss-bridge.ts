/**
 * Toss SDK 브릿지 유틸리티
 * 앱인토스 WebView 환경 감지 및 네이티브 기능 호출
 * 현재: stub 구현 (브라우저에서도 동작)
 */

// Toss WebView 환경인지 감지
export function isTossApp(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return ua.includes('TossApp') || ua.includes('tossapp');
}

// Toss 유저 프로필 가져오기 (stub)
export async function getTossUser(): Promise<{
  id: string;
  nickname: string;
  profileImage?: string;
} | null> {
  if (!isTossApp()) return null;
  // TODO: Toss SDK 연동 후 실제 구현
  return null;
}

// TossPay 결제 요청 (stub)
export async function requestTossPay(params: {
  amount: number;
  orderId: string;
  orderName: string;
}): Promise<{ success: boolean; paymentKey?: string }> {
  if (!isTossApp()) {
    console.warn('[TossBridge] TossPay는 토스 앱 내에서만 사용 가능합니다.');
    return { success: false };
  }
  // TODO: Toss SDK 연동 후 실제 구현
  console.log('[TossBridge] requestTossPay:', params);
  return { success: false };
}

// 토스 미니앱 종료
export function closeTossApp(): void {
  if (!isTossApp()) {
    // 브라우저 환경에서는 히스토리 뒤로가기
    window.history.back();
    return;
  }
  // TODO: Toss SDK의 close() 호출
  try {
    (window as any).TossApp?.close?.();
  } catch {
    window.history.back();
  }
}

// 토스 공유 기능
export function shareToss(params: { url: string; title: string }): void {
  if (!isTossApp()) {
    // 브라우저 환경: Web Share API fallback
    if (navigator.share) {
      navigator.share({ url: params.url, title: params.title });
    } else {
      navigator.clipboard.writeText(params.url);
    }
    return;
  }
  // TODO: Toss SDK의 share() 호출
  try {
    (window as any).TossApp?.share?.(params);
  } catch {
    navigator.clipboard.writeText(params.url);
  }
}
