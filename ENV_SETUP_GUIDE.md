# .env.local 파일 확인 및 수정 가이드

## 현재 설정 확인

`.env.local` 파일을 열어서 다음 값들을 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## ❌ 잘못된 경우 (이전 DB)

만약 URL이 `juuuno1116`을 포함하고 있다면:

```env
NEXT_PUBLIC_SUPABASE_URL=https://juuuno1116.supabase.co  # ❌ 삭제된 DB
```

## ✅ 올바른 설정 (vibefolio)

Supabase Dashboard에서 새로운 값을 복사하세요:

1. https://supabase.com/dashboard
2. **vibefolio** 프로젝트 선택
3. 왼쪽 메뉴 **Settings** → **API**
4. 다음 값들을 복사:

```env
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co

# anon public (공개 키)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role (관리자 키) - 절대 공개하지 마세요!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔄 적용 방법

1. `.env.local` 파일 수정
2. **개발 서버 재시작** (중요!)
   ```bash
   # 터미널에서 Ctrl+C로 중단 후
   npm run dev
   ```

## 확인

브라우저에서:

- F12 → Application → Local Storage
- 이전 데이터가 남아있다면 **Clear storage** 클릭
