# 배포 전 체크리스트

마지막 업데이트: 2026-06-30

---

## 1. 현재 MVP 배포 가능 범위

배포해도 정상 동작하는 기능:

- 이메일 + 비밀번호 회원가입 / 로그인 / 로그아웃
- 가입 시 무료 크레딧 1개 자동 지급
- 앱 상단 크레딧 잔량 표시 (CreditBadge)
- 음식사진 배경 제거 + AI 이미지 생성 (`/app/api/generate-photo`)
- 포스터 이미지 생성 (`/app/api/generate-poster`)
- Flux 기반 이미지 생성 (`/app/api/generate-flux`)
- 크레딧 0개 시 생성 차단 (HTTP 402 반환)
- 생성 성공 시 크레딧 1개 차감 (`deduct_credit` RPC)
- `/credits` 충전 페이지 (상품 카드 표시, "결제 연동 준비중" 안내)

---

## 2. 아직 미완성인 기능 (배포해도 되지만 사용자에게 안내 필요)

| 기능 | 상태 | 사용자에게 보여줄 문구 |
|------|------|----------------------|
| 크레딧 충전 결제 | 미연동 | "결제 연동 준비 중입니다. 불편을 드려 죄송합니다." |
| 결제 내역 페이지 (`/my/payments`) | 미구현 | — |
| 생성 내역 페이지 (`/my/history`) | 미구현 | — |
| Kakao OAuth 로그인 | 미구현 | — |
| 이메일 알림 | 미구현 | — |

> `/credits` 페이지에는 이미 "결제 연동 준비 중" 문구가 노출되어 있으므로 추가 조치 불필요.

---

## 3. 배포 전 환경변수 체크리스트

Vercel 또는 Railway 대시보드의 Environment Variables에 아래 항목을 모두 입력해야 한다.

```
OPENAI_API_KEY=sk-...          # 상용화 전 반드시 새 키로 재발급
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
POSTER_GENERATION_MODE=edit    # edit 또는 generate
POSTER_IMAGE_MODEL=            # 비워두면 모드별 기본값 사용
PHOTOROOM_API_KEY=             # PhotoRoom API 사용 시 필수
FAL_KEY=                       # Fal.ai 사용 시 필수
```

- [ ] `OPENAI_API_KEY` 입력 완료
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 입력 완료
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력 완료
- [ ] `POSTER_GENERATION_MODE` 값 결정 및 입력 완료
- [ ] `PHOTOROOM_API_KEY` 입력 완료 (미사용이면 생략 가능)
- [ ] `FAL_KEY` 입력 완료 (미사용이면 생략 가능)

---

## 4. Supabase Auth Redirect URL 설정 체크리스트

Supabase Dashboard → Authentication → URL Configuration에서:

- [ ] **Site URL**: 배포 도메인으로 변경  
  예: `https://your-app.vercel.app`
- [ ] **Redirect URLs (Additional)**: 아래 두 항목 추가
  ```
  https://your-app.vercel.app/auth/callback
  https://your-app.vercel.app/**
  ```
- [ ] 로컬 개발용 `http://localhost:3000/**` 은 유지 (삭제하지 말 것)

> 미설정 시 이메일 인증 후 리디렉션이 localhost로 향해 로그인이 실패한다.

---

## 5. Supabase RLS / GRANT / RPC 확인 항목

Supabase SQL Editor 또는 Table Editor에서 확인:

### 테이블 RLS
- [ ] `credits` 테이블 RLS 활성화 여부 확인
  - `SELECT`: `auth.uid() = user_id` 조건 정책 존재
  - `INSERT`: service_role 또는 RPC를 통해서만 가능하도록 설정
- [ ] `credit_transactions` 테이블 RLS 활성화 여부 확인
  - `SELECT`: `auth.uid() = user_id` 조건 정책 존재

### RPC 함수
- [ ] `deduct_credit(p_user_id, p_ref_id)` 함수 존재 확인
- [ ] `deduct_credit` 함수가 `SECURITY DEFINER`로 정의되어 있는지 확인 (anon/authenticated 역할에서 호출 가능하려면 필요)
- [ ] 가입 트리거(`on_auth_user_created` 등)가 존재하여 신규 사용자에게 크레딧 1개를 자동 지급하는지 확인

### GRANT
- [ ] `authenticated` 역할에 `credits` 테이블 SELECT 권한 부여 확인
- [ ] `deduct_credit` RPC에 `authenticated` 역할 EXECUTE 권한 부여 확인

---

## 6. OpenAI API Key 상용화 전 재발급 필요 항목

