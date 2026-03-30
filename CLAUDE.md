## 전략 문서 (개발 전 반드시 숙지)
- **전략 진단 리포트**: `data/STRATEGY_ANALYSIS.md`
- **PM 공통 지침**: 맥미니 루트 `pm.md`

### 전략 핵심 요약
- 양면 플랫폼의 성패는 전문가 50명 확보에 달려있음 (우선순위 1순위)
- 선/후행 문제: 전문가 부족 → 창작자 유입 없음 → 악순환 (초기 수동 모집 필수)
- Supabase 마이그레이션 85% 완료, Phase 1에서 전체 테스트 + 안정성 100% 달성 필수
- 협업 성사율 30% = 양면 플랫폼의 가장 강력한 성장 지표 (평가 → 협업 실행)
- 초기 성공 공식: 전문가 50명 + 창작자 50명 → 협업 발생 → 케이스 스터디 → 입소문

### 빌더 공통 지침
- **gstack 빌더 철학**: 맥미니 루트 `gstack.md` — Boil the Lake, Search Before Building, 스프린트 프로세스
- **개발 프로세스**: Think → Plan → Build → Review → Test → Ship → Reflect
- **핵심 규칙**: 테스트 동시 작성, 새 패턴 도입 전 검색, 압축률 기반 추정

---

# 프로젝트 작업 지침 (CLAUDE.md)

## 📋 프로젝트 개요
- **프로젝트명**: MyRatingIs (제 평가는요?)
- **설명**: 전문평가위원과 참여고객의 날카로운 시선으로 여러분의 프로젝트가 가진 진짜 가치를 증명해 드립니다
- **기술 스택**: Next.js 14, TypeScript, Supabase, Vercel
- **주요 기능**: 프로젝트 업로드, 평가 시스템, 소셜 로그인, 사용자 프로필 관리

## 🌐 언어 및 커뮤니케이션

### 필수 규칙
- **모든 대화는 한글로 진행**합니다
- **친절하고 상세한 설명**을 제공합니다
- 기술적 용어도 한글로 설명하되, 필요시 영문 병기합니다

### 작업 방식
- 작업을 시작하면 **중간에 확인을 구하지 않고 완료할 때까지 자율적으로 진행**합니다
- 단, 파괴적이거나 되돌릴 수 없는 작업(데이터 삭제, force push 등)은 반드시 사전 확인합니다
- "진행하려던 것 계속 진행해줘"라는 요청이 있으면 중단 없이 작업을 이어갑니다

## 🔥 Firebase → Supabase 마이그레이션

### 핵심 원칙
**Firebase를 완전히 제거하고 Supabase만 사용합니다**

- Firebase 관련 import는 모두 제거
- `users` 테이블 → `profiles` 테이블 사용
- Firebase Storage → Supabase Storage 사용
- Firestore → Supabase PostgreSQL 사용
- Firebase Auth → Supabase Auth 사용

### 마이그레이션 패턴

#### 1. Auth
```typescript
// ❌ Firebase
import { auth } from '@/lib/firebase/client'
const user = auth.currentUser

// ✅ Supabase
import { supabase } from '@/lib/supabase/client'
const { data: { user } } = await supabase.auth.getUser()
```

#### 2. Database
```typescript
// ❌ Firestore
import { db } from '@/lib/firebase/client'
await addDoc(collection(db, 'projects'), data)

// ✅ Supabase
import { supabase } from '@/lib/supabase/client'
await supabase.from('projects').insert(data)
```

#### 3. Storage
```typescript
// ❌ Firebase Storage
import { storage } from '@/lib/firebase/client'
await uploadBytes(storageRef, file)

// ✅ Supabase Storage
import { uploadImage } from '@/lib/supabase/storage'
const url = await uploadImage(file)
```

#### 4. 필드명 변환
- `camelCase` → `snake_case` (데이터베이스 필드)
- `serverTimestamp()` → `new Date().toISOString()`
- `user_id` 대신 `id` 사용 (profiles 테이블)

### Type 우회
Supabase 타입 정의에 없는 테이블 사용시:
```typescript
const { error } = await (supabase as any)
  .from('proposals')
  .insert(data);
```

## 🔄 Git 워크플로우

