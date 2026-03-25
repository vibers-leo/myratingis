# 마이페이지 탭 추가 가이드

## 추가할 탭

1. **1:1 문의** - `/mypage/inquiries` (이미 존재)
2. **제안하기** - 새로운 탭 필요
3. **내가 쓴 댓글** - 새로운 탭 필요

## 구현 방법

### 1. 마이페이지 탭 추가

`src/app/mypage/page.tsx`

```tsx
const [activeTab, setActiveTab] = useState<'projects' | 'likes' | 'bookmarks' | 'inquiries' | 'proposals' | 'comments'>('projects');

// 탭 네비게이션
<button onClick={() => setActiveTab('inquiries')}>
  <MessageSquare size={18} />
  1:1 문의
</button>

<button onClick={() => setActiveTab('proposals')}>
  <Send size={18} />
  제안하기
</button>

<button onClick={() => setActiveTab('comments')}>
  <MessageCircle size={18} />
  내가 쓴 댓글
</button>
```

### 2. 데이터 로딩

```tsx
if (activeTab === "inquiries") {
  // Proposal 테이블에서 내가 받은 문의 조회
  query = supabase.from("Proposal").select("*").eq("receiver_id", userId);
}

if (activeTab === "proposals") {
  // Proposal 테이블에서 내가 보낸 제안 조회
  query = supabase.from("Proposal").select("*").eq("sender_id", userId);
}

if (activeTab === "comments") {
  // Comment 테이블에서 내가 쓴 댓글 조회
  query = supabase
    .from("Comment")
    .select(
      `
      *,
      Project (
        project_id,
        title,
        thumbnail_url
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}
```

### 3. UI 컴포넌트

- 1:1 문의: 메시지 리스트
- 제안하기: 제안 카드
- 내가 쓴 댓글: 댓글 + 프로젝트 정보

## 파일

- `src/app/mypage/page.tsx` - 메인 마이페이지
- 필요시 별도 컴포넌트 생성
