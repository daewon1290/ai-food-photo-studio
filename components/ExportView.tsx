'use client';

import Image from 'next/image';
import { PlatformPreset, formatLabel } from '@/lib/platformPresets';

interface Props {
  platform: PlatformPreset;
  sourceImage: string;
}

export default function ExportView({ platform, sourceImage }: Props) {
  return (
    <div className="space-y-4">
      {/* 플랫폼 정보 카드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">{platform.nameKo}</h3>

        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="권장 사이즈" value={`${platform.width} × ${platform.height}px`} />
          <InfoCard label="비율" value={platform.aspectRatio} />
          <InfoCard label="권장 포맷" value={formatLabel(platform.format)} />
          <InfoCard
            label="최대 파일 크기"
            value={platform.maxFileSizeMb ? `${platform.maxFileSizeMb}MB` : '제한 없음'}
          />
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">{platform.descriptionKo}</p>
      </div>

      {/* 미리보기 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 font-medium mb-2">
          {platform.nameKo} 사이즈 미리보기 (Mock)
        </p>
        <AspectPreview sourceImage={sourceImage} ratio={platform.aspectRatio} />
      </div>

      {/* 다운로드 버튼 (Mock) */}
      <button
        disabled
        className="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-semibold text-sm border border-gray-200 cursor-not-allowed"
      >
        다운로드 ({formatLabel(platform.format)}, {platform.width}×{platform.height}) — 준비 중
      </button>

      {/* 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-600 text-center">
        현재는 Mock export입니다. 실제 서비스에서는 sharp 라이브러리를 통해
        리사이즈·포맷 변환 후 다운로드됩니다.
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function AspectPreview({ sourceImage, ratio }: { sourceImage: string; ratio: string }) {
  const [w, h] = ratio.includes(':')
    ? ratio.split(':').map(Number)
    : [1.91, 1];

  const heightPercent = ((h / w) * 100).toFixed(1);

  return (
    <div
      className="w-full relative rounded-lg overflow-hidden border border-gray-100 bg-gray-100"
      style={{ paddingBottom: `${heightPercent}%` }}
    >
      <Image src={sourceImage} alt="미리보기" fill className="object-cover" />
      <div className="absolute inset-0 flex items-end justify-end p-2">
        <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-mono">
          {ratio}
        </span>
      </div>
    </div>
  );
}
