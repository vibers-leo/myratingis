// src/lib/likes.ts — API 호출 기반 좋아요 유틸 (Supabase 제거)

/**
 * 좋아요 토글 — API 호출
 */
export async function toggleLike(projectId: string | number): Promise<boolean> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mr_auth_token') : null;
  if (!token) return false;

  const res = await fetch('/api/likes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ project_id: String(projectId) }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.liked;
}

/**
 * 좋아요 여부 확인
 */
export async function isProjectLiked(projectId: string | number): Promise<boolean> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mr_auth_token') : null;
  if (!token) return false;

  // userId는 /api/auth/me에서 가져와야 하지만, 간단히 API로 확인
  try {
    const meRes = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return false;
    const meData = await meRes.json();
    const userId = meData.user?.id;
    if (!userId) return false;

    const res = await fetch(`/api/likes?userId=${userId}&projectId=${String(projectId)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.liked;
  } catch {
    return false;
  }
}

export async function getUserLikes(userId: string): Promise<number[]> {
  try {
    const res = await fetch(`/api/likes?userId=${userId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.likes || []).map((l: any) => l.project_id);
  } catch {
    return [];
  }
}

export async function addLike(projectId: string | number): Promise<void> {
  await toggleLike(projectId);
}

export async function removeLike(projectId: string | number): Promise<void> {
  await toggleLike(projectId);
}

export async function getProjectLikeCount(projectId: string | number): Promise<number> {
  try {
    const res = await fetch(`/api/likes?projectId=${String(projectId)}`);
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
  } catch {
    return 0;
  }
}
