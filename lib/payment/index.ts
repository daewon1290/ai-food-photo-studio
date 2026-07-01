import type { PaymentProvider, ConfirmResult } from './types'

// 테스트 모드 stub: 실제 PG 호출 없이 항상 성공 반환
// 운영 전환 시 이 파일에 실제 PG 구현체로 교체
const stubProvider: PaymentProvider = {
  async confirmPayment(): Promise<ConfirmResult> {
    return { success: true, pgTxId: `test_${Date.now()}` }
  },
}

export function getPaymentProvider(): PaymentProvider {
  return stubProvider
}
