'use client';

import { useState } from 'react';

interface Props {
  generatedImages: string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  variantLabels?: [string, string];
}

export default function PhotoComparison({
  generatedImages,
  selectedIndex,
  onSelect,
  variantLabels,
}: Props) {
  const [mobileTab, setMobileTab] = useState(0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        AI가 생성한 사진 2장입니다. 더 마음에 드는 사진을 선택해 주세요.
      </p>

      {/* ── 모바일: 탭 전환 (한 장씩 풀사이즈) ── */}
      <div className="sm:hidden space-y-3">
        <div className="flex gap-2">
          {generatedImages.map((_, i) => {
            const variantName = variantLabels?.[i] ?? `옵션 ${i + 1}`;
            return (
              <button
                key={i}
                onClick={() => setMobileTab(i)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors ${
                  mobileTab === i
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {i + 1}번 — {variantName}
              </button>
            );
          })}
        </div>

        {generatedImages[mobileTab] && (
          <button
            onClick={() => onSelect(mobileTab)}
            className={`w-full relative rounded-xl overflow-hidden border-2 transition-all ${
              selectedIndex === mobileTab
                ? 'border-orange-500 ring-2 ring-orange-300'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedImages[mobileTab]}
              alt={`생성된 사진 ${mobileTab + 1}`}
              className="w-full aspect-square object-cover"
            />
            {selectedIndex === mobileTab && (
              <div className="absolute inset-0 bg-orange-500/10" />
            )}
            {selectedIndex === mobileTab && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  선택됨 ✓
                </span>
              </div>
            )}
          </button>
        )}
      </div>

      {/* ── 데스크톱: 2열 나란히 ── */}
      <div className="hidden sm:grid grid-cols-2 gap-3">
        {generatedImages.map((src, i) => {
          const isSelected = selectedIndex === i;
          const variantName = variantLabels?.[i] ?? `옵션 ${i + 1}`;

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`
                relative rounded-xl overflow-hidden border-2 transition-all text-left
                ${isSelected
                  ? 'border-orange-500 ring-2 ring-orange-300'
                  : 'border-gray-200 hover:border-orange-300'}
              `}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`생성된 사진 ${i + 1}: ${variantName}`}
                className="w-full aspect-square object-cover"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-orange-500/10" />
              )}
              <div className="absolute top-2 left-2 right-2">
                <span
                  className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full max-w-full truncate ${
                    isSelected ? 'bg-orange-500 text-white' : 'bg-black/50 text-white'
                  }`}
                >
                  {i + 1}번 — {variantName}
                </span>
              </div>
              {isSelected && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    선택됨 ✓
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택 후 안내 */}
      {selectedIndex !== null && (
        <p className="text-xs text-center text-orange-600 font-medium">
          {selectedIndex + 1}번 — {variantLabels?.[selectedIndex] ?? `옵션 ${selectedIndex + 1}`} 선택됨. 아래에서 다운로드하세요.
        </p>
      )}
    </div>
  );
}
