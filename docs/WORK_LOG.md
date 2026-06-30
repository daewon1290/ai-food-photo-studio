# 작업 로그

---

## 2026-06-28 ~ 2026-06-30 — Supabase 인증 · 크레딧 시스템 구현

### 배경
결제 PG 연동 전 단계로, 회원가입/로그인과 크레딧 차감 시스템을 먼저 구현하기로 결정.  
실제 Toss Payments / PortOne 연동은 다음 단계.

---

### 완료 항목

#### 1. Supabase 프로젝트 설정
- Supabase 프로젝트 생성 (Project URL, Publishable key 발급)
- `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
- `@supabase/ssr`, `@supabase/supabase-js` 패키지 설치
- `lib/supabase/client.ts` (브라우저 클라이언트) 작성
- `lib/supabase/server.ts` (서버 클라이언트, async cookies) 작성
- `proxy.ts` — Next.js 16 미들웨어 (파일명·export명 모두 `proxy`, `middleware` 아님)

#### 2. DB 테이블 생성 (Supabase SQL Editor)
- `credits` 테이블: `user_id`, `balance`, `updated_at`
- `credit_transactions` 테이블: `user_id`, `type`, `amount`, `balance_after`, `ref_id`, `note`, `created_at`
- RLS 활성화 + SELECT/UPDATE 정책 설정 (`auth.uid() = user_id`)
- `authenticated` 역할에 GRANT 부여

#### 3. 회원가입 시 무료 크레딧 자동 지급
- Supabase Database Function + Trigger 방식으로 구현
  - `on_auth_user_created` 트리거 → `handle_new_user()` 함수 자동 호출
  - `credits` 테이블에 `balance = 1` INSERT
  - `credit_transactions`에 `type='signup_bonus'`, `amount=1` 기록
- 테스트 계정 가입 후 DB에서 `balance: 1`, `signup_bonus` 트랜잭션 확인

#### 4. 이메일+비밀번호 회원가입/로그인 구현
- Magic Link 방식 시도 → Supabase 500 에러로 실패 → 이메일+비밀번호로 전환
- Supabase Dashboard에서 "Confirm email" OFF 설정
- `components/AuthModal.tsx`: 로그인/회원가입 탭 전환, 에러 표시, `formatError()` 함수
- 가입 성공 시 `onAuthStateChange`로 상태 동기화

#### 5. 앱 상단 크레딧 표시
- `components/CreditBadge.tsx` 작성
  - 비로그인: "로그인" 버튼
  - 로그인: "✨ N개" 뱃지 + 로그아웃 버튼
  - credits === 0: "충전" 링크 추가 표시
- `app/page.tsx`: `fetchCredits` (useCallback), `onAuthStateChange` 구독, 헤더에 CreditBadge 추가
- `/api/credits` GET 라우트 작성 (인증 확인 → DB 조회 → balance 반환)

#### 6. 크레딧 차감 로직 구현
- `lib/supabase/credits.ts` 작성
  - `checkCredits(supabase, userId)` — balance 조회
  - `deductCredit(supabase, userId, refId?)` — RPC 호출
- `deduct_credit` PostgreSQL 함수 (SECURITY DEFINER, Supabase SQL Editor에서 실행)
  - `UPDATE credits WHERE balance > 0` — 동시 클릭 race condition 방지
  - 성공 시 `credit_transactions`에 `type='use'`, `amount=-1` INSERT
  - `GRANT EXECUTE TO authenticated`
- `app/api/generate-photo/route.ts` 수정
  - 최상단: auth check (401) → credit check (402) → OpenAI 호출 → 성공 시 `deductCredit()`
- `app/api/generate-poster/route.ts` 동일 패턴 적용
- `components/PosterMode.tsx`: `onCreditUsed?: () => void` 콜백 추가
- `app/page.tsx`: 401 → 로그인 모달, 402 → 에러 + `fetchCredits()`, 성공 → `fetchCredits()`

#### 7. 크레딧 충전 안내 UI
- `app/credits/page.tsx` 신규 작성
  - 현재 잔액 표시 (로그인 시)
  - 1장(1,500원) / 3장(2,900원) / 5장(4,500원) / 10장(8,900원) 상품 카드
  - "결제 연동 준비중" 버튼 (클릭 시 토스트)
  - 비로그인 시 로그인 안내
  - MVP 테스트 단계 안내
- `components/CreditBadge.tsx`: credits === 0 시 "충전" 링크
- `app/page.tsx` HeroSection: credits === 0 시 음식사진/포스터 카드 CTA를 충전 안내 블록으로 교체
- `components/PosterMode.tsx`: 402 에러 시 "충전하기 →" 링크

#### 8. 자동 테스트 실행 (Node.js 스크립트)
- 401 인증 가드: `/api/generate-photo`, `/api/generate-poster`, `/api/credits` 모두 확인
- 402 크레딧 부족: balance = 0 상태에서 생성 시도 → 402 정상 반환
- `deduct_credit` RPC: balance 1 → 0, `credit_transactions` 기록 생성 확인
- 실제 OpenAI 생성 1회: 이미지 2장 생성 → balance 1 → 0, `/api/credits` balance:0, 트랜잭션 기록 확인
- balance = 0 재호출: 402 반환, balance 변화 없음 확인

---

### 커밋 기록

| 커밋 해시 | 메시지 |
|-----------|--------|
| `de60717` | Add Supabase auth and credit display |
| `ca5018c` | Add credit gating and generation deduction |
| `a54a7ab` | Add credit top-up UI and pricing page |

---

### 기술적 주의사항

- **Next.js 16 미들웨어**: `middleware.ts` 대신 `proxy.ts`, export명도 `proxy`
- **Supabase anon key**: 신형 `sb_publishable_` 포맷 사용 (기존 `eyJ...` JWT 아님)
- **Service role key 미사용**: `deduct_credit`을 SECURITY DEFINER RPC로 구현하여 anon key만으로 안전한 서버사이드 차감 처리
- **쿠키 포맷**: `@supabase/ssr`이 저장하는 세션 쿠키는 `sb-[project-ref]-auth-token = JSON.stringify(session)` (base64 아님, 3180자 이하일 경우 단일 쿠키)
- **credits === null vs 0**: null은 로딩 중, 0은 확인된 잔액 없음으로 구분 처리
