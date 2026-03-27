// src/lib/inquiries.ts — 문의 유틸 (API 호출 기반, Supabase 제거)

export interface Inquiry {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  inquiry_type: 'general' | 'proposal';
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  created_at: string;
  status: 'pending' | 'answered';
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mr_auth_token');
}

export async function getUserInquiries(userId: string): Promise<Inquiry[]> {
  const token = getToken();
  if (!token) return [];

  try {
    const res = await fetch('/api/inquiries', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.inquiries || [];
  } catch {
    return [];
  }
}

export async function addInquiry(
  projectId: string | number,
  userId: string,
  title: string,
  content: string,
  inquiryType: 'general' | 'proposal' = 'general',
  contactName: string,
  contactEmail: string,
  contactPhone?: string
): Promise<Inquiry | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        project_id: String(projectId),
        title,
        content,
        inquiry_type: inquiryType,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.inquiry;
  } catch {
    return null;
  }
}

export async function deleteInquiry(inquiryId: number, userId: string) {
  // TODO: 삭제 API 연동
  return { data: null, error: null };
}

export async function getAllInquiries(): Promise<Inquiry[]> {
  return getUserInquiries('');
}

export async function updateInquiryStatus(inquiryId: number, status: 'pending' | 'answered'): Promise<Inquiry | null> {
  // TODO: 상태 업데이트 API 연동
  return null;
}
