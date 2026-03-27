// src/lib/supabase/client.ts — Prisma 기반 호환 레이어 (브라우저 클라이언트 대체)
// 더 이상 Supabase를 사용하지 않음. 클라이언트 코드에서 직접 DB 접근 대신 API 호출 사용.

// 기존 코드 호환성을 위한 빈 객체 — 실제 사용 시 에러 발생하도록 Proxy 사용
const handler: ProxyHandler<any> = {
  get(_target, prop) {
    if (prop === 'auth') {
      return {
        getUser: async () => ({ data: { user: null }, error: new Error('Supabase 제거됨 — useAuth() 사용') }),
        getSession: async () => ({ data: { session: null }, error: new Error('Supabase 제거됨') }),
        signInWithPassword: async () => { throw new Error('Supabase 제거됨 — /api/auth/login 사용'); },
        signInWithOAuth: async () => { throw new Error('Supabase 제거됨 — 소셜 로그인은 준비 중'); },
        signUp: async () => { throw new Error('Supabase 제거됨 — /api/auth/signup 사용'); },
        signOut: async () => { throw new Error('Supabase 제거됨 — AuthContext signOut 사용'); },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      };
    }
    if (prop === 'from') {
      return (_table: string) => ({
        select: () => ({ data: null, error: new Error('Supabase 제거됨 — API 라우트 사용') }),
        insert: () => ({ data: null, error: new Error('Supabase 제거됨') }),
        update: () => ({ data: null, error: new Error('Supabase 제거됨') }),
        delete: () => ({ data: null, error: new Error('Supabase 제거됨') }),
      });
    }
    if (prop === 'storage') {
      return {
        from: () => ({
          upload: async () => ({ data: null, error: new Error('Storage 별도 구현 필요') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          remove: async () => ({ error: null }),
        }),
      };
    }
    if (prop === 'channel') return () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) });
    if (prop === 'removeChannel') return () => {};
    return undefined;
  }
};

export const supabase = new Proxy({}, handler);
export const createClient = () => supabase;
