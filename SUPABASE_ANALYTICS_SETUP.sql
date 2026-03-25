-- 1. 상세 방문 로그 테이블 (visit_logs)
create table if not exists public.visit_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  ip_address text,
  user_agent text,
  device_type text,   -- 'mobile', 'desktop' 등
  referrer text,
  path text
);

-- 2. 일별 방문 통계 테이블 (daily_visits)
create table if not exists public.daily_visits (
  date date primary key,
  count int default 0,
  updated_at timestamptz default now()
);

-- 3. 일별 방문자 수 증가 함수 (Atomic Increment)
create or replace function increment_daily_visits(target_date date)
returns void as $$
begin
  insert into public.daily_visits (date, count, updated_at)
  values (target_date, 1, now())
  on conflict (date)
  do update set 
    count = daily_visits.count + 1,
    updated_at = now();
end;
$$ language plpgsql;

-- 4. 보안 정책 (RLS)
alter table public.visit_logs enable row level security;
alter table public.daily_visits enable row level security;

-- (주의) 로그 데이터는 민감할 수 있으므로 'public' 읽기는 막고, 
-- 서비스 키(서버 사이드)나 관리자만 접근하도록 설정하는 것이 좋습니다.
-- 아래 정책은 'authenticated' 및 'service_role'만 허용합니다.

create policy "Allow service role full access on visit_logs"
  on public.visit_logs
  for all
  to service_role
  using (true)
  with check (true);

create policy "Allow service role full access on daily_visits"
  on public.daily_visits
  for all
  to service_role
  using (true)
  with check (true);
  
-- Supabase Dashboard에서 관리자가 보려면 아래 정책 추가 (선택)
-- create policy "Allow admin read" on public.visit_logs for select to authenticated using (auth.role() = 'authenticated');
