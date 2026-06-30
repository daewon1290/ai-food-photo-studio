# TODO

마지막 업데이트: 2026-06-30

---

## 배포

- [ ] 배포 준비 체크리스트 작성
- [ ] Vercel 또는 Railway 배포 방식 결정
- [ ] Supabase Auth → Redirect URL에 배포 도메인 추가
- [ ] 배포 환경변수 정리 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENAI_API_KEY 등)
- [ ] 상용화 전 OpenAI API Key 재발급 + 기존 키 폐기

## 결제

- [ ] 실제 결제 PG 후보 비교: Toss Payments vs PortOne
- [ ] PG 연동 전까지 `/credits` 페이지는 "결제 연동 준비중" 상태 유지
- [ ] 결제 성공 웹훅 수신 → DB 크레딧 충전 구현
- [ ] 결제 내역 페이지 (`/my/payments`) 구현

## 품질 개선

- [ ] 음식사진 생성 품질 테스트 계속 진행 (장기 과제)
- [ ] 포스터 생성 품질 테스트 계속 진행
- [ ] `scripts/generate-template-covers.ts` 처리 여부 결정 (커밋할지 제거할지)

## 기능 확장 (우선순위 미정)

- [ ] 생성 내역 페이지 검토 (`/my/history`)
- [ ] 재생성권 수동 지급 프로세스 정립
- [ ] Kakao OAuth 추가 (국내 사용자 편의)
- [ ] 이메일 알림 (충전 완료, 생성 완료)

## 완료

- [x] Supabase 프로젝트 생성 및 env 설정
- [x] credits / credit_transactions 테이블 생성
- [x] 이메일+비밀번호 회원가입/로그인
- [x] 가입 시 무료 크레딧 1개 자동 지급
- [x] 앱 상단 크레딧 표시 (CreditBadge)
- [x] 생성 성공 시 deduct_credit RPC로 크레딧 차감
- [x] 크레딧 0개 시 생성 API 402 차단
- [x] credit_transactions에 use 기록 저장
- [x] /credits 충전 페이지 (상품 카드, 준비중 안내)
- [x] 메인 카드 CTA에 크레딧 부족 시 충전 안내 표시
