# AI 음식사진 스튜디오 — MVP 서비스 설계

작성일: 2026-06-28  
상태: 설계 단계 (구현 전)

---

## 1. 전체 사용자 플로우

```
[랜딩 페이지]
    │
    ├─ 비로그인 상태
    │   └─ 사진 생성 버튼 클릭 → 로그인/회원가입 유도 모달
    │
    └─ 로그인 상태
        │
        ├─ 크레딧 있음 → 사진 생성 가능
        │   ├─ 생성 성공 → 크레딧 1개 차감 → 결과 다운로드
        │   ├─ 시스템 오류 → 크레딧 유지 → 재시도 안내
        │   └─ 결과 불만족 → 재생성권 1회 제공 (크레딧 추가 차감 없음)
        │
        └─ 크레딧 없음 → 생성 버튼 비활성화 + 충전 안내 표시
                └─ 결제 페이지 → 패키지 선택 → (PG 연동 예정) → 크레딧 충전
```

---

## 2. 회원가입/로그인 플로우

### 2-1. 인증 방식 (MVP)

MVP에서는 **NextAuth.js v5** 기반으로 구현한다.  
소셜 로그인만 지원하여 비밀번호 관리 부담을 없앤다.

| 순서 | 방식 | 이유 |
|------|------|------|
| 1순위 | Google OAuth | 국내외 범용, 설정 간단 |
| 2순위 | Kakao OAuth | 국내 사용자 친화적 |
| 나중 | 이메일/비밀번호 | MVP 이후 추가 가능 |

### 2-2. 회원가입 완료 후 처리

1. `users` 테이블에 유저 레코드 생성
2. `credits` 테이블에 무료 크레딧 1개 자동 지급
3. `credit_transactions` 테이블에 `signup_bonus` 타입으로 기록
4. 대시보드 또는 생성 페이지로 리다이렉트

### 2-3. 중복 가입 방지

- 동일 이메일로 다른 소셜 로그인 시도 시 계정 연결 처리 (Account Linking)
- 무료 크레딧은 최초 가입 1회만 지급

---

## 3. 무료 크레딧 지급 정책

| 항목 | 내용 |
|------|------|
| 지급 시점 | 최초 회원가입 완료 직후 |
| 지급량 | 1크레딧 |
| 유효기간 | 없음 (만료 없음, MVP 기준) |
| 중복 지급 | 불가 (DB에 `signup_bonus` 기록으로 확인) |
| 환불 가능 여부 | 불가 (무료 제공분) |

---

## 4. 크레딧 차감 정책

### 4-1. 차감 조건

- 이미지 생성 API 호출이 **성공적으로 완료**된 경우에만 차감
- "성공"의 정의: OpenAI API가 이미지 URL 또는 base64 데이터를 정상 반환한 경우

### 4-2. 차감하지 않는 경우

| 상황 | 처리 |
|------|------|
| OpenAI API 타임아웃 | 차감 없음, 재시도 안내 |
| OpenAI API 오류 응답 (5xx) | 차감 없음, 재시도 안내 |
| 콘텐츠 정책 거부 (content filter) | 차감 없음, 사용자에게 안내 |
| 서버 내부 오류 | 차감 없음 |
| 네트워크 단절 | 차감 없음 |

### 4-3. 차감 구현 순서 (나중에 구현 시 참고)

```
1. 생성 요청 수신
2. 유저 인증 확인
3. 크레딧 잔액 확인 (잔액 < 1이면 즉시 403 반환)
4. OpenAI API 호출
5. 성공 응답 수신 후 → DB 트랜잭션으로 크레딧 차감 + 기록
6. 실패 시 → 차감 없이 에러 반환
```

트랜잭션 안에서 차감과 기록을 동시에 처리하여 부분 실패를 방지한다.

---

## 5. 재생성권 정책

### 5-1. 제공 조건

- 이미지 생성 성공 후, 사용자가 "결과가 마음에 들지 않는다"고 신청
- 환불 대신 **재생성권 1회**를 제공

### 5-2. 세부 규칙

