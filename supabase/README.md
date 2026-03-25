# Supabase Configuration Guide

이 파일은 Supabase 데이터베이스 연동 가이드입니다.

## 1. Supabase에서 테이블 생성하기

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. `supabase/schema.sql` 파일의 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭하여 실행

## 2. 환경 변수 설정하기

1. Supabase Dashboard > **Settings** > **API** 이동
2. 다음 값들을 복사:

   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY`

3. `.env.local` 파일에 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 3. Supabase 클라이언트 라이브러리 설치

```bash
npm install @supabase/supabase-js
```

## 4. 생성된 테이블 목록

- ✅ User - 사용자
- ✅ Category - 카테고리
- ✅ Project - 프로젝트
- ✅ Like - 좋아요
- ✅ Wishlist - 위시리스트
- ✅ Comment - 댓글
- ✅ Proposal - 제안서
- ✅ OutsourcingRequest - 외주 요청
- ✅ JobPosting - 채용 공고

## 5. 주요 기능

### 자동 업데이트 타임스탬프

- `updated_at` 필드는 레코드 수정 시 자동으로 현재 시간으로 업데이트됩니다.

### Row Level Security (RLS)

- 사용자 인증 기반 데이터 접근 제어
- 본인의 데이터만 수정/삭제 가능
- 모든 사용자가 공개 데이터 조회 가능

### 인덱스 최적화

- 자주 조회되는 컬럼에 인덱스 생성
- 검색 및 정렬 성능 향상

## 6. 다음 단계

1. Supabase 클라이언트 설정 파일 확인: `lib/supabase/client.ts`
2. 데이터베이스 타입 정의 확인: `lib/supabase/types.ts`
3. API 라우트에서 Supabase 사용 예제 확인

## 문제 해결

### 테이블이 생성되지 않는 경우

- SQL Editor에서 에러 메시지 확인
- 기존 테이블이 있다면 삭제 후 재실행

### RLS 정책 오류

- Supabase Dashboard > Authentication에서 사용자 인증 설정 확인
- auth.uid()가 올바르게 작동하는지 확인

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
