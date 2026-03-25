# 제 평가는요? (MyRatingIs) 디자인 가이드

## 테마 개요

**Clean, Modern, Premium** — 크리에이터의 작품을 돋보이게 하는 미니멀 인터페이스.
라이트/다크 모드 지원. 다크 모드는 **순수 블랙(#050505)** 기반 텍스처 배경.

---

## 색상 시스템

### 라이트 모드 (기본)

| CSS 변수 | 값 (HSL) | 용도 |
|----------|----------|------|
| `--background` | 0 0% 100% | 기본 배경 (#FFFFFF) |
| `--foreground` | 224 71.4% 4.1% | 기본 텍스트 |
| `--primary` | 24.6 95% 53.1% | 주요 강조 (오렌지) |
| `--secondary` | 220 14.3% 95.9% | 보조 배경 |
| `--muted` | 220 14.3% 95.9% | 비활성 배경 |
| `--muted-foreground` | 220 8.9% 46.1% | 보조 텍스트 |
| `--destructive` | 0 84.2% 60.2% | 삭제/위험 |
| `--border` | 220 13% 91% | 테두리 |
| `--radius` | 0.4rem | 기본 둥글기 |

### 다크 모드 (.dark)

| CSS 변수 | 값 (HSL) | 용도 |
|----------|----------|------|
| `--background` | 0 0% 2% | 순수 블랙 배경 (#050505) |
| `--foreground` | 0 0% 98% | 밝은 텍스트 |
| `--card` | 0 0% 4% | 카드 배경 (#0a0a0a) |
| `--muted` | 0 0% 10% | 비활성 배경 |
| `--border` | 0 0% 12% | 테두리 |

### Chef/Michelin 디자인 토큰

| CSS 변수 | 라이트 | 다크 | 용도 |
|----------|--------|------|------|
| `--chef-bg` | #FFFFFF | #050505 | 페이지 배경 |
| `--chef-card-bg` | #FFFFFF | #0a0a0a | 카드 배경 |
| `--chef-text` | #0F172A | #f8f8f8 | 텍스트 |
| `--chef-border` | #E2E8F0 | rgba(255,255,255,0.08) | 테두리 |
| `--chef-panel` | #F8FAFC | #111111 | 패널 배경 |
| `--chef-frame` | #0F172A | rgba(255,255,255,0.5) | 프레임 |

### 브랜드 색상

| 이름 | 값 | 용도 |
|------|------|------|
| Vibe Orange | hsl(24.6, 95%, 53.1%) | 주요 CTA, 포인트 |
| Vibe Soft Orange | hsl(24.6, 95%, 96%) | 오렌지 배경 |

---

## 타이포그래피

### 폰트 패밀리
| 용도 | 폰트 스택 |
|------|----------|
| 기본 (sans) | Inter → -apple-system → Apple SD Gothic Neo → Noto Sans KR → system-ui |
| 특수 제목 | Taenada (CDN, @font-face) |

### 폰트 적용 방식
- `next/font/google`의 Inter를 `--font-inter` CSS 변수로 로드
- 시스템 한글 폰트 폴백 (Pretendard CDN 제거됨 — 성능 최적화)

---

## 컴포넌트 패턴

### 카드 (`.behance-card`)
```css
background: var(--chef-card-bg);
border: 1px solid var(--chef-border);
border-radius: 6px;
overflow: hidden;
/* 호버 시 */
box-shadow: 0 10px 30px -10px rgba(234, 88, 12, 0.2);
border-color: rgba(234, 88, 12, 0.3);
```

### 버튼
| 클래스 | 스타일 | 호버 |
|--------|--------|------|
| `.btn-primary` | 검정 배경, 흰 텍스트, pill 형태 | 오렌지(#c2410c) 배경 |
| `.btn-secondary` | 투명, 테두리, pill 형태 | 오렌지 테두리+텍스트 |

### 입력 필드 (`.chef-input-high-v`)
```
rounded-xl, px-6, h-15, bg-chef-panel, border-border/50
focus: border-primary, ring-4 ring-primary/10
placeholder: text-foreground/30
```

### 프레임 (`.chef-frame-container`)
- 상단 중앙에 라벨이 올라온 테두리 프레임
- 미슐랭/흑백요리사 컨셉의 프리미엄 UI

---

## 레이아웃

### 컨테이너
```
max-width: 1400px (2xl)
padding: 2rem
center: true
```

### 그리드 (Masonry)
| 브레이크포인트 | 컬럼 수 | gap |
|----------------|---------|-----|
| < 640px | 1 | 24px |
| < 768px | 2 | 24px |
| < 1280px | 3 | 24px |
| < 1536px | 4 | 24px |
| >= 1536px | 5 | 24px |

### 반응형 브레이크포인트
```
sm: 640px / md: 768px / lg: 1024px / xl: 1280px / 2xl: 1536px
```

---

## 특수 스타일

### 다크 모드 텍스처 배경
```css
.dark body {
  background-color: #050505;
  background-image:
    linear-gradient(rgba(5,5,5,0.50), rgba(5,5,5,0.50)),
    url('/dark-texture-bg.jpg');
  background-size: cover;
  background-attachment: fixed;
}
```

### 애니메이션 비활성화
성능 최적화를 위해 **모든 애니메이션이 전역적으로 비활성화**됨:
```css
*, *::before, *::after {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}
```

### 스크롤바
- `.no-scrollbar` — 스크롤바 숨김
- `.custom-scrollbar` — 오렌지 틴트 커스텀 스크롤바 (6px)

### 그림자
| 클래스 | 값 |
|--------|------|
| `.shadow-subtle` | 0 1px 3px rgba(0,0,0,0.04) |
| `.shadow-card` | 0 4px 12px rgba(0,0,0,0.08) |
| `.shadow-hover` | 0 8px 24px rgba(0,0,0,0.12) |

---

## 체크리스트

새 컴포넌트/페이지 작성 시 반드시 확인:

- [ ] 라이트/다크 모드 모두 테스트
- [ ] CSS 변수 사용 (하드코딩 색상 지양)
- [ ] chef-* 유틸리티 클래스 활용
- [ ] 애니메이션 사용하지 않음 (성능 정책)
- [ ] 다크 모드에서 텍스처 배경이 보이도록 투명 배경 유지
- [ ] 카드: `.behance-card` 패턴 사용
- [ ] 입력: `.chef-input-high-v` 패턴 사용
- [ ] 반응형: masonry 그리드 브레이크포인트 준수
