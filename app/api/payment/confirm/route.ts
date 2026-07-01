import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentProvider } from '@/lib/payment'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await req.json() as { orderId?: string; paymentKey?: string }
  const { orderId, paymentKey = 'test' } = body
  if (!orderId) {
    return NextResponse.json({ error: 'orderId가 필요합니다.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // orderId 조회 및 소유자 검증
  const { data: payment, error: fetchError } = await admin
    .from('payments')
    .select('order_id, user_id, amount, credits, status')
    .eq('order_id', orderId)
    .single()

  if (fetchError || !payment) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
  }
  if (payment.user_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  // 이미 완료된 주문 — 멱등성 보장
  if (payment.status === 'completed') {
    const { data: credits } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()
    return NextResponse.json({ success: true, balance: credits?.balance ?? 0 })
  }

  // PG 검증 (테스트 모드: stub always succeeds)
  const provider = getPaymentProvider()
  const result = await provider.confirmPayment(paymentKey, orderId, payment.amount)

  if (!result.success) {
    await admin
      .from('payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
    return NextResponse.json({ error: result.error ?? '결제 승인 실패' }, { status: 402 })
  }

  // apply_payment_topup RPC — admin(service_role)에서만 호출
  const { data: topupResult, error: rpcError } = await admin.rpc('apply_payment_topup', {
    p_order_id: orderId,
    p_user_id:  user.id,
    p_credits:  payment.credits,
  })

  if (rpcError) {
    return NextResponse.json({ error: '크레딧 지급 실패' }, { status: 500 })
  }

  const topup = topupResult as { success: boolean; balance?: number; reason?: string }
  if (!topup.success) {
    return NextResponse.json({ error: topup.reason ?? '크레딧 지급 실패' }, { status: 500 })
  }

  if (result.pgTxId) {
    await admin
      .from('payments')
      .update({ pg_tx_id: result.pgTxId })
      .eq('order_id', orderId)
  }

  return NextResponse.json({ success: true, balance: topup.balance ?? 0 })
}