- [ ] [OpenAI 대시보드](https://platform.openai.com/api-keys)에서 **현재 개발용 키 폐기**
- [ ] 상용화 전용 새 API Key 발급
- [ ] Vercel/Railway 환경변수의 `OPENAI_API_KEY`를 새 키로 교체
- [ ] Usage Limit 설정 (월 한도 설정 권장, 예: $50/월)
- [ ] 프로젝트별 API Key 분리 권장 (개발용 / 운영용)

> 로컬 `.env.local`에 있는 키를 git에 커밋하거나 공개하지 말 것. `.gitignore`에 `.env.local`이 포함되어 있는지 반드시 확인.

---

## 7. 결제 PG 미연동 상태에서 사용자에게 보여줄 문구

현재 `/credits` 페이지에 표시 중인 문구 (변경 불필요):

> "결제 연동 준비 중입니다."

추가로 고려할 안내 방식:

- CTA 버튼을 비활성화(`disabled`)하거나 "준비 중" 뱃지로 대체
- 문의 이메일 또는 오픈카톡 링크를 제공하여 수동 충전 요청 채널 안내
- 크레딧 부족 시 모달에 "충전 기능은 현재 준비 중입니다. 문의 주시면 수동 지급해 드립니다." 문구 추가 검토

---

## 8. 배포 후 테스트 시나리오

배포 완료 직후 아래 시나리오를 순서대로 수동 확인한다.

### 인증
- [ ] 신규 이메일로 회원가입 완료 → 이메일 인증 링크 수신 확인
- [ ] 인증 링크 클릭 후 앱으로 정상 리디렉션 확인
- [ ] 로그인 후 상단에 크레딧 `1` 표시 확인
- [ ] 로그아웃 후 재로그인 정상 동작 확인

### 생성 기능
- [ ] 크레딧 1개 상태에서 이미지 생성 시도 → 성공 확인
- [ ] 생성 후 크레딧 잔량 `0`으로 감소 확인
- [ ] 크레딧 0개 상태에서 생성 시도 → 차단 메시지 확인
- [ ] 크레딧 부족 시 `/credits` 페이지로 유도되는지 확인

### 크레딧 페이지
- [ ] `/credits` 접속 → 상품 카드 노출 확인
- [ ] 결제 버튼 클릭 시 "준비 중" 안내 노출 확인
- [ ] 비로그인 상태에서 `/credits` 접속 → 로그인 페이지로 리디렉션 확인

### 에러 처리
- [ ] 존재하지 않는 이메일/비밀번호로 로그인 시도 → 에러 메시지 노출 확인
- [ ] 네트워크 오류 시 생성 실패 메시지 노출 확인 (가능하면)

---

## 9. 배포하면 안 되는 파일 / 주의사항

### 절대 커밋/배포 금지
- `.env.local` — Supabase 키, OpenAI 키 포함. `.gitignore` 확인 필수
- `.env.*.local` 패턴 파일 전체

### 주의 파일
- `scripts/generate-template-covers.ts` — 로컬 전용 스크립트, 배포 빌드에 포함되지 않지만 불필요한 의존성을 주의
- `test-results/` — 로컬 테스트 결과물, 배포 대상 아님

### 빌드 전 확인
- [ ] `npm run build` 로컬에서 에러 없이 통과하는지 확인
- [ ] TypeScript 에러 없는지 확인 (`npx tsc --noEmit`)
- [ ] `next.config.ts`에 운영 환경에 맞는 설정인지 검토

---

## 10. 다음 단계 추천

우선순위 순으로 정렬:

1. **결제 PG 연동** — Toss Payments 또는 PortOne 중 선택 후 연동.  
   웹훅 수신 → `credits` 테이블 잔량 업데이트 로직 구현 필요.

2. **수동 크레딧 지급 프로세스 정립** — 결제 연동 전까지 운영자가 직접 Supabase Table Editor에서 크레딧을 지급하는 절차 문서화.

3. **OpenAI Usage Alert 설정** — 비용 초과 방지를 위해 OpenAI 대시보드에서 월 한도 및 알림 이메일 설정.

4. **에러 모니터링 도입** — Sentry 또는 Vercel Analytics 연동으로 운영 중 발생하는 에러를 실시간 추적.

5. **생성 내역 페이지 (`/my/history`)** — 사용자 재방문율을 높이는 핵심 기능. `credit_transactions` 테이블을 기반으로 구현 가능.

6. **Kakao OAuth 추가** — 국내 사용자 전환율 개선을 위한 소셜 로그인 추가.
