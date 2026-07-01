export interface ConfirmResult {
  success: boolean
  pgTxId?: string
  error?: string
}

export interface PaymentProvider {
  confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<ConfirmResult>
}
