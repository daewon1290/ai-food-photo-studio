import type { SupabaseClient } from '@supabase/supabase-js'

interface DeductResult {
  success: boolean
  balance: number
  error?: string
}

export async function checkCredits(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .single()
  if (error || !data) return 0
  return data.balance as number
}

export async function deductCredit(
  supabase: SupabaseClient,
  userId: string,
  refId?: string,
): Promise<DeductResult> {
  const { data, error } = await supabase.rpc('deduct_credit', {
    p_user_id: userId,
    p_ref_id: refId ?? null,
  })
  if (error) return { success: false, balance: 0, error: error.message }
  return data as DeductResult
}
