# Supabase 마이그레이션 계획

localStorage에서 Supabase 데이터베이스로의 마이그레이션 계획입니다.

## ✅ 완료된 작업

### 1. 데이터베이스 스키마 생성

- [x] 9개 테이블 정의 (User, Project, Category, Like, Wishlist, Comment, Proposal, OutsourcingRequest, JobPosting)
- [x] 인덱스 최적화
- [x] 트리거 함수 (자동 타임스탬프 업데이트)
- [x] Row Level Security (RLS) 정책
- [x] 기본 카테고리 데이터

### 2. API 라우트 생성

- [x] 인증 API (회원가입, 로그인)
- [x] 프로젝트 API (CRUD)
- [x] 좋아요 API (토글, 조회)
- [x] 댓글 API (CRUD)

### 3. 라이브러리 설치

- [x] @supabase/supabase-js
- [x] bcryptjs (비밀번호 해시화)
- [x] prisma (선택사항)

---

## 📋 다음 단계

### Phase 1: 핵심 기능 마이그레이션 (우선순위 높음)

#### 1.1 사용자 인증

- [ ] `src/app/signup/page.tsx` - API 연동
- [ ] `src/app/login/page.tsx` - API 연동
- [ ] `src/app/mypage/profile/page.tsx` - 프로필 조회/수정 API 연동

#### 1.2 프로젝트 관리

- [ ] `src/app/page.tsx` - 프로젝트 목록 API 연동
- [ ] `src/app/project/upload/page.tsx` - 프로젝트 생성 API 연동
- [ ] `src/app/project/[id]/page.tsx` - 프로젝트 조회 API 연동
- [ ] `src/app/project/edit/[id]/page.tsx` - 프로젝트 수정 API 연동
- [ ] `src/app/mypage/projects/page.tsx` - 내 프로젝트 목록 API 연동

#### 1.3 인터랙션

- [ ] 좋아요 기능 - `src/lib/likes.ts` 대체
- [ ] 댓글 기능 - `src/lib/comments.ts` 대체
- [ ] 북마크 기능 - `src/lib/bookmarks.ts` 대체

### Phase 2: 추가 기능 마이그레이션

#### 2.1 검색 및 필터링

- [ ] `src/app/search/SearchPageContent.tsx` - 검색 API 연동
- [ ] `src/app/category/[slug]/page.tsx` - 카테고리별 조회 API 연동

#### 2.2 채용/공모전

- [ ] `src/app/recruit/page.tsx` - JobPosting 테이블 연동
- [ ] JobPosting API 라우트 생성

#### 2.3 문의/제안

- [ ] `src/components/ProjectDetailModal.tsx` - Proposal 테이블 연동
- [ ] `src/app/mypage/inquiries/page.tsx` - 문의 목록 API 연동
- [ ] Proposal API 라우트 생성

### Phase 3: 최적화 및 개선

#### 3.1 성능 최적화

- [ ] 이미지 업로드 - Supabase Storage 연동
- [ ] 캐싱 전략 구현 (React Query 또는 SWR)
- [ ] 무한 스크롤 구현

#### 3.2 보안 강화

- [ ] JWT 토큰 기반 인증으로 업그레이드
- [ ] API 라우트 미들웨어 추가
- [ ] CORS 설정

#### 3.3 사용자 경험 개선

- [ ] 로딩 상태 표시
- [ ] 에러 처리 개선
- [ ] 오프라인 지원 (PWA)

---

## 🔧 마이그레이션 가이드

### 기존 코드 패턴

```typescript
// localStorage 사용 (기존)
const projects = JSON.parse(localStorage.getItem("projects") || "[]");
```

### 새로운 코드 패턴

```typescript
// API 사용 (새로운 방식)
const response = await fetch("/api/projects");
const { projects } = await response.json();
```

### 단계별 마이그레이션

1. **API 라우트 확인**: 필요한 API가 이미 생성되어 있는지 확인
2. **컴포넌트 수정**: localStorage 코드를 API 호출로 변경
3. **테스트**: 기능이 정상 작동하는지 확인
4. **localStorage 코드 제거**: 더 이상 필요 없는 코드 삭제

---

## 📊 진행 상황

- **데이터베이스**: ✅ 100% (9/9 테이블)
- **API 라우트**: 🔄 40% (4/10 예상)
- **프론트엔드 연동**: ⏳ 0% (0/20 예상)

---

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env.local` 파일에 Supabase 키 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. API 테스트

Postman 또는 Thunder Client로 API 테스트:

```bash
# 회원가입
POST http://localhost:4000/api/auth/signup
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "nickname": "테스터"
}
```

---

## 📝 참고 문서

- [API 가이드](./API_GUIDE.md)
- [Supabase 설정 가이드](../supabase/README.md)
- [데이터베이스 스키마](../supabase/schema.sql)
- [사용 예제](../src/lib/supabase/examples.ts)

---

## ⚠️ 주의사항

1. **데이터 백업**: 마이그레이션 전 localStorage 데이터를 백업하세요
2. **점진적 마이그레이션**: 한 번에 모든 기능을 변경하지 말고 단계적으로 진행하세요
3. **테스트**: 각 기능을 마이그레이션한 후 반드시 테스트하세요
4. **롤백 계획**: 문제 발생 시 이전 버전으로 되돌릴 수 있도록 준비하세요
