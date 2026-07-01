import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 서버 사이드 상품 정의 — 클라이언트 금액을 신뢰하지 않음
const PACKAGES = [
  { count: 1,  price: 1500 },
  { count: 3,  price: 2900 },
  { count: 5,  price: 4500 },
  { count: 10, price: 8900 },
] as const

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await req.json() as { packageIndex?: number }
  const pkg = PACKAGES[body.packageIndex ?? -1]
  if (!pkg) {
    return NextResponse.json({ error: '유효하지 않은 상품입니다.' }, { status: 400 })
  }

  const orderId = `usr_${user.id.slice(0, 8)}_${Date.now()}`

  const admin = createAdminClient()
  const { error } = await admin.from('payments').insert({
    order_id:    orderId,
    user_id:     user.id,
    amount:      pkg.price,
    credits:     pkg.count,
    status:      'pending',
    pg_provider: 'stub',
  })

  if (error) {
    return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 })
  }

  return NextResponse.json({ orderId, amount: pkg.price, credits: pkg.count })
}
