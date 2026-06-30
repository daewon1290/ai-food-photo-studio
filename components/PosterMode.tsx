'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import { POSTER_RATIO_OPTIONS, PosterRatioOption } from '@/lib/posterLayouts';

interface Props {
  initialImage?: string;
  onBack: () => void;
  onCreditUsed?: () => void;
}

/* ── 스타일 옵션 ──────────────────────────────────────────────────── */

const POSTER_STYLES = [
  { id: '인스타 감성 메뉴 포스터', emoji: '📸', desc: 'SNS 감성, 깔끔하고 현대적인 레이아웃' },
  { id: '빈티지 메뉴판 포스터', emoji: '🪵', desc: '따뜻하고 레트로한 식당 분위기' },
  { id: '프리미엄 광고 포스터', emoji: '✨', desc: '고급스럽고 세련된 브랜드 광고' },
  { id: '동네맛집 전단 포스터', emoji: '🏪', desc: '친근하고 활기찬 로컬 맛집 스타일' },
  { id: '배달앱 썸네일 포스터', emoji: '🛵', desc: '배달앱에서 확 눈에 띄는 썸네일' },
];

const STYLE_DETAILS: Record<string, {
  mood: string; bestFor: string; composition: string; example: string;
}> = {
  '인스타 감성 메뉴 포스터': {
    mood: 'SNS 감성, 깔끔하고 현대적인 레이아웃',
    bestFor: '브런치, 카페 음료, 디저트, 수제버거, 샐러드',
    composition: '큰 음식 이미지, 짧은 감성 카피, 깔끔한 라벨, 밝은 배경',
    example: '"매일 먹어도 질리지 않는 한 그릇의 여유"',
  },
  '빈티지 메뉴판 포스터': {
    mood: '따뜻하고 레트로한 식당 메뉴판 분위기',
    bestFor: '수제버거, 돈가스, 파스타, 경양식, 분식',
    composition: '종이 질감 배경, 큼직한 메뉴명, 손글씨 느낌 라벨, 클래식한 색감',
    example: '"전통의 맛, 어머니의 손맛 그대로"',
  },
  '프리미엄 광고 포스터': {
    mood: '고급스럽고 세련된 브랜드 광고',
    bestFor: '스테이크, 한우, 와인, 오마카세, 프리미엄 메뉴',
    composition: '어두운 배경, 강한 조명, 금색/흰색 텍스트, 여백 있는 고급 구성',
    example: '"최상의 품질, 최고의 순간"',
  },
  '동네맛집 전단 포스터': {
    mood: '친근하고 활기찬 로컬 맛집 스타일',
    bestFor: '백반, 김치찌개, 제육볶음, 치킨정식, 국밥',
    composition: '메뉴명과 가격 강조, 푸짐한 음식, 사장님 추천/오늘의 메뉴 배지',
    example: '"오늘 저녁은 여기로 결정! 단 돈 ₩9,900"',
  },
  '배달앱 썸네일 포스터': {
    mood: '배달앱에서 한눈에 보이는 강한 썸네일',
    bestFor: '치킨, 피자, 떡볶이, 족발, 야식, 버거',
    composition: '음식 크게, 가격/할인 문구 강조, HOT/신메뉴/오늘할인 배지, 대비 강한 색감',
    example: '"지금 주문하면 HOT 20% 할인!"',
  },
};

/* ── 입력 팁 ──────────────────────────────────────────────────────── */

const INPUT_TIPS = [
  '메뉴명은 짧고 크게 보일 문구로 입력하세요.',
  '부제는 메뉴의 매력을 한 줄로 설명하세요.',
  '가격/이벤트 문구는 정확하게 입력하세요.',
  '강조 배지는 HOT, 신메뉴, 오늘의 메뉴처럼 짧게 입력하세요.',
  '재료·특징 라벨은 4~6개 정도가 가장 보기 좋습니다.',
];

/* ── 기타 상수 ────────────────────────────────────────────────────── */

const FEATURE_PLACEHOLDERS = ['브리오슈 번', '소고기 패티', '체다치즈', '양상추', '토마토', '특제소스'];

const RATIO_DESCRIPTIONS: Record<string, string> = {
  '1:1': '정사각형 1:1 포스터입니다. 인스타 피드, 블로그, 스마트플레이스에 두루 쓰기 좋습니다.',
  '4:5': '세로형 4:5 포스터입니다. 인스타 피드에서 크게 보이고, 모바일 화면에 잘 어울립니다.',
  '9:16': '스토리형 9:16 포스터입니다. 인스타 스토리, 릴스 소개, 모바일 공지에 적합합니다.',
};