| 항목 | 내용 |
|------|------|
| 제공 시점 | 사용자가 결과 불만족 신청 후 (자동 또는 수동 검토) |
| 재생성권 유효기간 | 발급 후 7일 (협의 가능) |
| 사용 방식 | 동일 생성 플로우에서 크레딧 대신 재생성권 우선 소모 |
| 환불 여부 | 재생성권으로 대체, 현금/크레딧 환불 없음 |
| 중복 신청 | 1건당 1회만 허용 |

### 5-3. MVP 단계 처리

MVP에서는 자동 지급 대신 **수동 지급**으로 운영한다.  
사용자가 이메일/채널로 신청 → 관리자가 DB에서 직접 재생성권 추가.

---

## 6. 결제 상품 구조

### 6-1. 크레딧 패키지

| 패키지 | 크레딧 | 가격 (원) | 단가 | 비고 |
|--------|--------|-----------|------|------|
| 기본 | 1장 | 1,500 | 1,500원/장 | 낱장 구매 |
| 소형 | 3장 | 3,900 | 1,300원/장 | 13% 할인 |
| 중형 | 5장 | 5,900 | 1,180원/장 | 21% 할인 |
| 대형 | 10장 | 9,900 | 990원/장 | 34% 할인 |

> 가격은 시장 반응에 따라 조정 가능. DB의 `products` 테이블에서 관리하여 코드 수정 없이 변경 가능하게 설계.

### 6-2. 결제 흐름 (PG 연동 예정)

```
크레딧 없음 → 충전 버튼 → 패키지 선택 페이지
    → PG 결제창 (Toss Payments 또는 PortOne)
    → 결제 성공 웹훅 수신
    → DB에 크레딧 충전 + 결제 내역 기록
    → 생성 페이지로 복귀
```

---

## 7. DB 테이블 초안

### 7-1. `users`

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  image       TEXT,                    -- 소셜 프로필 이미지
  provider    TEXT NOT NULL,           -- 'google' | 'kakao'
  provider_id TEXT NOT NULL,           -- 소셜에서 받은 고유 ID
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 7-2. `credits`

```sql
CREATE TABLE credits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance    INTEGER NOT NULL DEFAULT 0,   -- 현재 보유 크레딧
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);
```

### 7-3. `credit_transactions`

```sql
CREATE TABLE credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL,          -- 'signup_bonus' | 'purchase' | 'use' | 'regenerate_bonus'
  amount      INTEGER NOT NULL,       -- 양수: 충전, 음수: 차감
  balance_after INTEGER NOT NULL,     -- 트랜잭션 후 잔액 (감사 추적용)
  ref_id      TEXT,                   -- 연관 결제 ID 또는 생성 요청 ID
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 7-4. `products`

```sql
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,          -- '기본 1장', '소형 3장' 등
  credits     INTEGER NOT NULL,       -- 지급 크레딧 수
  price       INTEGER NOT NULL,       -- 원화 가격 (단위: 원)
  is_active   BOOLEAN DEFAULT TRUE,   -- 판매 중단 시 false
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 7-5. `payments`

```sql
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  product_id     UUID NOT NULL REFERENCES products(id),
  pg_provider    TEXT,                -- 'toss' | 'portone'
  pg_payment_key TEXT,               -- PG사 결제 키
  status         TEXT NOT NULL,       -- 'pending' | 'paid' | 'failed' | 'refunded'
  amount         INTEGER NOT NULL,
  credits        INTEGER NOT NULL,    -- 충전된 크레딧 수
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### 7-6. `generation_requests` (선택적, 향후 추가)

```sql
CREATE TABLE generation_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL,          -- 'photo' | 'poster'
  status      TEXT NOT NULL,          -- 'pending' | 'success' | 'failed'
  credit_used BOOLEAN DEFAULT FALSE,
  result_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. API 라우트 초안

### 8-1. 인증

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth 핸들러 |

### 8-2. 크레딧

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/credits` | 내 크레딧 잔액 조회 |
| GET | `/api/credits/transactions` | 크레딧 사용 내역 |

### 8-3. 결제 (PG 연동 시 구현)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/products` | 결제 상품 목록 |
| POST | `/api/payments/prepare` | 결제 준비 (주문 ID 생성) |
| POST | `/api/payments/confirm` | 결제 성공 확인 및 크레딧 충전 |
| POST | `/api/payments/webhook` | PG사 웹훅 수신 (이중 안전장치) |

### 8-4. 기존 생성 API (수정 예정)

