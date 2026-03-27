// src/lib/views.ts — 조회수 기록 (API 호출 기반, Supabase 제거)

/**
 * 세션 내 중복 뷰 방지 (sessionStorage 기반)
 */
function hasViewedInSession(projectId: string | number): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(`viewed_${projectId}`) === '1';
}

function markViewedInSession(projectId: string | number): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`viewed_${projectId}`, '1');
}

/**
 * 조회수 기록 — API 호출
 */
export async function recordView(projectId: string | number): Promise<void> {
  if (hasViewedInSession(projectId)) return;
  markViewedInSession(projectId);

  try {
    await fetch(`/api/projects/${projectId}/view`, { method: 'POST' });
  } catch (e) {
    console.error('Error recording view:', e);
  }
}

export async function getProjectViewCount(projectId: string | number): Promise<number> {
  // 조회수는 프로젝트 데이터에 포함되어 있으므로 별도 API 불필요
  return 0;
}
