'use client';

interface Props {
  generatedImages: string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export default function PhotoComparison({ generatedImages, selectedIndex, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        AI가 생성한 사진 2장입니다. 더 마음에 드는 사진을 선택해 주세요.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {generatedImages.map((src, i) => {
          const isSelected = selectedIndex === i;
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
              {/* 생성된 이미지 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`생성된 사진 ${i + 1}`}
                className="w-full aspect-square object-cover"
              />

              {/* 선택 오버레이 */}
              {isSelected && (
                <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    선택됨 ✓
                  </span>
                </div>
              )}

              {/* 번호 뱃지 */}
              <div className="absolute top-2 left-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-orange-500 text-white' : 'bg-black/40 text-white'
                  }`}
                >
                  {i + 1}번
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedIndex !== null && (
        <p className="text-xs text-center text-orange-600 font-medium">
          {selectedIndex + 1}번 사진이 선택되었습니다. 아래에서 다운로드하세요.
        </p>
      )}
    </div>
  );
}