| 메서드 | 경로 | 추가 처리 |
|--------|------|-----------|
| POST | `/api/generate-photo` | 인증 + 크레딧 확인 + 차감 로직 추가 예정 |
| POST | `/api/generate-poster` | 인증 + 크레딧 확인 + 차감 로직 추가 예정 |

---

## 9. MVP에서 먼저 구현할 범위

1. **NextAuth 설정** — Google OAuth 소셜 로그인
2. **DB 연결** — Supabase (PostgreSQL) 또는 PlanetScale
3. **users / credits / credit_transactions 테이블** 생성 및 마이그레이션
4. **회원가입 시 무료 크레딧 1개 자동 지급** — NextAuth `signIn` 콜백 처리
5. **크레딧 잔액 표시 UI** — 헤더 또는 생성 페이지 상단
6. **크레딧 없을 때 생성 버튼 비활성화 + 충전 안내 모달**
7. **생성 성공 시 크레딧 차감** — 기존 API 라우트에 미들웨어 추가
8. **시스템 오류 시 크레딧 미차감** 보장

---

## 10. 나중에 구현할 범위

| 항목 | 시점 |
|------|------|
| Toss Payments / PortOne PG 연동 | 사용자 테스트 후 |
| Kakao OAuth 추가 | 필요 시 |
| 재생성권 자동 지급 시스템 | MVP 이후 |
| 결제 내역 페이지 | PG 연동과 함께 |
| 관리자 대시보드 (크레딧 수동 조정) | 필요 시 |
| 이메일 알림 (충전 완료, 생성 완료) | 나중에 |
| 구독 플랜 | 충분한 사용자 확보 후 |

---

## 11. 보안 / 환경변수 주의사항

### 11-1. 필수 환경변수 (`.env.local`)

```
# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<랜덤 32자 이상 문자열>

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# DB
DATABASE_URL=

# OpenAI
OPENAI_API_KEY=

# PG (나중에 추가)
# TOSS_CLIENT_KEY=
# TOSS_SECRET_KEY=
```

### 11-2. 보안 원칙

- `NEXTAUTH_SECRET`은 `openssl rand -base64 32`로 생성, 절대 코드에 하드코딩 금지
- `OPENAI_API_KEY`는 서버 사이드 전용, 클라이언트에 절대 노출 금지
- PG 시크릿 키는 웹훅 검증에만 사용, 프론트엔드로 노출 금지
- 크레딧 차감은 반드시 서버에서만 처리 (클라이언트 신뢰 금지)
- API 라우트에 인증 미들웨어 적용 필수

---

## 12. 상용화 전 OpenAI API Key 재발급 체크리스트

현재 개발/테스트에 사용 중인 키는 상용화 전 반드시 교체한다.

- [ ] OpenAI 콘솔에서 새 프로덕션 API Key 발급
- [ ] 기존 개발용 키 즉시 폐기 (Revoke)
- [ ] 새 키를 프로덕션 환경변수에만 설정 (코드/git에 절대 커밋 금지)
- [ ] `.gitignore`에 `.env.local`, `.env.production` 포함 여부 확인
- [ ] OpenAI 사용량 제한 (Usage Limit) 설정 — 월 예산 초과 방지
- [ ] OpenAI 청구 알림 이메일 설정
- [ ] git 히스토리에 키가 커밋된 적 있는지 확인 (`git log -p | grep sk-`)
  - 만약 있다면 즉시 키 폐기 후 히스토리 정리 (BFG Repo Cleaner 등)
- [ ] 프로덕션 도메인을 OpenAI 허용 목록에 추가 (필요 시)
- [ ] Rate limit 플랜 확인 — 예상 트래픽에 맞는 티어 선택

---

## 13. 기술 스택 결정 사항 (예정)

| 항목 | 선택지 | 추천 |
|------|--------|------|
| 인증 | NextAuth v5 | NextAuth v5 (App Router 지원) |
| DB | Supabase / PlanetScale / Neon | Supabase (Postgres + 관리 편의) |
| ORM | Prisma / Drizzle | Prisma (타입 안전, 마이그레이션) |
| 결제 PG | Toss Payments / PortOne | Toss Payments (국내 문서 우수) |
| 배포 | Vercel | Vercel (Next.js 최적화) |
