# 프로젝트 이전 백업 문서
> 생성일: 2026-03-24 | Windows → Mac Mini 이전용

---

## 1. 프로젝트 개요

### myratingis (웹)
- **설명**: 전문평가위원과 참여고객의 날카로운 시선으로 프로젝트의 진짜 가치를 증명하는 평가 플랫폼
- **기술 스택**: Next.js 14, TypeScript, Supabase, Vercel
- **도메인**: https://myratingis.kr (Vercel 배포)
- **GitHub**: https://github.com/juuuno-coder/myratingis.git

### vibefolio-app (모바일)
- **설명**: myratingis의 React Native 모바일 앱
- **기술 스택**: Expo 54, React Native 0.81, TypeScript, Supabase
- **GitHub**: vibefolio-app 리포지토리
- **EAS 계정**: juuuno1116
- **번들 ID**: net.vibefolio.app

---

## 2. 환경변수 (반드시 수동 설정 필요)

### myratingis/.env.local
> ⚠️ 실제 키는 `.env.local` 파일 또는 Vercel 대시보드에서 확인하세요 (보안상 Git에 포함하지 않음)
```bash
# supabase
NEXT_PUBLIC_SUPABASE_URL=https://mwtgvkrvsrhxwmasvzms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<.env.local 참고>
SUPABASE_SERVICE_ROLE_KEY=<.env.local 참고>

# Groq AI (우선 사용, 무료)
GROQ_API_KEY=<.env.local 참고>

# Google Gemini AI (폴백)
GOOGLE_GENERATIVE_AI_API_KEY=<.env.local 참고>

# cron
CRON_SECRET=<.env.local 참고>
```

### vibefolio-app (eas.json에 포함됨)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://iougjxzscsonbibxjhad.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<eas.json 참고>
```

### Vercel 환경변수 (이미 설정됨)
- 위 myratingis 환경변수와 동일하게 Vercel Dashboard에 설정되어 있음
- `GROQ_API_KEY` 포함

---

## 3. 최근 작업 내역 (2026-03 기준)

### 성능 최적화
- **프로젝트 목록 DB 쿼리 최적화**: 150개 → 3개 (batch query + Set/Map)
  - `src/app/projects/ProjectsClient.tsx`
- **리포트 페이지 병렬 API 호출**: sequential → parallel fetch
  - `src/app/report/[id]/page.tsx`
- **좋아요 후 불필요한 전체 리로드 제거** (optimistic update만 유지)

### AI 비용 절감 (완료)
- **Groq 우선, Gemini 폴백** 이중 안전장치 구현
  - `src/lib/ai/client.ts`: hasAIKey(), callGroq(), callGemini() 통합
  - Groq: Llama 3.3 70B (완전 무료, 일 14,400회)
  - Gemini: 2.0 Flash (무료 티어, 폴백용)
- **Rate Limit 추가**: IP당 일 10회, 사용자 일 20회
  - `src/lib/ai/rate-limit.ts`
- **적용 라우트**: analyze, analyze-url, chat, generate (4개 전체)

### 빌드 에러 수정
- **@fortawesome vendor-chunks 에러**: .next 캐시 삭제 + 미사용 import 제거
- **eas.json submit 빈 값**: submit 섹션 제거

### 모바일 앱 (vibefolio-app)
- **app.json**: 스토어 메타데이터 추가 (description, developer, policy URLs)
- **보안 강화**: Supabase 하드코딩 키 제거, SecureStore 사용
- **EAS projectId**: Constants에서 동적 참조
- **댓글 스크롤**: project/[id].tsx에 scrollViewRef 구현
- **Android 빌드**: 성공 (AAB 파일 생성됨)
- **iOS 빌드**: Apple Developer 인증서 설정 필요 (인터랙티브 모드)

---

## 4. 미완료 작업 (맥미니에서 이어서 진행)

### 높은 우선순위
1. **iOS 앱스토어 빌드 및 배포**
   ```bash
   cd vibefolio-app
   npx eas-cli build --platform ios --profile production
   ```
   - Apple Developer 계정 로그인 필요 (인터랙티브 모드)
   - Distribution Certificate, Provisioning Profile 생성
   - 빌드 완료 후: `npx eas-cli submit --platform ios`

2. **Google Play 스토어 제출**
   - Android AAB는 이미 빌드됨
   - `npx eas-cli submit --platform android`
   - 스토어 스크린샷 5-8장 필요

### 중간 우선순위
3. **스토어 에셋 준비**
   - 앱 스크린샷 (iPhone 6.7", 6.5", 5.5")
   - 앱 설명문 (한국어/영어)
   - 프로모션 텍스트

4. **Google Cloud Gemini API 비활성화**
   - Google Cloud Console에서 Gemini API 비활성화하면 비용 청구 완전 차단
   - 현재는 폴백으로 남겨둔 상태

---

## 5. 프로젝트 아키텍처

### myratingis 핵심 파일 구조
```
src/
├── app/
│   ├── api/ai/          # AI API 라우트 (Groq 우선 + Gemini 폴백)
│   │   ├── analyze/     # 평가 분석
│   │   ├── analyze-url/ # URL 분석 (프로젝트 등록 시)
│   │   ├── chat/        # AI 채팅
│   │   └── generate/    # 린캔버스, 페르소나 생성
│   ├── projects/        # 프로젝트 목록 (ProjectsClient.tsx)
│   ├── report/          # 리포트 페이지
│   └── auth/            # 인증 (callback)
├── lib/
│   ├── ai/
│   │   ├── client.ts    # Groq + Gemini 이중 클라이언트
│   │   ├── rate-limit.ts # 인메모리 Rate Limiter
│   │   └── search-service.ts # AI 검색 서비스
│   ├── supabase/
│   │   ├── client.ts    # 브라우저 Supabase 클라이언트
│   │   ├── server.ts    # 서버 Supabase 클라이언트
│   │   └── storage.ts   # 이미지 업로드
│   └── auth/
│       └── AuthContext.tsx # 인증 컨텍스트
```

### vibefolio-app 핵심 파일 구조
```
app/
├── _layout.tsx          # 루트 레이아웃 (Auth, QueryClient, Push)
├── (tabs)/              # 탭 네비게이션
│   ├── index.tsx        # 홈 (프로젝트 피드, 무한스크롤)
│   ├── recruit.tsx      # 채용 목록
│   └── profile.tsx      # 마이 프로필
├── (auth)/              # 로그인/회원가입
├── project/[id].tsx     # 프로젝트 상세 (521줄)
└── project/quick-post.tsx # 빠른 등록
lib/
├── supabase.ts          # Supabase + SecureStore 어댑터
├── notifications.ts     # 푸시 알림
├── constants.ts         # API_BASE, 카테고리
├── auth/AuthContext.tsx  # 인증 컨텍스트
└── api/                 # REST API 클라이언트들
```

---

## 6. DB 테이블 구조 (주의사항)

### 대소문자 혼용 테이블
- `profiles` → 웹에서 사용
- `User` (대문자) → 모바일 앱에서 사용
- `Project` (대문자) → 일부 쿼리
- `ProjectRating` (대문자) → 평가 데이터
- `ProjectLike` → 좋아요 (일부)
- `project_likes` → 좋아요 (일부)

### Type 우회 패턴
```typescript
const { error } = await (supabase as any)
  .from('proposals')
  .insert(data);
