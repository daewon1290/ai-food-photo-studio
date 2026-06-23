'use client';

import { useState } from 'react';
import { preservationOptions, PreservationMode } from '@/lib/preservationModes';

interface Props {
  selected: PreservationMode;
  onSelect: (mode: PreservationMode) => void;
}

export default function PreservationSelect({ selected, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">음식을 얼마나 바꿀까요?</p>

      {/* ── 모바일: 1열 리스트 ── */}
      <div className="sm:hidden space-y-2">
        {preservationOptions.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`w-full flex items-center gap-3 rounded-xl border-2 p-2 bg-white text-left transition-all ${
                isSelected
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              {/* 썸네일 */}
              <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <PreviewImage src={opt.previewImage} alt={opt.labelKo} />
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-orange-600' : 'text-gray-800'}`}>
                  {opt.labelKo}
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-snug">{opt.descriptionKo}</p>
              </div>

              {/* 라디오 원 */}
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
              }`}>
                {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 데스크톱: 3열 카드 그리드 (기존 유지) ── */}
      <div className="hidden sm:grid grid-cols-3 gap-2">
        {preservationOptions.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`rounded-xl border-2 overflow-hidden text-left transition-all ${
                isSelected
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <PreviewImage src={opt.previewImage} alt={opt.labelKo} />
              <div className="p-2 bg-white">
                <p className={`text-xs font-semibold leading-tight ${isSelected ? 'text-orange-600' : 'text-gray-800'}`}>
                  {opt.labelKo}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.descriptionKo}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="w-full aspect-square bg-gray-100 relative">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🖼️</span>
        </div>
      )}
    </div>
  );
}
