// src/lib/comments.ts — API 호출 기반 댓글 유틸 (Supabase 제거)

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  createdAt: string;
  username: string;
  userAvatar: string;
  isSecret?: boolean;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mr_auth_token');
}

export async function getProjectComments(projectId: string | number): Promise<Comment[]> {
  try {
    const token = getToken();
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`/api/comments?projectId=${String(projectId)}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.comments || []).map((c: any) => ({
      id: c.comment_id || c.id,
      project_id: c.project_id,
      user_id: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      username: c.user?.username || 'Unknown',
      userAvatar: c.user?.profile_image_url || '/globe.svg',
      isSecret: c.is_secret,
    }));
  } catch {
    return [];
  }
}

export async function addComment(
  projectId: string | number,
  userId: string,
  content: string,
  username: string,
  avatarUrl: string,
  isSecret: boolean = false
): Promise<Comment | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ projectId: String(projectId), content, isSecret }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const c = data.comment;
    return {
      id: c.comment_id || c.id,
      project_id: c.project_id,
      user_id: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      username: c.user?.username || username,
      userAvatar: c.user?.profile_image_url || avatarUrl,
      isSecret: c.is_secret,
    };
  } catch {
    return null;
  }
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const token = getToken();
  if (!token) return;

  await fetch(`/api/comments?commentId=${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getCommentCount(projectId: string | number): Promise<number> {
  try {
    const res = await fetch(`/api/comments?projectId=${String(projectId)}`);
    if (!res.ok) return 0;
    const data = await res.json();
    return (data.comments || []).length;
  } catch {
    return 0;
  }
}
