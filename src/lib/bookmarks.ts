// src/lib/bookmarks.ts — API 호출 기반 북마크 유틸 (Supabase 제거)

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mr_auth_token');
}

export async function getUserBookmarks(userId: string): Promise<number[]> {
  // TODO: 북마크 API 구현 시 연동
  return [];
}

export async function isProjectBookmarked(projectId: string | number): Promise<boolean> {
  return false;
}

export async function addBookmark(projectId: string | number): Promise<void> {
  // TODO: 북마크 API 연동
}

export async function removeBookmark(projectId: string | number): Promise<void> {
  // TODO: 북마크 API 연동
}

export async function toggleBookmark(projectId: string | number): Promise<boolean> {
  // TODO: 북마크 API 연동
  return false;
}
