// src/lib/supabase/server.ts — 서버 클라이언트 대체 (호환 Proxy)
// 이제 서버에서는 Prisma + JWT를 사용합니다.

export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase 제거됨 — JWT 인증 사용') }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: (_table: string) => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  };
}
