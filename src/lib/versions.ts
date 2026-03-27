// src/lib/versions.ts — 프로젝트 버전 (API 호출 기반)

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_name: string;
  changelog: string | null;
  content_html?: string | null;
  content_text?: string | null;
  images?: string[] | null;
  created_at: string;
}

export async function getProjectVersions(projectId: string | number): Promise<ProjectVersion[]> {
  try {
    const res = await fetch(`/api/v1/projects/${projectId}/versions`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.versions || [];
  } catch {
    return [];
  }
}