### 자동화 규칙
1. **의미 있는 작업 단위가 완료되면 자동으로 커밋**합니다
2. **배포가 필요한 변경사항은 푸시**를 진행합니다
3. 사용자가 "깃푸시해야 될듯" 같은 힌트를 주면 즉시 커밋/푸시합니다

### 커밋 메시지 규칙
```bash
<type>: <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Type 종류:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `style`: 코드 포맷팅
- `docs`: 문서 수정
- `test`: 테스트 코드
- `chore`: 빌드, 설정 변경

### Git 안전 수칙
- ❌ `--force` 사용 금지 (명시적 요청 시 제외)
- ❌ `--no-verify` 사용 금지
- ❌ main/master 브랜치에 force push 금지
- ✅ 특정 파일만 선택적으로 add
- ✅ .env 파일은 절대 커밋하지 않음

## 🚀 배포 환경 (Vercel)

### 고려사항
- **모든 변경사항은 Vercel 배포를 고려**합니다
- 환경변수는 `.env.local`에 저장 (Git 추적 안 함)
- Vercel 배포 후 실제 동작 테스트를 권장합니다

### 중요 환경변수
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Redirect URLs 설정
Supabase Dashboard에서 다음 URL들을 설정:
- `http://localhost:3300/auth/callback`
- `https://myratingis.vercel.app/auth/callback`
- `https://myratingis.vercel.app/**`

## 🧪 테스트 우선 원칙

### 필수 테스트 항목
변경 후 반드시 테스트:
1. **로그인/로그아웃** (소셜 로그인 포함)
2. **프로젝트 등록** (이미지 업로드 포함)
3. **프로필 수정**
4. **좋아요, 북마크** 기능
5. **제안/문의** 기능

### 테스트 순서
1. 로컬 개발 서버 테스트 (localhost:3300)
2. 문제 없으면 커밋/푸시
3. Vercel 배포 완료 대기
4. 프로덕션 환경 테스트

## 💾 데이터베이스 테이블 구조

### 주요 테이블
- `profiles`: 사용자 프로필
- `projects`: 프로젝트 (원래 `Project`)
- `evaluations`: 평가 데이터
- `project_likes`: 프로젝트 좋아요
- `proposals`: 협업 제안
- `inquiries`: 1:1 문의
- `api_keys`: API 키 관리

### 테이블명 주의사항
- 일부 테이블은 대문자 (`Project`, `ProjectRating`, `ProjectLike`)
- Supabase 쿼리 시 정확한 테이블명 사용
- Type assertion 필요시 `(supabase as any)` 사용

## 🔐 인증 시스템

### Supabase Auth 사용
```typescript
// 소셜 로그인
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

// 이메일 로그인
const { error } = await supabase.auth.signInWithPassword({
  email,
  password
})

// 회원가입
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: displayName }
  }
})
```

### Auth Context 사용
```typescript
import { useAuth } from '@/lib/auth/AuthContext'

const { user, loading } = useAuth()
```

## 📦 Storage 사용

### 이미지 업로드
```typescript
import { uploadImage } from '@/lib/supabase/storage'

const url = await uploadImage(file, 'projects') // 버킷명
```

### 주요 버킷
- `projects`: 프로젝트 이미지
- `recruit_files`: 공고문 등 일반 파일

## ⚡ 성능 최적화

### 원칙
- 불필요한 쿼리 최소화
- 이미지는 자동 압축 (storage.ts 참고)
- React Query로 캐싱 활용
- Optimistic Update 사용

## 🎯 OKR 기반 작업 관리

### OKR 준수 원칙
**모든 작업은 [OKR.md](./OKR.md)에 정의된 목표와 핵심 결과를 달성하기 위한 것이어야 합니다.**

### 현재 분기 OKR (2026 Q1)

#### Objective 1: 창작자가 한 치의 의심 없이 신뢰하고 사용하는 프로젝트 평가 플랫폼 구축

**Key Results:**
1. **시스템 안정성 100% 달성** (Firebase 의존성 0%, 에러율 0.1% 이하)
2. **사용자 참여도 200% 증가** (프로젝트 업로드, 평가 참여, 협업 제안 증가)
3. **사용자 만족도 90% 이상** (NPS 70+, 로그인 성공률 95%+)

