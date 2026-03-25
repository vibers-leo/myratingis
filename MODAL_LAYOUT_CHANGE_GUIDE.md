# 프로젝트 상세 모달 레이아웃 변경 가이드

## 목표

- 기본: 66% 이미지 영역
- 댓글 클릭 시: 이미지가 왼쪽으로 이동, 오른쪽 22%에 댓글 패널 표시

## 레이아웃 구조

### 기본 상태 (댓글 닫힘)

```
┌────────────────────────────────────────────────────┐
│  [X]                                               │
│  ┌──────────────────────────────┐  ┌────┐         │
│  │                              │  │액션│         │
│  │    이미지 (66%)              │  │바  │         │
│  │                              │  │    │         │
│  └──────────────────────────────┘  └────┘         │
└────────────────────────────────────────────────────┘
```

### 댓글 열림

```
┌────────────────────────────────────────────────────┐
│  [X]                                               │
│  ┌─────────────────┐  ┌────┐  ┌──────────────┐   │
│  │                 │  │액션│  │              │   │
│  │  이미지 (44%)   │  │바  │  │  댓글 (22%)  │   │
│  │                 │  │    │  │              │   │
│  └─────────────────┘  └────┘  └──────────────┘   │
└────────────────────────────────────────────────────┘
```

## 구현 방법

### 1. 상태 추가

```tsx
const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
```

### 2. 레이아웃 변경

```tsx
<div className="flex h-full transition-all duration-300">
  {/* 이미지 영역 */}
  <div className={`bg-gray-50 flex items-center justify-center p-8 transition-all duration-300 ${
    commentsPanelOpen ? 'w-[44%]' : 'w-[66%]'
  }`}>
    <img ... />
  </div>

  {/* 액션바 (48px) */}
  <div className="w-[48px] ...">
    {/* 댓글 버튼 */}
    <button onClick={() => setCommentsPanelOpen(!commentsPanelOpen)}>
      <MessageCircle />
    </button>
  </div>

  {/* 댓글 패널 (슬라이드) */}
  <div className={`bg-white flex flex-col transition-all duration-300 overflow-hidden ${
    commentsPanelOpen ? 'w-[22%]' : 'w-0'
  }`}>
    {/* 댓글 내용 */}
  </div>
</div>
```

### 3. 액션바 댓글 버튼

- 클릭 시 `commentsPanelOpen` 토글
- 활성화 시 아이콘 색상 변경

## 파일

- `src/components/ProjectDetailModal.tsx` (기존 모달)
- 또는 새로운 모달 컴포넌트 생성
