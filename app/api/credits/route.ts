import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // ── 1. 세션에서 user 확인 ────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log('[credits] authError:', authError)
  console.log('[credits] user?.id:', user?.id ?? '(null — 세션 없음)')

  if (authError || !user) {
    console.log('[credits] → 401 반환: 세션 없음')
    return NextResponse.json(
      { error: '로그인이 필요합니다.', debug: { authError: authError?.message } },
      { status: 401 },
    )
  }

  // ── 2. credits 테이블 조회 ────────────────────────────────────────
  const { data, error: dbError } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  console.log('[credits] DB data:', data)
  console.log('[credits] DB error:', dbError)

  if (dbError) {
    // RLS에 막히거나 row가 없는 경우
    console.log('[credits] → DB 오류로 balance:0 fallback. dbError.code:', dbError.code, dbError.message)
    return NextResponse.json({
      balance: 0,
      debug: {
        reason: 'db_error_fallback',
        code: dbError.code,
        message: dbError.message,
        userId: user.id,
      },
    })
  }

  console.log('[credits] → balance:', data.balance, '반환')
  return NextResponse.json({ balance: data.balance })
}
