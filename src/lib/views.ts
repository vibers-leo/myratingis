// src/lib/views.ts
import { supabase } from "./supabase/client";
import { Database } from "./supabase/types";

type ViewRow = Database["public"]["Tables"]["view"]["Row"];
type ViewInsert = Database["public"]["Tables"]["view"]["Insert"];

/**
 * Get the current user.
 */
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Project.views_count를 1 증가시키는 API 호출
 */
async function incrementViewCount(projectId: string | number): Promise<void> {
  try {
    await fetch(`/api/projects/${projectId}/view`, { method: 'POST' });
  } catch (e) {
    console.error("Error incrementing view count:", e);
  }
}

/**
 * 세션 내 중복 뷰 카운팅 방지 (sessionStorage 기반)
 */
function hasViewedInSession(projectId: string | number): boolean {
  if (typeof window === 'undefined') return false;
  const key = `viewed_${projectId}`;
  return sessionStorage.getItem(key) === '1';
}

function markViewedInSession(projectId: string | number): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`viewed_${projectId}`, '1');
}

/**
 * Records a view for a project.
 * - 로그인 사용자: view 테이블에 고유 기록 + views_count 증가
 * - 비로그인 사용자: views_count만 증가 (세션당 1회)
 */
export async function recordView(projectId: string | number): Promise<void> {
  const alreadyViewed = hasViewedInSession(projectId);
  if (alreadyViewed) return;

  markViewedInSession(projectId);

  // views_count 증가 (모든 사용자)
  incrementViewCount(projectId);

  // 로그인 사용자: view 테이블에 고유 기록
  const user = await getUser();
  if (!user) return;

  const { data, error: selectError } = await supabase
    .from("view")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("project_id", Number(projectId))
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    console.error("Error checking for existing view:", selectError);
    return;
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from("view")
      .insert({ user_id: user.id, project_id: Number(projectId) } as ViewInsert);

    if (insertError) {
      console.error("Error adding view:", insertError);
    }
  }
}

/**
 * Get the view count for a project.
 */
export async function getProjectViewCount(projectId: string | number): Promise<number> {
  const { count, error } = await supabase
    .from("view")
    .select("*", { count: "exact", head: true })
    .eq("project_id", Number(projectId));

  if (error) {
    console.error("Error getting project view count:", error);
    return 0;
  }

  return count || 0;
}
