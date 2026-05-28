'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PhotoTemplate } from '@/lib/photoTemplates';

interface Props {
  originalImage: string;
  category: string;
  template: PhotoTemplate;
}

const STYLE_ROWS: { label: string; key: keyof PhotoTemplate }[] = [
  { label: '배경', key: 'backgroundStyleKo' },
  { label: '조명', key: 'lightingStyleKo' },
  { label: '접시/용기', key: 'plateStyleKo' },
  { label: '소품', key: 'propsKo' },
  { label: '카메라 앵글', key: 'cameraAngleKo' },
  { label: '색감', key: 'colorMoodKo' },
];

export default function PhotoResult({ originalImage, category, template }: Props) {
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* 원본 vs 결과 비교 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1 font-medium text-center">원본 사진</p>
          <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
            <Image src={originalImage} alt="원본" fill className="object-cover" />
          </div>
        </div>
        <div>
          <p className="text-xs text-orange-500 mb-1 font-medium text-center">AI 변환 결과 (Mock)</p>
          <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-orange-200">
            <Image
              src={originalImage}
              alt="변환 결과"
              fill
              className="object-cover opacity-90"
              style={{ filter: 'saturate(1.3) contrast(1.1) brightness(1.05)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="text-white text-xs font-bold bg-orange-500/80 px-2 py-0.5 rounded-full">
                Mock 미리보기
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 적용 정보 카드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {/* 카테고리 & 템플릿 태그 */}
        <div className="flex flex-wrap gap-2">
          <Tag label="카테고리" value={category} />
          <Tag label="템플릿" value={template.nameKo} />
        </div>

        <hr className="border-gray-100" />

        {/* 적용된 연출 요약 */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          적용된 연출 요약
        </p>
        <div className="space-y-2">
          {STYLE_ROWS.map(({ label, key }) => (
            <StyleRow key={key} label={label} value={String(template[key])} />
          ))}
        </div>

        <hr className="border-gray-100" />

        {/* 개발자용 프롬프트 accordion */}
        <button
          onClick={() => setPromptOpen((v) => !v)}
          className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
        >
          <span className="font-medium">개발자용 프롬프트 보기</span>
          <span
            className="text-base leading-none transition-transform duration-200"
            style={{ transform: promptOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ›
          </span>
        </button>

        {promptOpen && (
          <div className="space-y-3 pt-1">
            <PromptBlock label="이미지 생성 프롬프트 (한글)" content={template.promptKo} />
            <PromptBlock label="Image Prompt (EN)" content={template.promptEn} />
            <PromptBlock
              label="네거티브 프롬프트 (한글)"
              content={template.negativePromptKo}
              color="red"
            />
            <PromptBlock
              label="Negative Prompt (EN)"
              content={template.negativePromptEn}
              color="red"
            />
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-center">
        실제 AI image API 연결 시 위 프롬프트를 사용하여 사진을 생성합니다.
      </div>
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
      <span className="text-gray-400">{label}: </span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

function StyleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 shrink-0 w-20 text-xs pt-0.5">{label}</span>
      <span className="text-gray-700 text-xs leading-relaxed">{value}</span>
    </div>
  );
}

function PromptBlock({
  label,
  content,
  color = 'gray',
}: {
  label: string;
  content: string;
  color?: 'gray' | 'red';
}) {
  return (
    <div>
      <p
        className={`text-xs font-semibold mb-1 ${
          color === 'red' ? 'text-red-500' : 'text-gray-500'
        }`}
      >
        {label}
      </p>
      <p
        className={`text-xs leading-relaxed p-2 rounded-lg ${
          color === 'red' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
        }`}
      >
        {content}
      </p>
    </div>
  );
}
