// src/lib/supabase/admin.ts — Supabase Admin 대체 (호환 Proxy)
// 모든 Supabase admin 호출을 Prisma로 대체하기 위한 Proxy

const handler: ProxyHandler<any> = {
  get(_target, prop) {
    if (prop === 'auth') {
      return {
        getUser: async () => ({ data: { user: null }, error: new Error('Supabase 제거됨 — JWT 인증 사용') }),
        admin: {
          getUserById: async () => ({ data: { user: null }, error: new Error('Supabase 제거됨') }),
        },
      };
    }
    if (prop === 'from') {
      return (_table: string) => {
        console.warn(`[supabaseAdmin] 레거시 호출: from('${_table}') — Prisma로 마이그레이션 필요`);
        const chainProxy: any = new Proxy({}, {
          get: () => (..._args: any[]) => chainProxy,
        });
        // 기본 반환값
        chainProxy.then = undefined; // thenable 방지
        return {
          select: () => ({ data: null, error: null, count: 0 }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
          upsert: () => ({ data: null, error: null }),
        };
      };
    }
    if (prop === 'rpc') {
      return async () => ({ data: null, error: null });
    }
    return undefined;
  }
};

export const supabaseAdmin = new Proxy({}, handler);
