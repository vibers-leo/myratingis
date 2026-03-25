# 메인 페이지 개선 작업 가이드

## 완료된 작업

1. ✅ 카테고리 밑줄 제거
2. ✅ 사용자 정보 캐싱 유틸리티 생성

## 남은 작업

### 1. 메인 페이지 정렬 기능 추가

**파일**: `src/app/page.tsx`

```tsx
// 정렬 상태 추가
const [sortBy, setSortBy] = useState('latest');

// 프로젝트 정렬 함수
const sortProjects = (projects: any[], sortType: string) => {
  const sorted = [...projects];
  switch (sortType) {
    case 'latest':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'popular':
    case 'views':
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    case 'likes':
      return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    default:
      return sorted;
  }
};

// StickyMenu에 onSetSort 전달
<StickyMenu
  props={selectedCategory}
  onSetCategory={setSelectedCategory}
  onSetSort={setSortBy}
  currentSort={sortBy}
/>

// 프로젝트 표시 시 정렬 적용
{sortProjects(filteredProjects, sortBy).map(...)}
```

### 2. 프로젝트 등록 로그인 체크

**파일**: `src/app/page.tsx`

```tsx
const handleUploadClick = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    alert("프로젝트 등록을 위해 로그인이 필요합니다.");
    router.push("/login");
  } else {
    router.push("/project/upload");
  }
};

// 버튼 클릭 핸들러 변경
<Button onClick={handleUploadClick}>프로젝트 등록</Button>;
```

### 3. 무한 스크롤 구현

**필요한 패키지**: `react-intersection-observer`

```bash
npm install react-intersection-observer
```

```tsx
import { useInView } from "react-intersection-observer";

const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const { ref, inView } = useInView();

useEffect(() => {
  if (inView && hasMore) {
    loadMoreProjects();
  }
}, [inView]);

const loadMoreProjects = async () => {
  // 다음 페이지 프로젝트 로드
  const response = await fetch(`/api/projects?page=${page + 1}`);
  const data = await response.json();

  if (data.projects && data.projects.length > 0) {
    setProjects((prev) => [...prev, ...data.projects]);
    setPage((prev) => prev + 1);
  } else {
    setHasMore(false);
  }
};

// 마지막 카드에 ref 추가
<div ref={ref} className="h-10" />;
```

### 4. 이미지 로딩 최적화

**파일**: `src/components/ImageCard.tsx`

```tsx
// lazy loading 추가
<img
  src={props.urls.regular}
  alt="@THUMBNAIL"
  className="w-full h-auto object-cover"
  loading="lazy"
  decoding="async"
/>
```

### 5. 프로필 이미지 & 닉네임 수정

**파일**: `src/app/page.tsx`

```tsx
import { getUserInfo } from "@/lib/getUserInfo";

// 프로젝트 로딩 시
const projectsWithUsers = await Promise.all(
  data.projects.map(async (project: any) => {
    const userInfo = await getUserInfo(project.user_id);
    return {
      ...project,
      user: {
        username: userInfo.username,
        profile_image: {
          small: userInfo.profile_image_url,
          large: userInfo.profile_image_url,
        },
      },
    };
  })
);
```

## 우선순위

1. 프로필 이미지 & 닉네임 (가장 중요)
2. 프로젝트 등록 로그인 체크
3. 정렬 기능
4. 이미지 로딩 최적화
5. 무한 스크롤
