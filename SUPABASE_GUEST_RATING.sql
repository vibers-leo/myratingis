-- 1. ProjectRating 테이블 구조 변경 (게스트 지원)
-- user_id가 필수(Not Null) 였다면 해제하고, guest_id 컬럼 추가
alter table "ProjectRating" alter column user_id drop not null;
alter table "ProjectRating" add column if not exists guest_id text;

-- 2. 중복 평가 방지를 위한 유니크 제약조건 재설정
-- 기존 제약조건(아마도 project_id + user_id)을 삭제하고, 더 유연한 인덱스로 대체하거나
-- API 레벨에서 upsert 로직을 정교하게 처리해야 합니다.
-- 여기서는 Supabase의 인덱스 충돌을 피하기 위해, 기존 제약조건 이름을 안다면 drop 하겠지만,
-- 안전하게 새로운 부분 인덱스를 생성합니다.

-- 로그인 유저용 유니크 인덱스
create unique index if not exists idx_rating_user 
on "ProjectRating" (project_id, user_id) 
where user_id is not null;

-- 게스트 유저용 유니크 인덱스
create unique index if not exists idx_rating_guest 
on "ProjectRating" (project_id, guest_id) 
where guest_id is not null;

-- 3. Report 조회 권한 (기존 로직 보완)
-- 작성자만 볼 수 있게 하려면 API에서 필터링하거나 RLS를 강화해야 함.
-- (API 로직 수정으로 처리 예정이므로 SQL은 스키마 변경에 집중)
