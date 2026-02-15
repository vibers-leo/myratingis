Log: MyRatingIs_Development_Session
Date: 2025-12-26 08:01:31
Key Object: 포트폴리오 웹사이트 기능 확장 (프로필, 1:1 문의, 관리자 페이지, 인증) 및 배포 문제 해결

📝 상세 작업 일지 (Chronological)

1. 레이아웃 및 헤더 구조 개선
   상황: TopHeader와 Header의 레이아웃 정렬 및 스티키 헤더 동작 개선 필요.
   해결:

- src/components/Header.tsx: 높이 및 z-index 조정 (top-[44px], z-40).
- src/components/TopHeader.tsx: 높이 축소, sticky top-0, z-50 설정.
- src/app/page.tsx: StickyMenu 위치 조정 (TopHeader + Header 높이 반영).

2. 1:1 문의 기능 및 마이페이지 통합
   상황: 프로젝트 상세 모달에서 제작자에게 직접 문의하는 기능과 이를 관리할 페이지 필요.
   해결:

- src/components/ProjectDetailModal.tsx: '제안하기' 버튼을 '1:1 문의하기'로 변경, 로컬 스토리지에 문의 데이터 저장 로직(inquiries 키) 구현.
- src/app/mypage/profile/page.tsx: 신규 생성. 프로필 이미지, 기본 정보, 스킬, 소셜 링크 관리 기능 구현.
- src/app/mypage/inquiries/page.tsx: 신규 생성. 보낸 문의 내역 조회 및 삭제 기능.
- src/app/mypage/page.tsx: 프로필 설정 및 문의 내역 메뉴 아이콘(Lucide React) 연결 및 링크 추가.

3. 카테고리 및 제작자 페이지 구현 (중간 우선순위)
   상황: 카테고리별 모아보기 및 제작자 프로필 상세 페이지 부재.
   해결:

- src/app/category/[slug]/page.tsx: 동적 라우팅으로 카테고리별 프로젝트 필터링 페이지 구현.
- src/components/StickyMenu.tsx: (검토) 카테고리 필터 동작 확인.
- src/app/creator/[username]/page.tsx: 제작자 프로필 페이지 구현 (정보, 스킬, 통계, 프로젝트 목록).
- src/components/ProjectDetailModal.tsx: 제작자 이름 클릭 시 프로필 페이지로 이동하도록 Link 추가.
- src/app/project/upload/page.tsx: 프로젝트 업로드 시 현재 설정된 로컬 스토리지 프로필 정보 자동 연동.

4. UI 폴리싱 및 접근 제어
   상황: 헤더 간 여백 문제 및 비로그인 상태에서의 업로드 접근 제어 필요.
   해결:

- src/components/TopHeader.tsx: border-b 제거하여 헤더 사이 미세한 틈 해결.
- src/app/page.tsx: 하단 회원가입/로그인 버튼 Link 연결. 플로팅 업로드 버튼 및 메인 업로드 로직에 로그인/프로필 체크 추가.
- src/app/project/upload/page.tsx: 페이지 진입 시 로그인/프로필 유무 확인하여 리다이렉트 처리.

5. 채용/공모전/이벤트 페이지 고도화
   상황: 단순 목록을 넘어선 채용, 공모전, 이벤트 통합 관리 기능 요청.
   해결:

- src/app/recruit/page.tsx: 전체 재작성. Tabs 컴포넌트 활용하여 3가지 유형(Job, Contest, Event) 분리. 유형별 전용 필드(급여, 상금 등) 및 CRUD 다이얼로그 구현.

6. 관리자(Admin) 대시보드 구축
   상황: 사이트 전반을 관리할 어드민 페이지 필요.
   해결:

- src/app/admin/page.tsx: 대시보드 메인. 주요 통계(프로젝트, 문의 수 등) 및 최근 활동 요약.
- src/app/admin/projects/page.tsx: 검색, 조회, 삭제 기능을 갖춘 프로젝트 관리.
- src/app/admin/inquiries/page.tsx: 문의 내역 전체 조회, 답변 상태 토글(Pending/Answered), 삭제 기능.
- src/app/admin/recruit/page.tsx: 기존 /recruit 페이지 리다이렉트 처리.
- src/app/admin/stats/page.tsx: 사이트 통계 상세 페이지.
- src/app/admin/users/page.tsx: 사용자 관리 스텁(Stub) 페이지.

7. 인증(Auth) 시스템 연동 (Supabase)
   상황: 회원가입/로그인 기능이 실제 DB와 연동되지 않음.
   해결:

- .env.local: Supabase 환경 변수 설정 가이드.
- src/app/signup/page.tsx: Supabase Auth 연동 회원가입 로직 구현.
- src/app/login/page.tsx: Supabase Auth 연동 로그인 로직 구현.

8. Git 및 배포 트러블슈팅
   상황: Git 계정 권한 문제(403) 및 Vercel 배포 빌드 에러 발생.
   해결:

- Git Remote: `juuuno-coder`에서 `myratingis` 리포지토리로 remote url 변경 및 인증 갱신.
- Build Error Fix: src/app/admin/inquiries/page.tsx에서 TypeScript 타입 에러(string vs literal type) 수정 및 재배포 트리거.
