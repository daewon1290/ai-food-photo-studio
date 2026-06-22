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
      <p className="text-sm font-semibold text-gray-700">메뉴 유지 강도</p>
      <div className="grid grid-cols-3 gap-2">
        {preservationOptions.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`
                rounded-xl border-2 overflow-hidden text-left transition-all
                ${isSelected
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-orange-300'}
              `}
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
