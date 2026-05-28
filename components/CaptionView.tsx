'use client';

import { useState } from 'react';
import { PhotoTemplate } from '@/lib/photoTemplates';
import { PlatformPreset, isInstagram, isDeliveryApp } from '@/lib/platformPresets';
import { CaptionTone, CaptionResult } from '@/lib/captionPresets';

interface Props {
  category: string;
  template: PhotoTemplate;
  platform: PlatformPreset;
  tones: CaptionTone[];
  selectedTone: CaptionTone | null;
  onToneSelect: (tone: CaptionTone) => void;
  captions: CaptionResult | null;
}

export default function CaptionView({
  category,
  template,
  platform,
  tones,
  selectedTone,
  onToneSelect,
  captions,
}: Props) {
  return (
    <div className="space-y-4">
      {/* 생성 조건 요약 */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Chip>{category}</Chip>
        <Chip>{template.nameKo}</Chip>
        <Chip>{platform.nameKo}</Chip>
      </div>

      {/* 톤 선택 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">문구 톤 선택</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tones.map((tone) => (
            <button
              key={tone}
              onClick={() => onToneSelect(tone)}
              className={`
                shrink-0 px-3 py-2 rounded-full text-sm border transition-all whitespace-nowrap
                ${
                  selectedTone === tone
                    ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }
              `}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* 생성된 문구 */}
      {captions ? (
        <div className="space-y-3">
          {/* 제목 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">추천 제목</p>
            <p className="text-base font-bold text-gray-800">{captions.title}</p>
            <CopyButton text={captions.title} />
          </div>

          {/* 추천 문구 3개 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">추천 업로드 문구</p>
            {captions.captions.map((caption, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{caption}</p>
                <CopyButton text={caption} />
              </div>
            ))}
          </div>

          {/* 해시태그 (Instagram 전용) */}
          {isInstagram(platform) && captions.hashtags && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-600 mb-2">
                추천 해시태그 (Instagram)
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {captions.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white text-purple-600 border border-purple-200 text-xs px-2 py-1 rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <CopyButton text={captions.hashtags.join(' ')} label="해시태그 전체 복사" />
            </div>
          )}

          {/* 메뉴 설명 (배달앱 전용) */}
          {isDeliveryApp(platform) && captions.menuDescription && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 mb-2">
                메뉴 설명 ({platform.nameKo})
              </p>
              <p className="text-sm text-green-800 leading-relaxed">
                {captions.menuDescription}
              </p>
              <CopyButton text={captions.menuDescription} />
            </div>
          )}

          {/* 안내 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-center">
            지금은 Mock 문구입니다. 실제 서비스에서는 Claude AI가 맞춤 문구를 생성합니다.
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
          위에서 문구 톤을 선택하면 추천 문구가 생성됩니다.
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-medium">
      {children}
    </span>
  );
}

function CopyButton({ text, label = '복사' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        mt-2 text-xs px-3 py-1 rounded-full border transition-all
        ${copied ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}
      `}
    >
      {copied ? '복사됨 ✓' : label}
    </button>
  );
}
