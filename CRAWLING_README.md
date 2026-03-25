# 채용/공모전 자동 크롤링 시스템

채용, 공모전, 이벤트 정보를 자동으로 수집하고 관리하는 시스템입니다.

## 🎯 주요 기능

### 1. 자동 크롤링

- **스케줄**: 매일 오전 6시 자동 실행
- **대상**: 채용, 공모전, 이벤트 정보
- **소스**: 씽굿, 위비티, 원티드, 로켓펀치 등

### 2. 관리자 대시보드

- 크롤링 통계 실시간 확인
- 수동 크롤링 실행
- 크롤링 히스토리 조회
- 항목 추가/수정/삭제

### 3. 사용자 페이지

- 카테고리별 필터링 (채용/공모전/이벤트)
- D-day 표시
- 상세 정보 확인
- 외부 링크 연결

## 📁 파일 구조

```
vibefolio-nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── crawl/
│   │   │   │   └── route.ts           # 크롤링 API
│   │   │   └── recruit-items/
│   │   │       ├── route.ts           # 항목 조회/추가
│   │   │       └── [id]/route.ts      # 항목 수정/삭제
│   │   ├── admin/
│   │   │   └── recruit/
│   │   │       ├── page.tsx           # 항목 관리 페이지
│   │   │       └── crawl/
│   │   │           └── page.tsx       # 크롤링 관리 페이지
│   │   └── recruit/
│   │       └── page.tsx               # 사용자 페이지
│   └── lib/
│       └── crawlers/
│           ├── types.ts               # 타입 정의
│           ├── sources.ts             # 크롤링 소스 설정
│           └── crawler.ts             # 크롤링 로직
├── supabase/
│   └── CREATE_RECRUIT_ITEMS_TABLE.sql # DB 스키마
├── vercel.json                        # Cron Job 설정
└── CRAWLING_SETUP_GUIDE.md           # 설정 가이드
```

## 🚀 빠른 시작

### 1. 데이터베이스 설정

Supabase에서 SQL 실행:

```bash
supabase/CREATE_RECRUIT_ITEMS_TABLE.sql
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
CRON_SECRET=your_secret
```

### 3. 배포

Vercel에 배포하면 자동으로 Cron Job이 설정됩니다.

## 📊 데이터베이스 스키마

### recruit_items 테이블

```sql
- id: bigint (PK)
- title: text
- description: text
- type: 'job' | 'contest' | 'event'
- date: date
- location: text
- prize: text (공모전용)
- salary: text (채용용)
- company: text
- employment_type: text
- link: text
- is_active: boolean
- is_crawled: boolean
- source_url: text
- crawled_at: timestamp
```

### crawl_logs 테이블

```sql
- id: bigint (PK)
- created_at: timestamp
- type: text
- status: 'success' | 'failed' | 'partial'
- items_found: integer
- items_added: integer
- items_updated: integer
- error_message: text
- duration_ms: integer
```

## 🔧 사용 방법

### 관리자 페이지

1. **크롤링 관리**: `/admin/recruit/crawl`

   - 통계 확인
   - 수동 크롤링 실행
   - 히스토리 조회

2. **항목 관리**: `/admin/recruit`
   - 항목 추가/수정/삭제
   - 검색 및 필터링

### 사용자 페이지

- **연결 페이지**: `/recruit`
  - 채용/공모전/이벤트 조회
  - 카테고리별 필터
  - D-day 확인

## 🤖 크롤링 커스터마이징

### 소스 추가

`src/lib/crawlers/sources.ts`:

```typescript
{
  name: '새 사이트',
  url: 'https://example.com',
  type: 'job',
  enabled: true,
}
```

### 키워드 수정

```typescript
export const CRAWL_KEYWORDS = [
  "디자이너",
  "크리에이터",
  // 추가 키워드...
];
```

## ⚠️ 주의사항

### 법적 고려사항

- 각 사이트의 `robots.txt` 확인
- 이용약관 준수
- 공식 API 사용 권장

### 현재 상태

- **데모 모드**: 현재는 시뮬레이션 데이터 생성
- **실제 구현**: `crawler.ts`의 주석 참고

## 📝 API 문서

### POST /api/crawl

크롤링 실행 (관리자 또는 Cron)

### GET /api/crawl

크롤링 상태 조회 (관리자만)

### GET /api/recruit-items

항목 조회 (공개)

### POST /api/recruit-items

항목 추가 (관리자만)

### PUT /api/recruit-items/[id]

항목 수정 (관리자만)

### DELETE /api/recruit-items/[id]

항목 삭제 (관리자만)

## 🐛 문제 해결

자세한 내용은 `CRAWLING_SETUP_GUIDE.md` 참고

## 📄 라이선스

MIT License
