// src/lib/supabase/admin.ts — Supabase Admin 대체 (호환 Proxy)
// 모든 Supabase admin 호출을 Prisma로 대체하기 위한 Proxy
// @supabase/supabase-js 패키지 제거됨 — 독립 스텁

function fromProxy(table: string) {
  console.warn(`[supabaseAdmin] 레거시 호출: from('${table}') — Prisma로 마이그레이션 필요`);
  const chain: any = {
    select: (..._args: any[]) => chain,
    insert: (..._args: any[]) => chain,
    update: (..._args: any[]) => chain,
    delete: () => chain,
    upsert: (..._args: any[]) => chain,
    eq: (..._args: any[]) => chain,
    neq: (..._args: any[]) => chain,
    in: (..._args: any[]) => chain,
    is: (..._args: any[]) => chain,
    not: (..._args: any[]) => chain,
    or: (..._args: any[]) => chain,
    and: (..._args: any[]) => chain,
    gte: (..._args: any[]) => chain,
    lte: (..._args: any[]) => chain,
    order: (..._args: any[]) => chain,
    limit: (..._args: any[]) => chain,
    range: (..._args: any[]) => chain,
    single: () => Promise.resolve({ data: null, error: { message: 'Supabase 제거됨 — Prisma 사용' } }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: Function) => resolve({ data: [], error: null, count: 0 }),
  };
  return chain;
}

const storageStub = {
  from: () => ({
    upload: async () => ({ data: null, error: { message: 'Storage 제거됨' } }),
    getPublicUrl: () => ({ data: { publicUrl: '' } }),
    remove: async () => ({ error: null }),
  }),
};

export const supabaseAdmin: any = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: new Error('Supabase 제거됨 — JWT 인증 사용') }),
    admin: {
      getUserById: async () => ({ data: { user: null }, error: new Error('Supabase 제거됨') }),
      deleteUser: async () => ({ error: null }),
    },
  },
  from: fromProxy,
  storage: storageStub,
  rpc: async () => ({ data: null, error: null }),
};

/**
 * createClient 호환 함수 — @supabase/supabase-js 제거 후 대체
 * API 라우트에서 import { createClient } from '@supabase/supabase-js' 대신 사용
 */
export function createClient(_url?: string, _key?: string, _options?: any): any {
  return supabaseAdmin;
}
