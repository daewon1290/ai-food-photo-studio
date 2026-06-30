'use client'

import Link from 'next/link'

interface Props {
  credits: number | null
  isLoggedIn: boolean
  onLoginClick: () => void
  onLogoutClick: () => void
}

export default function CreditBadge({ credits, isLoggedIn, onLoginClick, onLogoutClick }: Props) {
  if (!isLoggedIn) {
    return (
      <button
        onClick={onLoginClick}
        className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0"
      >
        로그인
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
          <span className="text-sm leading-none">✨</span>
          <span className="text-xs font-bold text-orange-600">
            {credits === null ? '…' : `${credits}개`}
          </span>
        </div>
        {credits === 0 && (
          <Link
            href="/credits"
            className="text-xs font-semibold text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-300 rounded-lg px-2 py-1.5 leading-none transition-colors"
          >
            충전
          </Link>
        )}
      </div>
      <button
        onClick={onLogoutClick}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        로그아웃
      </button>
    </div>
  )
}
