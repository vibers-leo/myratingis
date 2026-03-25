# 카테고리 통일 가이드

## 현재 상황

- **StickyMenu**: 하드코딩된 카테고리 (korea, video, graphic-design 등)
- **프로젝트 업로드**: DB의 Category 테이블에서 가져옴

## 해결 방법

### 1. Category 테이블 확인

Supabase에서 현재 Category 테이블의 데이터를 확인하고, StickyMenu의 카테고리와 일치하도록 수정

### 2. StickyMenu 카테고리 값 변경

`src/components/StickyMenu.tsx`의 카테고리 value를 Category 테이블의 name과 일치시키기

**현재 StickyMenu 카테고리:**

```tsx
{ icon: Layers, label: "전체", value: "korea" },
{ icon: CirclePlay, label: "영상/모션그래픽", value: "video" },
{ icon: Palette, label: "그래픽 디자인", value: "graphic-design" },
{ icon: IdCard, label: "브랜딩/편집", value: "brand" },
{ icon: MousePointerClick, label: "UI/UX", value: "ui" },
{ icon: PenTool, label: "일러스트레이션", value: "illustration" },
{ icon: Camera, label: "디지털 아트", value: "digital-art" },
{ icon: Sparkles, label: "AI", value: "ai" },
{ icon: Panda, label: "캐릭터 디자인", value: "cartoon" },
{ icon: Package, label: "제품/패키지 디자인", value: "product-design" },
{ icon: Camera, label: "포토그래피", value: "photography" },
{ icon: Type, label: "타이포그래피", value: "typography" },
{ icon: Gem, label: "공예", value: "craft" },
{ icon: Brush, label: "파인아트", value: "art" },
```

### 3. 권장 사항

Category 테이블에 위 카테고리들을 추가하거나,
StickyMenu의 value를 Category 테이블의 name과 동일하게 변경

**예시 SQL:**

```sql
INSERT INTO "Category" (name) VALUES
('전체'),
('영상/모션그래픽'),
('그래픽 디자인'),
('브랜딩/편집'),
('UI/UX'),
('일러스트레이션'),
('디지털 아트'),
('AI'),
('캐릭터 디자인'),
('제품/패키지 디자인'),
('포토그래피'),
('타이포그래피'),
('공예'),
('파인아트');
```

## 임시 해결책

StickyMenu의 value를 category_id 기반으로 변경하거나,
프로젝트 필터링 시 name으로 매칭
