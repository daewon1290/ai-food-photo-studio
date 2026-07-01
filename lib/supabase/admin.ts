import { createClient } from '@supabase/supabase-js'

// service_role 클라이언트 — RLS 우회, API route에서만 사용
// 클라이언트 컴포넌트에서 import 금지
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
