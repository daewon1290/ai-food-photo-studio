# 결제/크레딧 MVP 설계

## ⚠️ 운영 적용 보류 — 선행 조건

**현재 설계는 테스트 모드 기준이다. 아래 조건이 모두 충족되기 전까지 운영 결제키를 적용하지 않는다.**

### 1. 사업자 업종 추가

사업자등록증에 아래 업종 중 하나 이상이 등록되어 있어야 한다.

- AI 이미지 생성 서비스
- 소프트웨어 개발 및 공급
- 디지털 콘텐츠 제작 및 판매
- 온라인 정보 서비스 / 전자상거래

**업종 추가 전에는 운영 결제키를 발급받거나 적용하지 않는다.**

### 2. PG 심사 전 필수 준비 항목

PG사(Toss Payments, 나이스페이 등) 운영 계약 및 심사 신청 전 아래 항목이 서비스에 노출되어 있어야 한다.

- [ ] 이용약관
- [ ] 개인정보처리방침
- [ ] 환불 정책 (디지털 콘텐츠 특성상 구매 후 환불 불가 조건 포함)
- [ ] 사업자 정보 표시 (상호명, 대표자명, 사업자등록번호, 연락처, 소재지)

### 3. 운영 전환 체크리스트

- [ ] 사업자등록증 업종 추가 완료
- [ ] 이용약관 / 개인정보처리방침 페이지 게시
- [ ] 환불 정책 페이지 게시
- [ ] 사업자 정보 푸터 또는 별도 페이지 표시
- [ ] PG사 운영 계약 및 심사 통과
- [ ] 운영 결제키로 환경변수 교체
- [ ] 결제 영수증 / 세금계산서 발행 방식 확인
- [ ] 환불 처리 API 및 운영 프로세스 설계

---

## 크레딧 상품 정의

현재 `app/credits/page.tsx`의 `PACKAGES` 상수 기준:

| 상품 | 가격 | 장당 단가 | 비고 |
|------|------|----------|------|
| 1장 이용권 | 1,500원 | 1,500원 | 가볍게 테스트 |
| 3장 이용권 | 2,900원 | ~967원 | 첫 사용 추천 (추천) |
| 5장 이용권 | 4,500원 | 900원 | 자영업자 추천 |
| 10장 이용권 | 8,900원 | 890원 | 장당 최저가 |

상품 변경 시 `app/credits/page.tsx`의 `PACKAGES`와
`app/api/payment/prepare/route.ts`의 서버 사이드 금액 검증 맵을 반드시 동기화해야 한다.

---

## DB 구조

### 기존 테이블 (변경 없음)

- `credits`: `user_id`, `balance`, `updated_at`
- `credit_transactions`: `user_id`, `type`, `amount`, `balance_after`, `ref_id`, `note`, `created_at`

### 신규 테이블: `payments`

```sql
create table payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     text not null unique,     -- 중복 결제 방지 핵심 키
  user_id      uuid not null references auth.users(id),
  amount       int  not null,            -- 결제 금액 (원)
  credits      int  not null,            -- 지급할 크레딧 수
  status       text not null default 'pending',  -- pending | completed | failed | cancelled
  pg_tx_id     text,                     -- PG사 거래 ID (confirm 후 기록)
  pg_provider  text,                     -- 'toss' | 'stripe' 등
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
```

### 신규 RPC: `add_credits`

```sql
-- 중복 지급 방지 + 크레딧 지급 + 거래 기록을 원자적으로 처리
create or replace function add_credits(
  p_order_id text,
  p_user_id  uuid,
  p_credits  int
) returns jsonb language plpgsql security definer as $$
declare
  v_balance int;
begin
  -- 중복 orderId 체크
  if exists (
    select 1 from payments where order_id = p_order_id and status = 'completed'
  ) then
    return jsonb_build_object('success', false, 'reason', 'already_processed');
  end if;

  -- 크레딧 잔액 증가
  update credits set balance = balance + p_credits, updated_at = now()
    where user_id = p_user_id
    returning balance into v_balance;

  if not found then
    insert into credits (user_id, balance) values (p_user_id, p_credits)
      returning balance into v_balance;
  end if;

  -- 거래 기록
  insert into credit_transactions (user_id, type, amount, balance_after, ref_id, note)
    values (p_user_id, 'topup', p_credits, v_balance, p_order_id, 'payment');

  -- payments 상태 완료
  update payments set status = 'completed', updated_at = now()
    where order_id = p_order_id;

  return jsonb_build_object('success', true, 'balance', v_balance);
end;
$$;
```

