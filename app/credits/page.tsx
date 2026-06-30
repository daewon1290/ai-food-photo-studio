'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const PACKAGES = [
  { count: 1,  price: 1500, perUnit: 1500, badge: '가볍게 테스트',   highlight: false },
  { count: 3,  price: 2900, perUnit: 967,  badge: '첫 사용 추천',    highlight: true  },
  { count: 5,  price: 4500, perUnit: 900,  badge: '자영업자 추천',   highlight: false },
  { count: 10, price: 8900, perUnit: 890,  badge: '장당 최저가',     highlight: false },
] as const

export default function CreditsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    const res = await fetch('/api/credits')
    if (res.ok) {
      const json = await res.json() as { balance?: number }
      setBalance(json.balance ?? 0)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      if (user) fetchBalance()
    })
  }, [fetchBalance])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <main className="min-h-screen bg-[#FFF9F5]">
      {/* 헤더 */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">🍽️</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">AI 음식사진 스튜디오</h1>
            <p className="text-xs text-orange-400 leading-tight font-medium">크레딧 충전</p>
          </div>
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors shrink-0"
          >
            ← 돌아가기
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-20">

        {/* 토스트 */}
        {toast && (
          <div className="bg-orange-500 text-white text-sm font-semibold rounded-xl px-4 py-3 text-center shadow-md">
            {toast}
          </div>
        )}

        {/* 현재 잔액 (로그인 시) */}
        {isLoggedIn && balance !== null && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">현재 잔여 크레딧</p>
              <p className="text-xl font-bold text-orange-500">✨ {balance}개</p>
            </div>
            <Link href="/" className="text-xs text-orange-500 font-medium hover:underline">
              생성하러 가기 →
            </Link>
          </div>
        )}

        {/* 설명 문구 */}
        <div className="space-y-1.5">
          <p className="text-sm text-gray-800 font-medium leading-relaxed">
            처음 1장은 무료로 만들어보고, 마음에 들면 필요한 만큼만 충전하세요.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            전문 촬영이나 디자인 의뢰 전, 부담 없이 메뉴 홍보 이미지를 테스트해볼 수 있습니다.
          </p>
        </div>

        {/* 상품 카드 (모바일: 1열, sm 이상: 2열) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.count}
              className={`relative bg-white rounded-2xl border-2 shadow-sm p-5 flex flex-col gap-4 ${
                pkg.highlight
                  ? 'border-orange-400 ring-2 ring-orange-100'
                  : 'border-gray-200'
              }`}
            >
              {pkg.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                  추천
                </span>
              )}

              {/* 상품 정보 */}
              <div className="space-y-0.5">
                <p className="text-base font-bold text-gray-900">{pkg.count}장 이용권</p>
                <p className="text-xs font-semibold text-orange-500">{pkg.badge}</p>
              </div>

              {/* 가격 */}
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-gray-900">
                  {pkg.price.toLocaleString('ko-KR')}원
                </p>
                <p className="text-xs text-gray-400">
                  장당 약 {pkg.perUnit.toLocaleString('ko-KR')}원
                </p>
              </div>

              {/* 결제 버튼 */}
              <button
                onClick={() => showToast('결제 기능은 준비 중입니다. 곧 오픈 예정이에요.')}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-sm font-semibold transition-colors"
              >
                결제 연동 준비중
              </button>
            </div>
          ))}
        </div>

        {/* 비로그인 안내 */}
        {isLoggedIn === false && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-5 text-center space-y-3">
            <p className="text-sm text-orange-700 font-semibold">로그인 후 이용 가능합니다</p>
            <p className="text-xs text-orange-500 leading-relaxed">
              회원가입 시 무료 크레딧 1장을 드려요.
            </p>
            <Link
              href="/"
              className="inline-block text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              로그인하러 가기
            </Link>
          </div>
        )}

        {/* MVP 안내 */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 leading-relaxed">
            현재 MVP 테스트 단계입니다. 결제 기능은 조만간 오픈 예정이에요.
            크레딧이 필요하시면 운영자에게 문의해 주세요.
          </p>
        </div>

      </div>
    </main>
  )
}
