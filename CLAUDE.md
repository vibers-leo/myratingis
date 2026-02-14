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

## 🎯 작업 우선순위

1. **기능이 작동하는가?** (실용성 최우선)
2. **Supabase로 완전히 마이그레이션되었는가?**
3. **배포 환경에서도 작동하는가?**
4. **코드 품질** (타입 안정성, 가독성)

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

**마지막 업데이트**: 2026-02-12
**버전**: 1.0.0
