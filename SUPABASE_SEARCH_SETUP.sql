-- 1. 검색어 트렌드 저장을 위한 테이블 생성
create table if not exists public.search_keywords (
  id uuid default gen_random_uuid() primary key,
  query text not null unique,
  count int default 1,
  updated_at timestamptz default now()
);

-- 2. RLS (Row Level Security) 설정
alter table public.search_keywords enable row level security;

-- 누구나 검색어 트렌드를 읽을 수 있음 (인기 검색어 표시용)
create policy "Enable read access for all users"
  on public.search_keywords for select
  using (true);

-- 누구나 검색어를 기록할 수 있음 (로그 저장용)
-- (옵션: 실제 서비스에서는 서비스 키 role만 허용하거나, API 라우트에서 처리 권장)
create policy "Enable insert for all users"
  on public.search_keywords for insert
  with check (true);

create policy "Enable update for all users"
  on public.search_keywords for update
  using (true);

-- 3. 검색 횟수 증가를 위한 RPC 함수 (Atomic Increment)
create or replace function increment_search_count(search_term text)
returns void as $$
begin
  insert into public.search_keywords (query, count, updated_at)
  values (search_term, 1, now())
  on conflict (query)
  do update set 
    count = search_keywords.count + 1,
    updated_at = now();
end;
$$ language plpgsql;