```

---

## 7. 외부 서비스 계정 정보

| 서비스 | 용도 | 비고 |
|--------|------|------|
| Supabase | DB, Auth, Storage | 2개 프로젝트 (웹/앱) |
| Vercel | 웹 배포 | myratingis.kr |
| EAS (Expo) | 모바일 빌드 | juuuno1116 |
| Groq | AI API (무료) | gsk_ 키 |
| Google Cloud | Gemini 폴백 | 비용 모니터링 필요 |
| GitHub | 소스 관리 | juuuno-coder |
| Apple Developer | iOS 배포 | 가입 완료 |
| Google Play Console | Android 배포 | - |

---

## 8. 맥미니 환경 세팅 순서

```bash
# 1. 기본 도구 설치
brew install node git
npm install -g eas-cli vercel

# 2. 프로젝트 클론
git clone https://github.com/juuuno-coder/myratingis.git
git clone [vibefolio-app repo URL]

# 3. myratingis 세팅
cd myratingis
npm install
# .env.local 파일 생성 (위 환경변수 섹션 참고)
npm run dev -- -p 3300

# 4. vibefolio-app 세팅
cd vibefolio-app
npm install
npx eas-cli login  # juuuno1116 계정

# 5. iOS 빌드 (맥에서만 가능)
npx eas-cli build --platform ios --profile production
# → Apple ID 로그인, Certificate/Provisioning Profile 생성

# 6. Claude Code 설치 (선택)
# CLAUDE.md가 이미 프로젝트에 포함되어 있으므로 바로 사용 가능
```

---

## 9. 알려진 이슈

1. **iOS 빌드 인증서**: Apple Developer 인터랙티브 모드에서만 설정 가능 (Windows에서 불가)
2. **DB 테이블 대소문자**: 웹과 앱에서 테이블명이 다름 (`profiles` vs `User`)
3. **Google Cloud 과금**: Gemini API가 폴백으로 남아있어 간헐적 호출 시 소액 과금 가능
4. **expo-doctor 타임아웃**: 네트워크 환경에 따라 스키마 검증 실패 (무시 가능)

---

## 10. Git 커밋 히스토리 (최근)

### myratingis
```
87d6bd6 feat: AI 이중 안전장치 - Groq 우선, Gemini 폴백
e03b976 refactor: AI 엔진 Gemini → Groq 전환 (완전 무료)
a96c6fb feat: AI 비용 절감 - Rate Limit 추가 및 모델 다운그레이드
4637ae3 fix: @fortawesome vendor-chunks 빌드 에러 수정
be34e43 perf: 프로젝트 목록 로딩 속도 대폭 개선 (DB 쿼리 150개→3개)
5988bf1 fix: 조회수 이중 카운팅 방지 및 페이지 이동 시 요청 보장
e028c21 fix: CSV 저장 버튼 동작 안 하는 문제 수정
7e8c7e8 fix: 조회수 증가 로직 수정 (RLS 우회 + 필드명 통일)
```

### vibefolio-app
```
06dc821 fix: eas.json submit 빈 값 제거 — 빌드 에러 해결
3f179c2 chore: v1.0.0 스토어 배포 준비 — 보안 강화 및 메타데이터 보완
2920d39 chore: App store submission readiness — final polish
657f7dd fix: getLikeStatus missing userId param + remove unused import
a665b77 feat: Complete v1.0 — likes, comments, profile edit, Google OAuth
```

---

**이 문서를 맥미니에서 열어보면 바로 이어서 작업할 수 있습니다.**