const LOADING_STEPS = [
  '원본 음식 사진을 분석하고 있어요.',
  '선택한 포스터 비율에 맞춰 구도를 다시 잡고 있어요.',
  '메뉴명, 가격, 라벨을 광고 포스터처럼 배치하고 있어요.',
  '색감과 조명, 배경 질감을 다듬고 있어요.',
  '거의 완성됐어요. 잠시만 기다려 주세요.',
];

/* ── 메인 컴포넌트 ──────────────────────────────────────────────────── */

export default function PosterMode({ initialImage, onBack, onCreditUsed }: Props) {
  const [posterImage, setPosterImage] = useState<string | null>(initialImage ?? null);
  const [selectedRatio, setSelectedRatio] = useState<PosterRatioOption>(POSTER_RATIO_OPTIONS[0]);
  const [menuName, setMenuName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState('');
  const [badge, setBadge] = useState('');
  const [features, setFeatures] = useState<string[]>(Array(6).fill(''));
  const [posterStyle, setPosterStyle] = useState<string>(POSTER_STYLES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationInfo, setGenerationInfo] = useState<{ mode: string; model: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isGenerating) return;
    setLoadingStep(0);
    const id = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 4000);
    return () => clearInterval(id);
  }, [isGenerating]);

  const handleFeatureChange = (i: number, value: string) => {
    const next = [...features];
    next[i] = value;
    setFeatures(next);
  };

  const handleGenerate = async () => {
    if (!posterImage || !menuName.trim()) return;
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    setGenerationInfo(null);
    setErrorMessage(null);
    try {
      const res = await fetch(posterImage);
      const blob = await res.blob();
      const imageFile = new File([blob], 'poster-source.png', { type: blob.type || 'image/png' });
      const fd = new FormData();
      fd.append('image', imageFile);
      fd.append('ratio', selectedRatio.id);
      fd.append('menuName', menuName.trim());
      fd.append('subtitle', subtitle.trim());
      fd.append('price', price.trim());
      fd.append('badge', badge.trim());
      fd.append('posterStyle', posterStyle);
      fd.append('features', JSON.stringify(features.filter(Boolean)));
      const response = await fetch('/api/generate-poster', { method: 'POST', body: fd });
      const data = await response.json();
      if (!response.ok || data.error) {
        if (response.status === 401) {
          setErrorMessage('로그인이 필요합니다. 페이지를 새로고침 후 다시 시도해 주세요.');
        } else if (response.status === 402) {
          setErrorMessage('크레딧이 부족합니다. 충전 후 다시 시도해 주세요.');
        } else {
          setErrorMessage(data.error ?? '생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } else {
        setGeneratedImageUrl(data.imageUrl);
        onCreditUsed?.();
        if (data.mode && data.model) {
          setGenerationInfo({ mode: data.mode, model: data.model });
          console.log(`[generate-poster] result mode=${data.mode} model=${data.model}`);
        }
      }
    } catch {
      setErrorMessage('생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const stepOffset = initialImage ? 0 : 1;
  const activeFeatures = features.filter(Boolean);
  const canGenerate = !!posterImage && !!menuName.trim() && !isGenerating;

  const ratioPreviewMaxH = 240;
  const [rw, rh] = selectedRatio.cssAspectRatio.split('/').map(Number);
  const ratioPreviewMaxW = Math.round(ratioPreviewMaxH * rw / rh);

  return (
    <div className="space-y-5">

      {/* ── 헤더 ── */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← 처음으로
        </button>
        <span className="text-gray-300">|</span>
        <h2 className="font-bold text-gray-800">홍보 포스터 만들기</h2>
      </div>

      {/* ── 생성 정보 확인 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">생성 정보 확인</h3>
        <div className="space-y-2">
          <InfoRow label="사진" value={posterImage ? '✓ 업로드 완료' : '아직 사진 없음'} highlight={!!posterImage} />
          <InfoRow label="포스터 크기" value={selectedRatio.label} />
          <InfoRow label="스타일" value={posterStyle} />
          <InfoRow label="메뉴명" value={menuName || '미입력'} muted={!menuName} required />
          {subtitle && <InfoRow label="부제" value={subtitle} />}
          {price && <InfoRow label="가격 / 이벤트" value={price} />}
          {badge && <InfoRow label="강조 배지" value={badge} />}
          {activeFeatures.length > 0 && <InfoRow label="재료·특징" value={activeFeatures.join(' · ')} />}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            아래 버튼을 누르면 입력한 정보를 바탕으로 AI가 광고 포스터 이미지를 생성합니다.
          </p>
        </div>
      </div>

      {/* ── 사진 업로드 ── */}
      {!initialImage && (
        <section>
          <PosterSectionLabel step="1" title="포스터로 만들 사진 업로드" />
          <ImageUpload
            onUpload={(dataUrl) => { setPosterImage(dataUrl); setGeneratedImageUrl(null); setErrorMessage(null); }}
            currentImage={posterImage}
          />
        </section>
      )}
      {initialImage && (
        <section>
          <PosterSectionLabel step="1" title="사진" />
          <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">AI 생성 사진이 적용됐어요.</span>
            <button onClick={() => { setPosterImage(null); setGeneratedImageUrl(null); setErrorMessage(null); }} className="text-xs text-orange-500 font-medium hover:underline">
              다른 사진으로 바꾸기
            </button>
          </div>
          {!posterImage && (
            <div className="mt-2">
              <ImageUpload
                onUpload={(dataUrl) => { setPosterImage(dataUrl); setGeneratedImageUrl(null); setErrorMessage(null); }}
                currentImage={posterImage}
              />
            </div>
          )}
        </section>
      )}

      {/* ── 비율 선택 ── */}
      <section>
        <PosterSectionLabel step={String(1 + stepOffset)} title="포스터 크기 선택" />
        <div className="space-y-2">
          {POSTER_RATIO_OPTIONS.map((opt) => {
            const isSelected = selectedRatio.id === opt.id;
            return (
              <button key={opt.id} onClick={() => setSelectedRatio(opt)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
                <span className="text-xl shrink-0">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-orange-700' : 'text-gray-800'}`}>{opt.label}</p>
                  <p className="text-xs text-gray-500 leading-snug">{opt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                  {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* 비율 설명 + 미리보기 (object-contain: 잘리지 않음) */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-700 leading-snug">{RATIO_DESCRIPTIONS[selectedRatio.id]}</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            아래 미리보기는 원본 사진을 선택한 비율 안에서 참고용으로 보여주는 화면입니다.
            실제 생성 시 AI가 음식과 문구를 포스터 비율에 맞게 다시 구성합니다.
          </p>
          <div
            className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mx-auto"
            style={{ aspectRatio: selectedRatio.cssAspectRatio, maxHeight: `${ratioPreviewMaxH}px`, maxWidth: `${ratioPreviewMaxW}px`, width: '100%' }}
          >
            {posterImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterImage} alt="비율 미리보기" className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3">
                <span className="text-2xl">📐</span>
                <p className="text-[11px] text-gray-400 text-center leading-snug">사진을 업로드하면<br />비율이 여기에 표시돼요</p>
              </div>
            )}
            <div className="absolute top-1.5 left-1.5">
              <span className="bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selectedRatio.id}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 포스터 스타일 선택 ── */}
      <section>
        <PosterSectionLabel step={String(2 + stepOffset)} title="포스터 스타일 선택" />
        <div className="space-y-2">
          {POSTER_STYLES.map((style) => {
            const isSelected = posterStyle === style.id;
            return (
              <button key={style.id} onClick={() => setPosterStyle(style.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
                {/* 스타일 무드 썸네일 */}
                <StyleMoodCard styleId={style.id} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-snug ${isSelected ? 'text-orange-700' : 'text-gray-800'}`}>{style.id}</p>
                  <p className="text-xs text-gray-500 leading-snug mt-0.5">{style.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                  {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* 선택한 스타일 설명 카드 */}
        {STYLE_DETAILS[posterStyle] && (
          <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-xs font-bold text-orange-700 mb-2.5">{posterStyle}</p>
            <div className="space-y-2">
              <StyleDetailRow label="분위기" value={STYLE_DETAILS[posterStyle].mood} />
              <StyleDetailRow label="추천 메뉴" value={STYLE_DETAILS[posterStyle].bestFor} />
              <StyleDetailRow label="포스터 특징" value={STYLE_DETAILS[posterStyle].composition} />
              <StyleDetailRow label="예시 문구" value={STYLE_DETAILS[posterStyle].example} />
            </div>
          </div>
        )}
      </section>

      {/* ── 포스터 내용 입력 ── */}
      <section className="space-y-4">
        <PosterSectionLabel step={String(3 + stepOffset)} title="포스터 내용 입력" />

        {/* 입력 팁 */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-gray-600 mb-2">입력 팁</p>
          <ul className="space-y-1.5">
            {INPUT_TIPS.map((tip, i) => (
              <li key={i} className="flex gap-1.5 items-start">
                <span className="text-orange-400 text-xs shrink-0 mt-px">·</span>
                <span className="text-[11px] text-gray-500 leading-snug">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <PosterInputField label="메뉴명" required placeholder="바삭 후라이드 치킨" value={menuName}
          onChange={(v) => { setMenuName(v); setGeneratedImageUrl(null); setErrorMessage(null); }} />
        <PosterInputField label="짧은 부제" placeholder="대구 제일 바삭한 치킨" value={subtitle} onChange={setSubtitle} />
        <PosterInputField label="가격 또는 이벤트 문구" placeholder="1마리 ₩15,000 · 오늘만 20% 할인" value={price} onChange={setPrice} />
        <PosterInputField label="강조 배지 문구" placeholder="신메뉴 · HOT · 오늘의 메뉴" value={badge} onChange={setBadge} />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-700">재료·특징 라벨</p>
            <span className="text-xs text-gray-400">최대 6개 · 음식 주변 callout 배지로 배치됩니다</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input key={i} type="text" placeholder={FEATURE_PLACEHOLDERS[i]} value={features[i]}
                onChange={(e) => handleFeatureChange(i, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-colors" />
            ))}
          </div>
        </div>
      </section>

      {/* ── 생성 버튼 + 결과 ── */}
      <div className="space-y-3 pb-8">
        <button disabled={!canGenerate} onClick={handleGenerate}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-2xl font-bold text-base transition-colors shadow-sm">
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              AI 포스터 생성 중...
            </span>
          ) : '✨ AI 포스터 생성하기'}
        </button>

        {!canGenerate && !isGenerating && (
          <p className="text-xs text-center text-gray-400">
            {!posterImage ? '사진을 먼저 업로드해 주세요' : '메뉴명을 입력해 주세요'}
          </p>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-2">
            <p className="text-sm text-red-600 text-center">{errorMessage}</p>
            {errorMessage.includes('크레딧') && (
              <p className="text-center">
                <Link
                  href="/credits"
                  className="inline-block text-xs font-semibold text-orange-500 hover:text-orange-600 border border-orange-300 bg-orange-50 hover:bg-orange-100 rounded-lg px-3 py-1.5 transition-colors"
                >
                  충전하기 →
                </Link>
              </p>
            )}
          </div>
        )}

        {/* 로딩 카드 */}
        {isGenerating && (
          <div className="rounded-2xl overflow-hidden border border-orange-200 bg-white shadow-sm">
            {posterImage && (
              <div className="relative bg-gray-900 overflow-hidden" style={{ aspectRatio: selectedRatio.cssAspectRatio, maxHeight: '200px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterImage} alt="" className="absolute inset-0 w-full h-full object-contain opacity-50" />
                <div className="absolute inset-0 bg-orange-500/10 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                    <span className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin block" />
                    <span className="text-white text-xs font-bold">AI 포스터 생성 중</span>
                  </div>
                </div>
              </div>
            )}
            <div className="px-4 py-3 space-y-2.5">
              <p className="text-sm text-gray-700 leading-relaxed min-h-[42px]">{LOADING_STEPS[loadingStep]}</p>
              <div className="flex gap-1">
                {LOADING_STEPS.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-700 ${i <= loadingStep ? 'bg-orange-400' : 'bg-gray-100'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 생성 결과 */}
        {generatedImageUrl && (
          <div className="space-y-2 mt-2">
            <p className="text-xs font-medium text-gray-500 text-center">AI 포스터 생성 완료</p>
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generatedImageUrl} alt="생성된 AI 포스터" className="w-full h-auto block" />
            </div>
            <p className="text-[11px] text-gray-400 text-center">이미지 저장 기능은 다음 업데이트에서 추가됩니다.</p>
            {generationInfo && (
              <p className="text-[10px] text-gray-300 text-center font-mono">{generationInfo.mode} / {generationInfo.model}</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

/* ── 스타일 무드 썸네일 (CSS only, 무드 가이드 전용) ─────────────── */

function StyleMoodCard({ styleId }: { styleId: string }) {
  type MoodConfig = {
    border: string; bg: string; isDashed?: boolean;
    topBg: string; topBar: string;
    foodBg: string; circleBg: string; circleStroke: string;
    botBg: string; botBar: string;
  };

  const configs: Record<string, MoodConfig> = {
    '인스타 감성 메뉴 포스터': {
      border: '#E5E7EB', bg: '#FFFFFF',
      topBg: '#FFFFFF', topBar: '#9CA3AF',
      foodBg: '#F3F4F6', circleBg: '#D1D5DB', circleStroke: '#9CA3AF',
      botBg: '#F9FAFB', botBar: '#D1D5DB',
    },
    '빈티지 메뉴판 포스터': {
      border: '#D97706', bg: '#FDE68A', isDashed: true,
      topBg: '#F59E0B', topBar: '#78350F',
      foodBg: '#FEF3C7', circleBg: '#FDE68A', circleStroke: '#D97706',
      botBg: '#F59E0B', botBar: '#78350F',
    },
    '프리미엄 광고 포스터': {
      border: '#4B5563', bg: '#111827',
      topBg: '#1F2937', topBar: '#FDE68A',
      foodBg: '#1F2937', circleBg: '#374151', circleStroke: '#FDE68A',
      botBg: '#1F2937', botBar: '#FDE68A',
    },
    '동네맛집 전단 포스터': {
      border: '#F59E0B', bg: '#FBBF24',
      topBg: '#F59E0B', topBar: '#1C1917',
      foodBg: '#FEF9C3', circleBg: '#FDE68A', circleStroke: '#D97706',
      botBg: '#EF4444', botBar: '#FFFFFF',
    },
    '배달앱 썸네일 포스터': {
      border: '#B91C1C', bg: '#DC2626',
      topBg: '#991B1B', topBar: '#FFFFFF',
      foodBg: '#DC2626', circleBg: '#B91C1C', circleStroke: '#FCD34D',
      botBg: '#991B1B', botBar: '#FCD34D',
    },
  };

  const c = configs[styleId] ?? configs['인스타 감성 메뉴 포스터'];

  return (
    <div style={{
      width: '52px', height: '42px', borderRadius: '7px', overflow: 'hidden',
      background: c.bg, flexShrink: 0, display: 'flex', flexDirection: 'column',
      border: c.isDashed ? `2px dashed ${c.border}` : `1.5px solid ${c.border}`,
    }}>
      {/* 상단: 제목 영역 */}
      <div style={{
        background: c.topBg, height: '38%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ width: '62%', height: '3px', background: c.topBar, borderRadius: '2px' }} />
      </div>
      {/* 중앙: 음식 영역 */}
      <div style={{
        background: c.foodBg, flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%',
          background: c.circleBg, border: `1.5px solid ${c.circleStroke}`,
        }} />
      </div>
      {/* 하단: 가격 영역 */}
      <div style={{
        background: c.botBg, height: '26%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderTop: `1px solid ${c.border}`,
      }}>
        <div style={{ width: '48%', height: '3px', background: c.botBar, borderRadius: '2px' }} />
      </div>
    </div>
  );
}

/* ── 공통 UI 헬퍼 ─────────────────────────────────────────────────── */

function StyleDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-[11px] text-orange-500 font-bold shrink-0 w-[68px]">{label}</span>
      <span className="text-[11px] text-gray-600 leading-snug">{value}</span>
    </div>
  );
}

function InfoRow({ label, value, highlight, muted, required }: {
  label: string; value: string; highlight?: boolean; muted?: boolean; required?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-gray-400 shrink-0">
        {label}{required && <span className="text-orange-400 ml-0.5">*</span>}
      </span>
      <span className={`text-xs font-medium text-right max-w-[65%] leading-snug ${highlight ? 'text-green-600' : muted ? 'text-gray-300' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}

function PosterSectionLabel({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="bg-orange-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">{step}</span>
      <h3 className="font-bold text-gray-800">{title}</h3>
    </div>
  );
}

function PosterInputField({ label, required, placeholder, value, onChange }: {
  label: string; required?: boolean; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-colors" />
    </div>
  );
}
