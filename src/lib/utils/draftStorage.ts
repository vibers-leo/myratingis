// 프로젝트 드래프트(임시저장) 관리

export interface ProjectDraft {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  genres: string[];
  fields: string[];
  lastSaved: number; // timestamp
  createdAt: number;
}

const DRAFTS_KEY = "project_drafts";
const MAX_DRAFTS = 10;

/**
 * 모든 드래프트 가져오기
 */
export function getDrafts(): ProjectDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 드래프트 저장 (자동저장용)
 */
export function saveDraft(draft: Omit<ProjectDraft, "id" | "createdAt">): string {
  if (typeof window === "undefined") return "";
  
  const drafts = getDrafts();
  const now = Date.now();
  
  // 같은 ID가 있으면 업데이트, 없으면 새로 생성
  let draftId = draft.title ? `draft_${draft.title.substring(0, 20)}_${now}` : `draft_${now}`;
  
  // 기존 드래프트 중 같은 제목이 있으면 업데이트
  const existingIndex = drafts.findIndex(d => 
    d.title === draft.title && draft.title !== ""
  );
  
  if (existingIndex >= 0) {
    draftId = drafts[existingIndex].id;
    drafts[existingIndex] = {
      ...drafts[existingIndex],
      ...draft,
      lastSaved: now,
    };
  } else {
    // 새 드래프트 추가 (최대 개수 제한)
    const newDraft: ProjectDraft = {
      id: draftId,
      ...draft,
      lastSaved: now,
      createdAt: now,
    };
    
    drafts.unshift(newDraft);
    
    // 최대 개수 초과 시 오래된 것 삭제
    if (drafts.length > MAX_DRAFTS) {
      drafts.pop();
    }
  }
  
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.warn("[Draft] 저장 실패:", e);
  }
  
  return draftId;
}

/**
 * 특정 드래프트 가져오기
 */
export function getDraft(id: string): ProjectDraft | null {
  const drafts = getDrafts();
  return drafts.find(d => d.id === id) || null;
}

/**
 * 드래프트 삭제
 */
export function deleteDraft(id: string): void {
  if (typeof window === "undefined") return;
  
  const drafts = getDrafts();
  const filtered = drafts.filter(d => d.id !== id);
  
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn("[Draft] 삭제 실패:", e);
  }
}

/**
 * 모든 드래프트 삭제
 */
export function clearAllDrafts(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFTS_KEY);
  } catch (e) {
    console.warn("[Draft] 전체 삭제 실패:", e);
  }
}

/**
 * 드래프트 내용이 비어있는지 확인
 */
export function isDraftEmpty(draft: Partial<ProjectDraft>): boolean {
  return !draft.title?.trim() && !draft.content?.trim();
}

/**
 * 마지막 저장 시간 포맷
 */
export function formatLastSaved(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return "방금 전";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