---

## API 설계

### POST /api/payment/prepare

결제창 열기 전 호출. orderId를 서버에서 발급한다.

**요청**
```json
{ "packageIndex": 1 }
```

**처리**
1. 세션 확인 (401)
2. packageIndex → 서버 사이드 금액/크레딧 조회 (클라이언트 금액 신뢰하지 않음)
3. `order_id` 생성 (`uid-timestamp` 형식)
4. `payments` 테이블에 pending 기록
5. orderId, amount, credits 반환

**응답**
```json
{ "orderId": "usr_abc123_1719800000000", "amount": 2900, "credits": 3 }
```

---

### POST /api/payment/confirm

결제 완료 후 클라이언트가 paymentKey + orderId를 전달. 서버에서 PG사에 검증 요청 후 크레딧 지급.

**요청**
```json
{ "paymentKey": "...", "orderId": "usr_abc123_...", "amount": 2900 }
```

**처리**
1. 세션 확인 (401)
2. orderId로 payments 조회 → user_id, amount, credits 확인
3. 요청 amount와 DB amount 일치 확인 (금액 위변조 방지)
4. PG사 서버 API에 paymentKey + orderId + amount로 최종 승인 요청
5. 승인 성공 → `add_credits` RPC 호출 (원자적 지급)
6. 승인 실패 → `payments.status = 'failed'` 기록

**응답**
```json
{ "success": true, "balance": 4 }
```

---

### POST /api/payment/webhook (선택)

PG사가 서버로 직접 결제 결과를 전송하는 엔드포인트. confirm이 네트워크 오류로 누락된 경우 보완.

**처리**
1. PG사 서명 검증 (secret key 기반 HMAC)
2. 이미 completed인 orderId면 200 반환 (멱등성)
3. pending 상태면 `add_credits` RPC 호출

---

## 결제 흐름 (테스트 모드)

```
사용자: 패키지 선택
        ↓
POST /api/payment/prepare  →  orderId 발급, payments(pending)
        ↓
클라이언트: PG SDK 결제창 오픈 (orderId, amount)
        ↓
    ┌───┴───┐
  성공     실패/취소
    ↓         ↓
POST         결제창 닫힘
/api/payment/confirm   →  취소 안내 토스트
    ↓
PG사 서버 검증 (amount 일치 확인)
    ↓
    ├─ 성공 → add_credits RPC → 잔액 갱신 → 성공 토스트
    └─ 실패 → payments(failed) → 실패 안내 토스트
```

---

## 중복 지급 방지 전략

| 레이어 | 방법 |
|--------|------|
| DB | `payments.order_id UNIQUE` 제약 |
| RPC | `add_credits`에서 status='completed' 체크 후 early return |
| API | confirm 시 이미 completed이면 200 반환, 크레딧 재지급 없음 (멱등) |
| webhook | 동일 orderId 재수신 시 중복 처리 없이 200 반환 |

---

## 결제 추상화 레이어

PG사 미확정 상태이므로 인터페이스만 정의한다.

```
lib/payment/
├── types.ts     — PaymentProvider 인터페이스, ConfirmResult 타입
├── toss.ts      — Toss Payments 구현체 (PG 확정 후 작성)
└── index.ts     — 환경변수 PAYMENT_PROVIDER로 구현체 선택
```

```typescript
// lib/payment/types.ts
export interface PaymentProvider {
  confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<ConfirmResult>
}

export interface ConfirmResult {
  success: boolean
  pgTxId?: string
  error?: string
}
```

---

## 수정 대상 파일 후보 및 작업 순서

| 순서 | 작업 | 대상 |
|------|------|------|
| 1 | Supabase SQL 실행 | `payments` 테이블 + `add_credits` RPC |
| 2 | 환경변수 추가 | `.env.local` — PG 테스트 키 |
| 3 | 추상화 레이어 | `lib/payment/types.ts`, `lib/payment/index.ts` |
| 4 | prepare API | `app/api/payment/prepare/route.ts` |
| 5 | confirm API | `app/api/payment/confirm/route.ts` |
| 6 | webhook API | `app/api/payment/webhook/route.ts` (선택) |
| 7 | 충전 UI 연결 | `app/credits/page.tsx` — 버튼 실제 동작 |
