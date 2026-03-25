# 구글 로그인(OAuth) 설정 가이드

"Unsupported provider: provider is not enabled" 오류는 Supabase 프로젝트에서 구글 로그인이 활성화되지 않았기 때문에 발생합니다. 아래 단계를 따라 설정을 완료해주세요.

## 1단계: Google Cloud Console 설정

1. **[Google Cloud Console](https://console.cloud.google.com/)**에 접속하여 로그인합니다.
2. 상단 프로젝트 선택 드롭다운에서 **새 프로젝트**를 생성합니다 (예: `MyRatingIs`).
3. **API 및 서비스 > OAuth 동의 화면 (OAuth Consent Screen)**으로 이동합니다.
   - `External` (외부)를 선택하고 `만들기`를 클릭합니다.
   - **앱 이름**: `MyRatingIs` (원하는 이름)
   - **사용자 지원 이메일**: 본인 이메일 선택
   - **개발자 연락처 정보**: 본인 이메일 입력
   - `저장 후 계속` 버튼을 눌러 범위를 설정(기본값 유지)하고 완료합니다.
4. **API 및 서비스 > 사용자 인증 정보 (Credentials)**로 이동합니다.
   - 상단 `+ 사용자 인증 정보 만들기` > **OAuth 클라이언트 ID**를 선택합니다.
   - **애플리케이션 유형**: `웹 애플리케이션`
   - **승인된 리디렉션 URI (Authorized redirect URIs)**에 다음 URL을 추가합니다:
     ```
     https://mwtgvkrvsrhxwmasvzms.supabase.co/auth/v1/callback
     ```
     _(내 Supabase 프로젝트 ID는 Supabase 대시보드 > Project Settings > General에서 확인 가능합니다)_
   - `만들기`를 누르면 **클라이언트 ID**와 **클라이언트 보안 비밀(Client Secret)**이 생성됩니다. 이 창을 닫지 마세요 (또는 복사해두세요).

## 2단계: Supabase 대시보드 설정

1. **[Supabase Dashboard](https://supabase.com/dashboard/)**에 접속하여 해당 프로젝트를 선택합니다.
2. **Authentication > Providers**로 이동합니다.
3. **Google**을 찾아 클릭하고 `Enable Google` 스위치를 켭니다.
4. 1단계에서 얻은 정보를 입력합니다:
   - **Client ID**: Google Cloud Console에서 복사한 값
   - **Client Secret**: Google Cloud Console에서 복사한 값
5. `Save`를 눌러 저장합니다.

## 3단계: URL 구성 확인

1. **Authentication > URL Configuration**으로 이동합니다.
2. **Site URL**이 배포된 사이트 주소(예: `https://myratingis.vercel.app`) 또는 로컬 주소(`http://localhost:3000`)로 설정되어 있는지 확인합니다.
3. **Redirect URLs**에 다음이 포함되어 있는지 확인합니다:
   - `http://localhost:3000/**`
   - `https://<YOUR_DEPLOYED_URL>/**`

이제 설정이 완료되었습니다! 잠시 후(약 1~2분 소요될 수 있음) 다시 로그인을 시도해보세요.
