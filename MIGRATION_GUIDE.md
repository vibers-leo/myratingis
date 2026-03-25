# users 테이블 제거 후 수정 가이드

## ✅ 완료된 작업

1. `/api/users/[id]/route.ts` - Auth user_metadata 사용
2. `/api/projects/route.ts` - users 조인 제거
3. `supabase/migrations/003_remove_users_table.sql` - 마이그레이션 SQL 생성

## 🔧 수동으로 수정해야 할 파일들

### 1. `src/app/mypage/page.tsx` (line 38-42)

**변경 전:**

```tsx
// 프로필 가져오기
const { data: profile } = await supabase
  .from("users")
  .select("*")
  .eq("id", user.id)
  .single();
setUserProfile(profile);
```

**변경 후:**

```tsx
// Auth user_metadata에서 프로필 가져오기
setUserProfile({
  nickname:
    user.user_metadata?.nickname || user.email?.split("@")[0] || "사용자",
  email: user.email,
  profile_image_url: user.user_metadata?.profile_image_url || "/globe.svg",
});
```

### 2. `src/app/mypage/page.tsx` (line 73-80, 82-93, 96-107)

**모든 users 조인 제거:**

```tsx
// 변경 전
.select(`
  *,
  users (nickname, profile_image_url)
`)

// 변경 후
.select('*')
```

그리고 데이터 매핑 부분 (line 126-130)도 수정:

```tsx
// 변경 전
user: {
  username: p.users?.nickname || "Unknown",
  profile_image: {
    small: p.users?.profile_image_url || "...",
    large: p.users?.profile_image_url || "..."
  }
}

// 변경 후 - 현재 로그인한 사용자 정보 사용
user: {
  username: userProfile?.nickname || "Unknown",
  profile_image: {
    small: userProfile?.profile_image_url || "/globe.svg",
    large: userProfile?.profile_image_url || "/globe.svg"
  }
}
```

### 3. `src/app/page.tsx` (line 158-180)

프로젝트 로딩 시 작성자 정보를 Auth에서 가져오도록 수정 필요.

## 📌 중요!

Supabase SQL Editor에서 다음 파일 실행:

- `supabase/migrations/003_remove_users_table.sql`

이 SQL을 실행하면 users 테이블이 삭제되고 모든 FK가 auth.users를 직접 참조하게 됩니다.
