'use client';

import { useState } from 'react';
import Image from 'next/image';
import { photoTemplates, PhotoTemplate } from '@/lib/photoTemplates';

interface Props {
  selected: PhotoTemplate | null;
  onSelect: (template: PhotoTemplate) => void;
}

export default function TemplateSelect({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {photoTemplates.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => onSelect(tpl)}
          className={`
            rounded-xl border overflow-hidden text-left transition-all
            ${
              selected?.id === tpl.id
                ? 'border-orange-500 ring-2 ring-orange-300'
                : 'border-gray-200 hover:border-orange-300'
            }
          `}
        >
          <TemplatePreview src={tpl.previewImage ?? ''} alt={tpl.nameKo} />
          <div className="p-3 bg-white">
            <p className="font-semibold text-sm text-gray-800 leading-snug">{tpl.nameKo}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{tpl.shortDescriptionKo}</p>
            <p className="text-xs text-orange-500 mt-1 font-medium truncate">
              {tpl.bestFor}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function TemplatePreview({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(!src);

  return (
    <div className="relative w-full aspect-video bg-gray-100">
      {!failed && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setFailed(true)}
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-2">
            <div className="text-3xl mb-1">🖼️</div>
            <p className="text-xs text-gray-400">미리보기 준비 중</p>
          </div>
        </div>
      )}
    </div>
  );
}
