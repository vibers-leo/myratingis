# MyRatingIs Public API 사용 가이드

외부 애플리케이션에서 MyRatingIs에 프로젝트를 자동으로 등록하고 관리할 수 있는 Public API입니다.

## 🔑 API Key 발급

1. [MyRatingIs](https://myratingis.kr)에 로그인
2. **마이페이지** → **AI 도구** → **API 설정** 이동
3. **새 API 키 생성** 버튼 클릭
4. 생성된 API 키를 안전한 곳에 보관 (한 번만 표시됨)

## 📡 Base URL

```
https://myratingis.kr/api/v1
```

## 🔐 인증

모든 API 요청에는 `Authorization` 헤더가 필요합니다:

```bash
Authorization: Bearer {YOUR_API_KEY}
```

## 📚 API Endpoints

### 1. 프로젝트 생성

새 프로젝트를 MyRatingIs에 등록합니다.

**Endpoint:** `POST /projects`

**Request Body:**

```json
{
  "title": "My Awesome App",
  "description": "AI 기반 포트폴리오 관리 도구",
  "content": "<h1>프로젝트 소개</h1><p>상세 내용...</p>",
  "visibility": "public",
  "categories": ["webapp", "design"],
  "tech_stack": ["Next.js", "TypeScript", "Supabase"],
  "thumbnail_base64": "data:image/png;base64,iVBORw0KG...",
  "screenshots_base64": ["data:image/png;base64,..."],
  "live_url": "https://my-app.vercel.app",
  "repo_url": "https://github.com/user/my-app",
  "version": {
    "tag": "1.0.0",
    "name": "Initial Release",
    "changelog": "첫 번째 릴리스",
    "release_type": "initial"
  }
}
```

**Response:**

```json
{
  "success": true,
  "project": {
    "id": 123,
    "title": "My Awesome App",
    "url": "https://myratingis.kr/project/123",
    "thumbnail_url": "https://...",
    "visibility": "public",
    "created_at": "2026-01-18T12:00:00Z"
  }
}
```

### 2. 프로젝트 목록 조회

내 프로젝트 목록을 가져옵니다.

**Endpoint:** `GET /projects?page=1&limit=20`

**Response:**

```json
{
  "success": true,
  "projects": [
    {
      "project_id": 123,
      "title": "My Awesome App",
      "description": "...",
      "thumbnail_url": "https://...",
      "visibility": "public",
      "created_at": "2026-01-18T12:00:00Z",
      "views_count": 150,
      "likes_count": 25
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 3. 프로젝트 조회

특정 프로젝트의 상세 정보를 가져옵니다.

**Endpoint:** `GET /projects/{id}`

### 4. 프로젝트 수정

기존 프로젝트를 업데이트합니다.

**Endpoint:** `PUT /projects/{id}`

### 5. 프로젝트 삭제

프로젝트를 삭제합니다 (Soft Delete).

**Endpoint:** `DELETE /projects/{id}`

### 6. 새 버전 추가

프로젝트의 새 버전을 등록합니다.

**Endpoint:** `POST /projects/{id}/versions`

**Request Body:**

```json
{
  "version_tag": "1.0.1",
  "version_name": "Bug Fix Release",
  "changelog": "버그 수정 및 성능 개선",
  "release_type": "patch"
}
```

### 7. 버전 목록 조회

프로젝트의 모든 버전을 가져옵니다.

**Endpoint:** `GET /projects/{id}/versions`

## 🚀 사용 예시

### cURL

```bash
curl -X POST https://myratingis.kr/api/v1/projects \
  -H "Authorization: Bearer vf_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Project",
    "description": "Project description",
    "visibility": "public",
    "categories": ["webapp"]
  }'
```

### JavaScript/TypeScript

```typescript
const API_KEY = "vf_abc123...";
const BASE_URL = "https://myratingis.kr/api/v1";

async function createProject(data: any) {
  const response = await fetch(`${BASE_URL}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}
```

## ⚠️ Rate Limiting

- 기본 제한: **60 requests/minute**
- 제한 초과 시 `429 Too Many Requests` 응답

## 🔒 보안

- API 키는 **절대 공개 저장소에 커밋하지 마세요**
- 환경 변수로 관리하세요
- 주기적으로 API 키를 갱신하세요
