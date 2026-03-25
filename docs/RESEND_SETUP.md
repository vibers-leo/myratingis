# Resend 이메일 시스템 설정 가이드

## 📧 완료된 작업

✅ Resend SDK 설치 및 설정
✅ 이메일 발송 라이브러리
✅ 관리자 이메일 관리 페이지
✅ 이메일 발송 API
✅ 이메일 수신 Webhook
✅ 수신 이메일 저장 테이블

---

## 🔧 필수 설정 단계

### 1️⃣ 환경변수 설정

`.env.local` 파일에 추가:

```bash
RESEND_API_KEY=re_WyFQFwTB_LyQuQu6XM2Tzv4gX7vXKVq9U
```

**Vercel 환경변수도 동일하게 설정:**

```
Vercel Dashboard → Settings → Environment Variables
→ RESEND_API_KEY = re_WyFQFwTB_LyQuQu6XM2Tzv4gX7vXKVq9U
```

---

### 2️⃣ Supabase SMTP 설정

**Supabase 대시보드:**

```
https://supabase.com/dashboard
→ 제 평가는요? 프로젝트
→ Authentication → Settings → SMTP Settings

Enable Custom SMTP: ON

Sender email: noreply@myratingis.kr
Sender name: 제 평가는요?

Host: smtp.resend.com
Port: 587
Username: resend
Password: re_WyFQFwTB_LyQuQu6XM2Tzv4gX7vXKVq9U

→ Save
```

---

### 3️⃣ Resend 도메인 인증

**Resend 대시보드:**

```
https://resend.com/dashboard
→ Domains → Add Domain
→ myratingis.kr
```

**DNS 레코드 추가 (도메인 관리 페이지):**

Resend가 제공하는 DNS 레코드를 추가하세요:

```
Type: TXT
Name: @
Value: resend-verification=xxx... (Resend에서 제공)

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;

Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com
```

**⚠️ 실제 값은 Resend 대시보드에서 확인하세요!**

---

### 4️⃣ 이메일 수신 설정 (옵션)

**MX 레코드 추가 (도메인 관리 페이지):**

```
Type: MX
Name: @
Value: inbound.resend.com
Priority: 10
```

**Resend Webhook 설정:**

```
Resend Dashboard → Webhooks → Add Webhook

URL: https://myratingis.kr/api/webhooks/resend
Events: email.received
```

---

### 5️⃣ 데이터베이스 마이그레이션

**Supabase SQL Editor에서 실행:**

```sql
-- src/lib/supabase/migrations/20260118_received_emails.sql 파일 내용 복사
-- SQL Editor에 붙여넣기
-- Run 클릭
```

---

## 🧪 테스트

### 1. 이메일 발송 테스트

**관리자 페이지 접속:**

```
https://myratingis.kr/admin/emails

발신: myratingis@myratingis.kr
수신: 본인 이메일
제목: 테스트
내용: Resend 이메일 발송 테스트

→ 이메일 발송 클릭
```

### 2. 회원가입 인증 메일 테스트

```
1. 시크릿 모드로 myratingis.kr 접속
2. 회원가입
3. 이메일 수신 확인
4. 인증 링크 클릭
5. 로그인 성공
```

### 3. 이메일 수신 테스트 (MX 설정 후)

```
Gmail 등에서 support@myratingis.kr로 이메일 발송
→ 관리자 페이지에서 수신 확인
```

---

## 📋 사용 가능한 이메일 주소

DNS 설정 완료 후 사용 가능:

- ✉️ `noreply@myratingis.kr` - 시스템 자동 발송
- ✉️ `myratingis@myratingis.kr` - 공식 이메일
- ✉️ `support@myratingis.kr` - 고객 지원
- ✉️ `admin@myratingis.kr` - 관리자
- ✉️ `hello@myratingis.kr` - 일반 문의

---

## 🎯 다음 단계

1. ✅ `.env.local`에 API Key 추가
2. ✅ Vercel 환경변수 설정
3. ⏳ Supabase SMTP 설정
4. ⏳ Resend 도메인 인증 (DNS 레코드)
5. ⏳ 테스트 이메일 발송
6. ⏳ (옵션) 이메일 수신 설정

---

## 📞 문제 해결

### 이메일이 발송되지 않을 때:

1. API Key 확인 (`.env.local`, Vercel)
2. Supabase SMTP 설정 확인
3. Resend 대시보드에서 로그 확인

### 이메일이 스팸함으로 갈 때:

1. DNS 레코드 확인 (SPF, DKIM, DMARC)
2. 도메인 인증 완료 확인
3. Resend 대시보드에서 Deliverability 확인

### 이메일 수신이 안 될 때:

1. MX 레코드 확인
2. Resend Inbound 활성화 확인
3. Webhook URL 확인