#### Objective 2: 창작자 커뮤니티의 성장 허브로 자리매김

**Key Results:**
1. **협업 성사율 30% 달성**
2. **전문가 평가자 50명 확보**
3. **리텐션율 60% 달성** (월간 재방문율)

### OKR 기반 작업 의사결정

모든 작업 시 다음을 자문하고 답변:

#### 1. 이 작업이 어떤 KR에 기여하는가?
```
예시:
- Supabase 마이그레이션 → KR 1 (시스템 안정성) 직접 기여
- 프로젝트 등록 UX 개선 → KR 2 (사용자 참여도) 직접 기여
- 알림 시스템 구축 → KR 3 (리텐션율) 직접 기여
```

#### 2. Output이 아닌 Outcome을 목표로 하는가?
```
❌ Output 중심 (잘못됨):
- "프로젝트 등록 페이지 리뉴얼 완료"
- "알림 기능 10개 추가"

✅ Outcome 중심 (올바름):
- "프로젝트 등록 완료율 60% → 80% 향상"
- "알림을 통한 재방문율 40% → 60% 증가"
```

#### 3. 측정 가능한가?
모든 작업은 **측정 가능한 지표**와 연결되어야 합니다.
- 시스템 안정성: 에러율, 응답시간, 가동시간
- 사용자 참여: 업로드 수, 평가 참여 수, 세션 시간
- 만족도: NPS, 완료율, 성공률

#### 4. 도전적인가?
- 70% 달성 시 성공으로 간주
- 100% 달성은 목표가 너무 쉬웠다는 의미
- 안전한 목표보다는 도전적인 목표 설정

### OKR 체크인 루틴

#### 주간 체크인 (매주 금요일 기준)
작업 완료 시 다음을 확인:
1. **이번 주 완료된 작업이 어떤 KR에 기여했는가?**
2. **KR 진행률이 얼마나 향상되었는가?**
3. **다음 주 우선순위는 어떤 KR에 집중하는가?**

#### 월간 리뷰 (매월 마지막 주)
1. KR 달성률 분석
2. Initiative 완료 현황
3. 필요시 OKR 조정 (단, Objective는 변경하지 않음)

### OKR 기반 우선순위 매트릭스

작업 우선순위는 다음 순서로 결정:

**1순위: OKR 직접 기여 + 긴급**
- 시스템 장애, 보안 이슈, 중대한 버그
- 예: 로그인 실패, 데이터 손실, 배포 오류

**2순위: OKR 직접 기여 + 중요**
- 현재 분기 KR 달성을 위한 핵심 작업
- 예: Supabase 마이그레이션, UX 개선, 성능 최적화

**3순위: OKR 간접 기여**
- 미래 OKR 또는 장기 목표에 기여
- 예: 코드 리팩토링, 문서화, 기술 부채 해소

**4순위: Nice-to-have**
- OKR과 무관하지만 개선이 필요한 사항
- 예: 코드 스타일 정리, 사소한 UI 개선

### 작업 시작 전 체크리스트

```markdown
[ ] 이 작업이 달성하려는 KR은?
[ ] 측정 가능한 성과 지표는?
[ ] 예상 KR 진행률 향상치는?
[ ] 완료 기준은 명확한가?
[ ] OKR.md에 해당 Initiative가 있는가?
```

### 작업 완료 후 체크리스트

```markdown
[ ] KR 진행률이 실제로 향상되었는가?
[ ] 성과 지표를 측정했는가?
[ ] OKR.md의 Initiative 체크박스를 업데이트했는가?
[ ] 다음 작업이 OKR 달성에 더 중요한가?
```

## 🎯 작업 우선순위 (OKR 연계)

1. **OKR 달성에 기여하는가?** (최우선)
2. **기능이 작동하는가?** (실용성)
3. **Supabase로 완전히 마이그레이션되었는가?** (KR 1 직접 기여)
4. **배포 환경에서도 작동하는가?** (KR 1, 3 직접 기여)
5. **코드 품질** (타입 안정성, 가독성)

## 🚫 금지 사항

