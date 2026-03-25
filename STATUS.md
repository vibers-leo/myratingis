# 제 평가는요? (MyRatingIs) 프로젝트 현황

## 기본 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 제 평가는요? (MyRatingIs) |
| 기술 스택 | Next.js 14 + TypeScript |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (소셜 로그인) |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 배포 | Vercel |
| 도메인 | myratingis.kr / myratingis.vercel.app |

## 핵심 기능

- [x] 프로젝트 업로드 및 관리
- [x] 전문 평가 시스템 (미슐랭/흑백요리사 컨셉)
- [x] 소셜 로그인 (Google, Kakao)
- [x] 사용자 프로필 관리
- [x] 좋아요 / 북마크
- [x] 협업 제안 (Proposals)
- [x] 1:1 문의
- [x] SEO (robots.ts, sitemap.ts, RSS)
- [x] 다크 모드
- [x] 카테고리 시스템
- [x] 검색 기능
- [x] 리크루팅 (채용 공고)
- [x] 공지사항
- [x] 템플릿
- [x] 도구 모음 (린캔버스, 페르소나, 기회 분석)
- [x] 쇼핑 페이지
- [x] 방문자 추적
- [x] 실시간 리스너
- [x] 온보딩 모달
- [x] 자동 로그아웃
- [x] 네이버 검색 어드바이저 연동
- [x] Google Analytics 4

## 마이그레이션 상태

### Firebase -> Supabase 전환
- [x] Auth 마이그레이션 완료
- [x] Database (Firestore -> PostgreSQL) 완료
- [x] Storage 마이그레이션 완료
- [ ] Firebase 코드 완전 제거 확인 필요

## 알려진 이슈

- 일부 테이블이 대문자 (`Project`, `ProjectRating`, `ProjectLike`) — Supabase 쿼리 시 주의
- 성능 최적화를 위해 모든 애니메이션 비활성화 상태
- Pretendard CDN 제거됨 (시스템 폰트 폴백 사용)

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 메인 페이지 |
| `/projects` | 프로젝트 목록 |
| `/project/[id]` | 프로젝트 상세 |
| `/mypage` | 마이페이지 |
| `/admin` | 관리자 |
| `/recruit` | 채용 |
| `/shop` | 쇼핑 |
| `/tools/*` | 도구 모음 |

---

**최종 업데이트**: 2026-03-25
