'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

interface Props {
  onClose: () => void
}

function formatError(err: unknown): string {
  if (!err) return '(error is null/undefined)'
  if (typeof err === 'string') return err
  if (typeof err === 'number') return `error is a number: ${err}`
  if (err instanceof Error) return err.message
  // Supabase AuthError shape
  const e = err as Record<string, unknown>
  if (typeof e.message === 'string' && e.message) return e.message
  // fallback: dump the whole object
  return JSON.stringify(err, null, 2)
}

export default function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  const reset = () => { setErrorMsg(''); setDebugInfo('') }
  const switchMode = (next: Mode) => { setMode(next); reset() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)

    const supabase = createClient()

    if (mode === 'signup') {
      console.log('[AuthModal] signUp 호출 시작')
      console.log('[AuthModal] email:', email)
      console.log('[AuthModal] password length:', password.length)

      const { data, error } = await supabase.auth.signUp({ email, password })

      console.log('[AuthModal] signUp data:', JSON.stringify(data, null, 2))
      console.log('[AuthModal] signUp error:', error)

      setLoading(false)

      if (error) {
        const msg = formatError(error)
        console.error('[AuthModal] 에러:', msg)
        setErrorMsg(msg)
        setDebugInfo(JSON.stringify(error, null, 2))
        return
      }

      // 성공했지만 session이 null인 경우 → Confirm email이 아직 켜져 있는 것
      if (!data.session) {
        console.warn('[AuthModal] signUp 성공했지만 session이 null. Confirm email OFF 확인 필요.')
        setDebugInfo(JSON.stringify(data, null, 2))
        setErrorMsg(
          '가입은 됐지만 자동 로그인에 실패했습니다.\n' +
          'Supabase 대시보드 → Authentication → Email → "Confirm email"이 OFF인지 확인해 주세요.\n' +
          '또는 로그인 탭에서 방금 가입한 계정으로 로그인해 보세요.'
        )
        return
      }

      console.log('[AuthModal] 회원가입 성공. user:', data.user?.id, 'session:', !!data.session)
      // onAuthStateChange가 page.tsx에서 발동 → user 상태 + credits fetchCredits 자동 실행
      onClose()

    } else {
      console.log('[AuthModal] signInWithPassword 호출 시작')
      console.log('[AuthModal] email:', email)

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      console.log('[AuthModal] signIn data:', JSON.stringify(data, null, 2))
      console.log('[AuthModal] signIn error:', error)

      setLoading(false)

      if (error) {
        const msg = formatError(error)
        console.error('[AuthModal] 에러:', msg)
        setErrorMsg(msg)
        setDebugInfo(JSON.stringify(error, null, 2))
        return
      }

      console.log('[AuthModal] 로그인 성공. user:', data.user?.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          aria-label="닫기"
        >
          ✕
        </button>

        <div className="space-y-5">
          {/* 헤더 */}
          <div className="text-center">
            <span className="text-4xl block mb-3">🍽️</span>
            <h2 className="text-lg font-bold text-gray-900">
              {mode === 'login' ? '로그인' : '회원가입'}
            </h2>
            {mode === 'signup' && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                가입 즉시{' '}
                <span className="text-orange-500 font-semibold">크레딧 1개</span>를 드려요
              </p>
            )}
          </div>

          {/* 탭 */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 transition-colors ${
                mode === 'login' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 transition-colors ${
                mode === 'signup' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); reset() }}
              placeholder="이메일"
              required
              autoComplete="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); reset() }}
              placeholder="비밀번호 (6자 이상)"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />

            {/* 에러 메시지 */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
                <p className="text-xs text-red-700 font-semibold">오류</p>
                <p className="text-xs text-red-600 whitespace-pre-wrap leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* 에러 원문 (디버그용) */}
            {debugInfo && (
              <div className="bg-gray-900 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 mb-1">Supabase 응답 원문</p>
                <pre className="text-xs text-green-400 whitespace-pre-wrap break-all leading-relaxed">
                  {debugInfo}
                </pre>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300 text-white py-3 rounded-xl font-bold text-sm transition-colors"
            >
              {loading
                ? (mode === 'signup' ? '가입 중…' : '로그인 중…')
                : (mode === 'signup' ? '회원가입' : '로그인')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
