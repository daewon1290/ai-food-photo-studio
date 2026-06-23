'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { POSTER_RATIO_OPTIONS, PosterRatioOption, PosterContent } from '@/lib/posterLayouts';

interface Props {
  initialImage?: string;
  onBack: () => void;
}

export default function PosterMode({ initialImage, onBack }: Props) {
  const [posterImage, setPosterImage] = useState<string | null>(initialImage ?? null);
  const [selectedRatio, setSelectedRatio] = useState<PosterRatioOption>(POSTER_RATIO_OPTIONS[0]);
  const [menuName, setMenuName] = useState('');
  const [tagline, setTagline] = useState('');
  const [price, setPrice] = useState('');
  const [features, setFeatures] = useState<[string, string, string]>(['', '', '']);

  const content: PosterContent = { menuName, tagline, price, features };

  const handleFeatureChange = (i: 0 | 1 | 2, value: string) => {
    const next: [string, string, string] = [...features] as [string, string, string];
    next[i] = value;
    setFeatures(next);
  };

  const stepOffset = initialImage ? 0 : 1;

  return (
    <div className="space-y-5">
      {/* ── 헤더 ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← 처음으로
        </button>
        <span className="text-gray-300">|</span>
        <h2 className="font-bold text-gray-800">홍보 포스터 만들기</h2>
      </div>

      {/* ── 미리보기 (sticky) ── */}
      <div className="sticky top-14 z-[5] bg-[#FFF9F5] pb-2">
        <PosterPreview image={posterImage} content={content} ratio={selectedRatio} />
      </div>

      {/* ── 1. 사진 업로드 (직접 진입 시만) ── */}
      {!initialImage && (
        <section>
          <PosterSectionLabel step="1" title="포스터로 만들 사진 업로드" />
          <ImageUpload
            onUpload={(dataUrl) => setPosterImage(dataUrl)}
            currentImage={posterImage}
          />
        </section>
      )}

      {/* initialImage로 진입한 경우 사진 변경 안내 */}
      {initialImage && (
        <section>
          <PosterSectionLabel step="1" title="사진" />
          <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">AI 생성 사진이 적용됐어요.</span>
            <button
              onClick={() => setPosterImage(null)}
              className="text-xs text-orange-500 font-medium hover:underline"
            >
              다른 사진으로 바꾸기
            </button>
          </div>
          {!posterImage && (
            <div className="mt-2">
              <ImageUpload
                onUpload={(dataUrl) => setPosterImage(dataUrl)}
                currentImage={posterImage}
              />
            </div>
          )}
        </section>
      )}

      {/* ── 2. 크기 선택 ── */}
      <section>
        <PosterSectionLabel step={String(1 + stepOffset)} title="포스터 크기 선택" />
        <div className="space-y-2">
          {POSTER_RATIO_OPTIONS.map((opt) => {
            const isSelected = selectedRatio.id === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedRatio(opt)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
              >
                <span className="text-xl shrink-0">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-orange-700' : 'text-gray-800'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 leading-snug">{opt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                }`}>
                  {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. 내용 입력 ── */}
      <section className="space-y-4">
        <PosterSectionLabel step={String(2 + stepOffset)} title="포스터 내용 입력" />

        <PosterInputField
          label="메뉴명"
          required
          placeholder="바삭 후라이드 치킨"
          value={menuName}
          onChange={setMenuName}
        />
        <PosterInputField
          label="한 줄 홍보 문구"
          placeholder="대구 제일 바삭한 치킨"
          value={tagline}
          onChange={setTagline}
        />
        <PosterInputField
          label="가격 또는 이벤트 문구"
          placeholder="1마리 ₩15,000 · 오늘만 20% 할인"
          value={price}
          onChange={setPrice}
        />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-700">재료·특징</p>
            <span className="text-xs text-gray-400">최대 3개 (선택)</span>
          </div>
          <div className="space-y-2">
            {([0, 1, 2] as const).map((i) => (
              <input
                key={i}
                type="text"
                placeholder={['국내산 닭', '비밀 양념', '24시간 숙성'][i]}
                value={features[i]}
                onChange={(e) => handleFeatureChange(i, e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-colors"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 저장 버튼 ── */}
      <div className="space-y-2 pb-8">
        <button
          disabled={!menuName || !posterImage}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-2xl font-bold text-base transition-colors shadow-sm"
        >
          ↓ 포스터 저장하기
        </button>
        {(!menuName || !posterImage) && (
          <p className="text-xs text-center text-gray-400">
            {!posterImage ? '사진을 먼저 업로드해 주세요' : '메뉴명을 입력해 주세요'}
          </p>
        )}
        <p className="text-xs text-center text-gray-300">PNG 다운로드는 다음 업데이트에서 추가됩니다</p>
      </div>
    </div>
  );
}

/* ── 미리보기 ─────────────────────────────────────────────────────── */

function PosterPreview({
  image,
  content,
  ratio,
}: {
  image: string | null;
  content: PosterContent;
  ratio: PosterRatioOption;
}) {
  const hasText = content.menuName || content.tagline || content.price || content.features.some(Boolean);
  const activeFeatures = content.features.filter(Boolean);

  return (
    <div className="flex justify-center">
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 w-full"
        style={{ aspectRatio: ratio.cssAspectRatio, maxHeight: '340px', maxWidth: `calc(340px * (${ratio.cssAspectRatio}))` }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="포스터 이미지" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">🖼️</span>
            <p className="text-xs text-gray-400 text-center px-4">사진을 업로드하면<br />미리보기가 나타나요</p>
          </div>
        )}

        {image && hasText && (
          <>
            {/* 하단 그라디언트 오버레이 */}
            <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

            {/* 텍스트 레이어 (아래→위) */}
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 space-y-1">
              {activeFeatures.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {activeFeatures.map((f, i) => (
                    <span key={i} className="text-white/70 text-[11px] leading-snug">· {f}</span>
                  ))}
                </div>
              )}
              {content.price && (
                <p className="text-yellow-300 text-sm font-bold leading-snug">{content.price}</p>
              )}
              {content.tagline && (
                <p className="text-white/90 text-sm leading-snug">{content.tagline}</p>
              )}
              {content.menuName && (
                <p className="text-white text-xl font-bold leading-tight">{content.menuName}</p>
              )}
            </div>
          </>
        )}

        {/* 비율 배지 */}
        <div className="absolute top-2 right-2">
          <span className="bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {ratio.id}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 공통 UI 헬퍼 ─────────────────────────────────────────────────── */

function PosterSectionLabel({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="bg-orange-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
        {step}
      </span>
      <h3 className="font-bold text-gray-800">{title}</h3>
    </div>
  );
}

function PosterInputField({
  label,
  required,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-colors"
      />
    </div>
  );
}
