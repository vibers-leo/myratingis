# Supabase RLS 임시 비활성화 (긴급 수정)

프로젝트 업로드 오류를 즉시 해결하려면 Supabase에서 다음 SQL을 실행하세요:

## 1. Supabase Dashboard 접속

https://supabase.com/dashboard

## 2. SQL Editor에서 실행

```sql
-- Project 테이블 RLS 임시 비활성화
ALTER TABLE public."Project" DISABLE ROW LEVEL SECURITY;

-- users 테이블 RLS 임시 비활성화 (프로필 수정용)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

## 3. 테스트 후 RLS 다시 활성화

테스트가 완료되면 아래 SQL로 RLS를 다시 활성화하고 정책을 적용하세요:

```sql
-- 002_rls_policies.sql 파일의 전체 내용을 실행
-- (supabase/migrations/002_rls_policies.sql 파일 참조)
```

---

## 영구 해결 방법

`supabase/migrations/002_rls_policies.sql` 파일의 전체 내용을 Supabase SQL Editor에서 실행하면 됩니다.

하지만 현재는 **API에서 supabaseAdmin을 사용**하고 있으므로, RLS를 비활성화하거나 정책을 올바르게 설정하면 됩니다.