- ❌ Firebase 관련 코드 추가
- ❌ `users` 테이블 사용 (항상 `profiles` 사용)
- ❌ 테스트 없이 배포
- ❌ .env 파일 커밋
- ❌ 사용자 확인 없이 파괴적 작업
- ❌ 영어로 대화

## 📝 주의사항

### Todo 관리
- 복잡한 작업은 TodoWrite로 진행상황 추적
- 작업 완료시 즉시 상태 업데이트
- 한 번에 하나의 todo만 `in_progress`

### 오류 처리
- 콘솔 에러 발견시 즉시 수정
- try-catch로 적절한 에러 처리
- 사용자에게 친절한 에러 메시지 표시 (toast 사용)

### 코드 스타일
- TypeScript strict mode 준수
- ESLint/Prettier 규칙 따름
- 주석은 필요한 경우에만 (코드가 자명하지 않을 때)

## 🔄 지속적 개선

이 문서는 프로젝트 진행 중 발견된 새로운 패턴이나 규칙을 계속 업데이트합니다.

---

## 참조 문서

- `DESIGN_GUIDE.md` — 색상, 타이포그래피, 컴포넌트 패턴 등 디자인 규칙
- `STATUS.md` — 프로젝트 현황 및 기능 완료 상태
- `OKR.md` — 분기별 목표 및 핵심 결과
- `DESIGN_SYSTEM.md` — 기존 디자인 시스템 상세

## 상위 브랜드

- 회사: 계발자들 (Vibers)
- 도메인: vibers.co.kr

---

## AI Recipe 이미지 API

이 프로젝트는 **AI Recipe 중앙 이미지 서비스**를 사용합니다.

### 사용 가능한 함수

```typescript
import { searchStockImage, generateAIImage } from '@/lib/ai-recipe-client';
```

### Stock Image 검색
```typescript
const image = await searchStockImage('creative project showcase', {
  orientation: 'landscape',
  size: 'medium',
});
// → { url, provider, alt, photographer, ... }
```

### AI 이미지 생성
```typescript
const image = await generateAIImage('professional project thumbnail, modern design', {
  size: 'large',
  provider: 'auto',
});
// → { url, prompt, provider }
```

### 주의사항
- Server Action이나 API Route에서만 사용 (API 키 보호)
- Rate Limit: 1000회/일 (myratingis 프로젝트 전체)
- AI Recipe 서버 실행 필요: http://localhost:3300

### 실전 예제
```typescript
// 프로젝트 썸네일 자동 생성
const thumbnail = await generateAIImage(
  'clean project thumbnail, gradient background, professional'
);
```

---

## 🎨 Supanova 디자인 스킬

### 개요
랜딩 페이지 및 UI 디자인 작업 시 반드시 Supanova Design Skill을 참조합니다.
프리미엄 품질의 HTML + Tailwind CSS 결과물을 위한 검증된 디자인 엔진입니다.

### 스킬 파일 위치
```
skills/
├── taste-skill.md    # 디자인 감각 엔진 (색상, 타이포, 레이아웃 규칙)
├── soft-skill.md     # 소프트 랜딩 (부드러운 인터랙션, 모션)
├── output-skill.md   # 최종 산출물 규칙 (HTML 구조, 접근성)
└── redesign-skill.md # 기존 디자인 개선 프로세스
```

### 사용법
- **새 페이지 디자인**: `taste-skill.md` → `soft-skill.md` → `output-skill.md` 순서로 참조
- **기존 페이지 개선**: `redesign-skill.md` 참조
- **핵심 규칙**: Korean-first, Pretendard 폰트, Tailwind CDN, Iconify Solar 아이콘
- 디자인 작업 시작 전 반드시 해당 스킬 파일을 읽고 지침을 따릅니다

---

**마지막 업데이트**: 2026-03-28
**버전**: 1.3.0 (Supanova 디자인 스킬 연동 추가)


## 세션로그 기록 (필수)
- 모든 개발 대화의 주요 내용을 `session-logs/` 폴더에 기록할 것
- 파일명: `YYYY-MM-DD_한글제목.md` / 내용: 한글
- 세션 종료 시, 마일스톤 달성 시, **컨텍스트 압축 전**에 반드시 저장
- 상세 포맷은 상위 CLAUDE.md 참조
