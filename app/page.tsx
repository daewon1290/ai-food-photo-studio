'use client';

import { useRef, useState } from 'react';
import { PhotoTemplate } from '@/lib/photoTemplates';
import { buildGenerationPrompt, buildPreservePrompt, buildCompositePrompt } from '@/lib/buildPrompt';
import { PreservationMode, DEFAULT_PRESERVATION } from '@/lib/preservationModes';
import ImageUpload from '@/components/ImageUpload';
import CategorySelect from '@/components/CategorySelect';
import TemplateSelect from '@/components/TemplateSelect';
import PreservationSelect from '@/components/PreservationSelect';
import PhotoComparison from '@/components/PhotoComparison';
import PhotoResult from '@/components/PhotoResult';

// ── 2차 기능 (현재 비활성 — 준비 완료 상태로 보관) ──────────────────
// import { PlatformPreset } from '@/lib/platformPresets';
// import { CaptionTone, CaptionResult, captionTones, generateCaptions } from '@/lib/captionPresets';
// import PlatformSelect from '@/components/PlatformSelect';
// import ExportView from '@/components/ExportView';
// import CaptionView from '@/components/CaptionView';

export default function Home() {
  // ── 1차 MVP 상태 ──────────────────────────────────────────────────
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PhotoTemplate | null>(null);
  const [selectedPreservation, setSelectedPreservation] = useState<PreservationMode>(DEFAULT_PRESERVATION);

  // 생성 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  // 개발 전용: 생성 방식 선택 (기본 = 기본 생성)
  type GenerateMode = 'normal' | 'mask' | 'composite';
  const [generateMode, setGenerateMode] = useState<GenerateMode>('normal');
  // 개발 전용: 모델 강제 오버라이드 (auto = 템플릿 기본값 사용)
  type ModelOverride = 'auto' | 'gpt' | 'flux';
  const [modelOverride, setModelOverride] = useState<ModelOverride>('auto');

  // 개발 전용: Photoroom 배경 제거 테스트 상태
  const [bgRemovedImage, setBgRemovedImage] = useState<string | null>(null);
  const [isBgRemoving, setIsBgRemoving] = useState(false);
  const [bgRemoveError, setBgRemoveError] = useState<string | null>(null);

  // 개발 전용: Photoroom 합성 테스트 상태
  type BgPreset = 'bright-cream' | 'warm-table' | 'dark-wood';
  const BG_PRESET_LABELS: Record<BgPreset, string> = {
    'bright-cream': '밝은 크림 (배달앱)',
    'warm-table':   '따뜻한 나무 테이블',
    'dark-wood':    '다크 우드 (프리미엄)',
  };
  const [composeBgPreset, setComposeBgPreset] = useState<BgPreset>('dark-wood');
  const [composeRemovedBg, setComposeRemovedBg] = useState<string | null>(null);
  const [composeResult, setComposeResult] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  // 개발 전용: AI 배경 + Photoroom 합성 테스트 상태
  type AiBgStyle = 'delivery-app' | 'dark-premium' | 'brand-color';
  const AI_BG_STYLE_LABELS: Record<AiBgStyle, string> = {
    'delivery-app': '배달앱 대표사진형 (크림 스튜디오)',
    'dark-premium': '다크 프리미엄 (레스토랑 월넛)',
    'brand-color':  '브랜드 컬러 포스터형',
  };
  const [aiBgStyle, setAiBgStyle] = useState<AiBgStyle>('delivery-app');
  const [aiBgRemovedBg, setAiBgRemovedBg] = useState<string | null>(null);
  const [aiBgBackground, setAiBgBackground] = useState<string | null>(null);
  const [aiBgResult, setAiBgResult] = useState<string | null>(null);
  const [isAiBgComposing, setIsAiBgComposing] = useState(false);
  const [aiBgError, setAiBgError] = useState<string | null>(null);

  // ── 2차 상태 (보관, 현재 미사용) ──────────────────────────────────
  // const [usePhotoClicked, setUsePhotoClicked] = useState(false);
  // const [selectedPlatform, setSelectedPlatform] = useState<PlatformPreset | null>(null);
  // const [selectedTone, setSelectedTone] = useState<CaptionTone | null>(null);
  // const [captions, setCaptions] = useState<CaptionResult | null>(null);

  // ── 섹션 스크롤 ref ───────────────────────────────────────────────
  const templateRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const downloadRef = useRef<HTMLElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  };

  // ── 생성 관련 상태 일괄 초기화 ───────────────────────────────────
  const resetGeneration = () => {
    setIsGenerating(false);
    setGeneratedImages([]);
    setSelectedImageIndex(null);
    setGenerateError(null);
  };

  // ── 핸들러 ───────────────────────────────────────────────────────

  const handleImageUpload = (dataUrl: string, file: File) => {
    setUploadedImage(dataUrl);
    setUploadedFile(file);
    setSelectedCategory(null);
    setSelectedTemplate(null);
    setSelectedPreservation(DEFAULT_PRESERVATION);
    resetGeneration();
    scrollTo(templateRef); // 업로드 후 바로 스타일 선택으로 이동
  };

  // 선택사항 — 같은 항목 재클릭 시 해제, 생성 상태는 유지
  const handleCategorySelect = (category: string) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  const handleTemplateSelect = (template: PhotoTemplate) => {
    setSelectedTemplate(template);
    resetGeneration();
  };

  const handleGenerate = async () => {
    if (!uploadedFile || !selectedTemplate) return;

    setIsGenerating(true);
    setGeneratedImages([]);
    setSelectedImageIndex(null);
    setGenerateError(null);
    scrollTo(resultRef);

    try {
      // 배달앱 대표사진형만 사용자 선택 강도 적용, 나머지는 원본 보존 우선값 고정
      const effectivePreservation: PreservationMode =
        selectedTemplate.id === 'delivery-hero' ? selectedPreservation : DEFAULT_PRESERVATION;

      // 생성 방식에 따라 프롬프트 빌더 선택
      const buildPrompt =
        generateMode === 'composite' ? buildCompositePrompt :
        generateMode === 'mask'      ? buildPreservePrompt :
                                       buildGenerationPrompt;

      // 모델 결정: modelOverride → 없으면 template.preferredModel → 기본값 gpt
      // (프롬프트 빌더도 같은 모델 기준으로 분기 — Flux는 압축 프롬프트 사용)
      const preferredModel = selectedTemplate.preferredModel ?? 'gpt';
      const effectiveModel = modelOverride === 'auto' ? preferredModel : modelOverride;

      // endpoint 결정: mask/composite는 고정, normal은 모델 라우팅 적용
      let endpoint: string;
      if (generateMode === 'composite') {
        endpoint = '/api/generate-composite';
      } else if (generateMode === 'mask') {
        endpoint = '/api/generate-preserve';
      } else {
        endpoint = effectiveModel === 'flux' ? '/api/generate-flux' : '/api/generate-photo';
      }

      const promptA = buildPrompt({
        category: selectedCategory,
        template: selectedTemplate,
        preservation: effectivePreservation,
        variantIndex: 0,
        model: effectiveModel,
      });
      const promptB = buildPrompt({
        category: selectedCategory,
        template: selectedTemplate,
        preservation: effectivePreservation,
        variantIndex: 1,
        model: effectiveModel,
      });

      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('promptA', promptA);
      formData.append('promptB', promptB);

      // reference image가 있는 템플릿 + 기본 생성 모드일 때만 첨부
      if (generateMode === 'normal' && selectedTemplate.referenceImagePath) {
        try {
          const refRes = await fetch(selectedTemplate.referenceImagePath);
          if (refRes.ok) {
            const refBlob = await refRes.blob();
            formData.append('referenceImage', new File([refBlob], 'reference.png', { type: 'image/png' }));
          }
        } catch {
          // reference fetch 실패 시 단일 이미지로 폴백
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data: { images?: string[]; error?: string } = await res.json();

      if (!res.ok || !data.images) {
        setGenerateError(data.error ?? '이미지 생성에 실패했습니다. 다시 시도해 주세요.');
        return;
      }

      setGeneratedImages(data.images);
    } catch {
      setGenerateError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index);
    scrollTo(downloadRef);
  };

  const handleAiBgCompose = async () => {
    if (!uploadedFile) return;
    setIsAiBgComposing(true);
    setAiBgRemovedBg(null);
    setAiBgBackground(null);
    setAiBgResult(null);
    setAiBgError(null);
    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('bgStyle', aiBgStyle);
      const res = await fetch('/api/ai-background-compose', { method: 'POST', body: formData });
      const data: { removedBg?: string; aiBg?: string; composed?: string; error?: string } =
        await res.json();
      if (!res.ok || !data.composed) {
        setAiBgError(data.error ?? 'AI 배경 합성에 실패했습니다.');
        return;
      }
      setAiBgRemovedBg(data.removedBg ?? null);
      setAiBgBackground(data.aiBg ?? null);
      setAiBgResult(data.composed);
    } catch {
      setAiBgError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsAiBgComposing(false);
    }
  };

  const handleCompose = async () => {
    if (!uploadedFile) return;
    setIsComposing(true);
    setComposeRemovedBg(null);
    setComposeResult(null);
    setComposeError(null);
    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('bgPreset', composeBgPreset);
      const res = await fetch('/api/photoroom-compose-test', { method: 'POST', body: formData });
      const data: { removedBg?: string; composed?: string; error?: string } = await res.json();
      if (!res.ok || !data.composed) {
        setComposeError(data.error ?? '합성에 실패했습니다.');
        return;
      }
      setComposeRemovedBg(data.removedBg ?? null);
      setComposeResult(data.composed);
    } catch {
      setComposeError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsComposing(false);
    }
  };

  const handleRemoveBg = async () => {
    if (!uploadedFile) return;
    setIsBgRemoving(true);
    setBgRemovedImage(null);
    setBgRemoveError(null);
    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      const res = await fetch('/api/photoroom-remove-bg', { method: 'POST', body: formData });
      const data: { image?: string; error?: string } = await res.json();
      if (!res.ok || !data.image) {
        setBgRemoveError(data.error ?? '배경 제거에 실패했습니다.');
        return;
      }
      setBgRemovedImage(data.image);
    } catch {
      setBgRemoveError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsBgRemoving(false);
    }
  };

  // ── 파생 상태 ─────────────────────────────────────────────────────
  const hasGeneratedImages = generatedImages.length > 0;
  const selectedImage =
    selectedImageIndex !== null ? generatedImages[selectedImageIndex] : null;
  const phase1Done = selectedImage !== null;

  // ── 렌더 ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ── 헤더 ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🍽️</span>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                AI 음식사진 스튜디오
              </h1>
              <p className="text-xs text-gray-400">자영업자를 위한 전문 메뉴 사진 제작</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <StepChip active={!!uploadedImage} done={phase1Done} label="1단계: 사진 생성" />
            <span className="text-gray-300">›</span>
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-300 font-medium">
              2단계: 사용처 (준비 중)
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-20">

        {/* ── 1. 사진 업로드 ── */}
        <SectionBlock step="1" title="음식 사진 업로드">
          <ImageUpload onUpload={handleImageUpload} currentImage={uploadedImage} />
        </SectionBlock>

        {uploadedImage && (
          <>
            {/* ── 선택사항: 카테고리 (접기/펼치기) ── */}
            <CollapsibleCategorySection
              selected={selectedCategory}
              onSelect={handleCategorySelect}
            />

            {/* ── 2. 사진 스타일 선택 ── */}
            <SectionBlock sectionRef={templateRef} step="2" title="사진 스타일 선택">
              <TemplateSelect selected={selectedTemplate} onSelect={handleTemplateSelect} />

              {selectedTemplate && (
                <div className="mt-4">
                  {selectedTemplate.id === 'delivery-hero' ? (
                    // 배달앱 대표사진형: 사용자가 메뉴 유지 강도를 직접 선택
                    <PreservationSelect
                      selected={selectedPreservation}
                      onSelect={setSelectedPreservation}
                    />
                  ) : (
                    // 그 외 스타일: 2가지 시안 자동 생성 안내만 표시
                    <VariantInfoCard template={selectedTemplate} />
                  )}
                </div>
              )}

              {selectedTemplate && !isGenerating && !hasGeneratedImages && (
                <>
                  <button
                    onClick={handleGenerate}
                    className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-4 rounded-xl font-bold text-base transition-colors"
                  >
                    ✨ AI 사진 2장 생성하기
                  </button>

                  {/* 개발 전용: 생성 방식 + 모델 오버라이드 */}
                  {process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">🧪 방식:</span>
                      <select
                        value={generateMode}
                        onChange={(e) => setGenerateMode(e.target.value as GenerateMode)}
                        className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-0.5 bg-white"
                      >
                        <option value="normal">기본 생성</option>
                        <option value="mask">마스크 edit</option>
                        <option value="composite">원본 픽셀 합성</option>
                      </select>
                    </div>
                    {generateMode === 'normal' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">모델:</span>
                        <select
                          value={modelOverride}
                          onChange={(e) => setModelOverride(e.target.value as ModelOverride)}
                          className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-0.5 bg-white"
                        >
                          <option value="auto">
                            자동 ({selectedTemplate?.preferredModel?.toUpperCase() ?? 'GPT'})
                          </option>
                          <option value="gpt">GPT 강제</option>
                          <option value="flux">Flux 강제</option>
                        </select>
                        {modelOverride !== 'auto' && (
                          <span className="text-xs text-orange-500 font-medium">오버라이드 중</span>
                        )}
                      </div>
                    )}
                  </div>
                  )}
                </>
              )}
            </SectionBlock>
          </>
        )}

        {/* ── 3. 생성 중 로딩 ── */}
        {isGenerating && (
          <SectionBlock sectionRef={resultRef} step="3" title="AI 사진 생성 중">
            <GeneratingView />
          </SectionBlock>
        )}

        {/* ── 에러 ── */}
        {generateError && !isGenerating && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium">생성 실패</p>
            <p className="text-xs text-red-600">{generateError}</p>
            <button onClick={handleGenerate} className="text-xs text-red-600 underline">
              다시 시도하기
            </button>
          </div>
        )}

        {/* ── 3. 사진 2장 비교·선택 ── */}
        {hasGeneratedImages && !isGenerating && (
          <SectionBlock sectionRef={resultRef} step="3" title="마음에 드는 사진 선택">
            <PhotoComparison
              generatedImages={generatedImages}
              selectedIndex={selectedImageIndex}
              onSelect={handleSelectImage}
              variantLabels={selectedTemplate?.variantLabels}
            />
            <button
              onClick={handleGenerate}
              className="mt-3 w-full py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ↺ 다시 생성하기
            </button>
          </SectionBlock>
        )}

        {/* ── 4. 선택 결과 확인 + PNG 다운로드 ── */}
        {selectedImage && selectedTemplate && (
          <SectionBlock sectionRef={downloadRef} step="4" title="생성 완료">
            <PhotoResult
              originalImage={uploadedImage!}
              resultImage={selectedImage}
              category={selectedCategory ?? '음식'}
              template={selectedTemplate}
            />

            <a
              href={selectedImage}
              download="menu-photo.png"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-4 rounded-xl font-bold text-base transition-colors"
            >
              ↓ PNG 다운로드
            </a>

            {/* 2차 기능 안내 */}
            <div className="mt-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">
                사용처별 최적화 크기 변환 · 추천 문구 생성은 2차 기능으로 준비 중입니다.
              </p>
            </div>
          </SectionBlock>
        )}

        {/* ── 개발 전용: Photoroom 합성 테스트 ── */}
        {process.env.NODE_ENV === 'development' && uploadedImage && (
          <div className="border border-dashed border-indigo-200 rounded-xl p-4 space-y-4 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-500">🧪 Photoroom 합성 테스트</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">개발 전용</span>
            </div>

            {/* 배경 프리셋 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 shrink-0">배경:</span>
              <select
                value={composeBgPreset}
                onChange={(e) => {
                  setComposeBgPreset(e.target.value as BgPreset);
                  setComposeResult(null);
                  setComposeRemovedBg(null);
                  setComposeError(null);
                }}
                className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 bg-white flex-1"
              >
                {(Object.entries(BG_PRESET_LABELS) as [BgPreset, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompose}
              disabled={isComposing}
              className="w-full py-3 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 disabled:bg-violet-300 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              {isComposing ? 'Photoroom 배경 제거 + 합성 중…' : '합성 실행'}
            </button>

            {composeError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {composeError}
              </p>
            )}

            {(composeResult || isComposing) && (
              <div className="grid grid-cols-3 gap-2">
                {/* 원본 */}
                <div className="space-y-1">
                  <p className="text-xs text-center text-gray-400 font-medium">원본</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="원본"
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                </div>

                {/* 배경 제거 */}
                <div className="space-y-1">
                  <p className="text-xs text-center text-gray-400 font-medium">배경 제거</p>
                  {isComposing && !composeRemovedBg ? (
                    <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <span className="text-xs text-gray-300">처리 중…</span>
                    </div>
                  ) : composeRemovedBg ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={composeRemovedBg}
                      alt="배경 제거"
                      className="w-full aspect-square object-contain rounded-lg border border-gray-200"
                      style={{ backgroundImage: 'repeating-conic-gradient(#d1d5db 0% 25%, transparent 0% 50%) 0 0 / 12px 12px' }}
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50" />
                  )}
                </div>

                {/* 합성 결과 */}
                <div className="space-y-1">
                  <p className="text-xs text-center text-gray-400 font-medium">합성 결과</p>
                  {isComposing ? (
                    <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : composeResult ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={composeResult}
                      alt="합성 결과"
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                  ) : null}
                </div>
              </div>
            )}

            {/* 합성 결과 크게 보기 + 다운로드 */}
            {composeResult && !isComposing && (
              <a
                href={composeResult}
                download={`compose-test-${composeBgPreset}.png`}
                className="w-full flex items-center justify-center gap-2 py-2 border border-violet-300 text-violet-600 hover:bg-violet-50 rounded-xl text-sm font-medium transition-colors"
              >
                ↓ 합성 결과 PNG 다운로드
              </a>
            )}
          </div>
        )}

        {/* ── 개발 전용: Photoroom 배경 제거 테스트 ── */}
        {process.env.NODE_ENV === 'development' && uploadedImage && (
          <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-4 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-500">🧪 Photoroom 배경 제거 테스트</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">개발 전용</span>
            </div>

            <button
              onClick={handleRemoveBg}
              disabled={isBgRemoving}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              {isBgRemoving ? '배경 제거 중…' : '배경 제거 실행'}
            </button>

            {bgRemoveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {bgRemoveError}
              </p>
            )}

            {(bgRemovedImage || isBgRemoving) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-center text-gray-400 font-medium">원본</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="원본 사진"
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-center text-gray-400 font-medium">배경 제거 결과</p>
                  {isBgRemoving ? (
                    <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : bgRemovedImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={bgRemovedImage}
                      alt="배경 제거 결과"
                      className="w-full aspect-square object-contain rounded-lg border border-gray-200 bg-[url('/checker.png')] bg-repeat"
                      style={{ backgroundColor: '#f3f4f6', backgroundImage: 'repeating-conic-gradient(#d1d5db 0% 25%, transparent 0% 50%) 0 0 / 16px 16px' }}
                    />
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 개발 전용: AI 배경 + Photoroom 합성 테스트 ── */}
        {process.env.NODE_ENV === 'development' && uploadedImage && (
          <div className="border border-dashed border-emerald-200 rounded-xl p-4 space-y-4 bg-white">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-500">🧪 AI 배경 + Photoroom 합성 테스트</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">개발 전용</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Photoroom 배경 제거 + OpenAI 빈 배경 생성 → sharp 합성.
              AI는 음식을 생성하지 않습니다. 소요 시간 20~40초.
            </p>

            {/* 배경 스타일 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 shrink-0">스타일:</span>
              <select
                value={aiBgStyle}
                onChange={(e) => {
                  setAiBgStyle(e.target.value as AiBgStyle);
                  setAiBgResult(null);
                  setAiBgRemovedBg(null);
                  setAiBgBackground(null);
                  setAiBgError(null);
                }}
                className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 bg-white flex-1"
              >
                {(Object.entries(AI_BG_STYLE_LABELS) as [AiBgStyle, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAiBgCompose}
              disabled={isAiBgComposing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              {isAiBgComposing
                ? 'Photoroom 배경 제거 + AI 배경 생성 중… (20~40초)'
                : 'AI 배경 합성 실행'}
            </button>

            {aiBgError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {aiBgError}
              </p>
            )}

            {/* 4분할 비교 그리드 */}
            {(aiBgResult || isAiBgComposing) && (
              <div className="space-y-3">
                {/* 상단 행: 원본 | Photoroom 배경 제거 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-center text-gray-400 font-medium">① 원본</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedImage}
                      alt="원본"
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-center text-gray-400 font-medium">② Photoroom 배경 제거</p>
                    {isAiBgComposing && !aiBgRemovedBg ? (
                      <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <span className="text-xs text-gray-300">처리 중…</span>
                      </div>
                    ) : aiBgRemovedBg ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={aiBgRemovedBg}
                        alt="Photoroom 배경 제거"
                        className="w-full aspect-square object-contain rounded-lg border border-gray-200"
                        style={{ backgroundImage: 'repeating-conic-gradient(#d1d5db 0% 25%, transparent 0% 50%) 0 0 / 12px 12px' }}
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50" />
                    )}
                  </div>
                </div>

                {/* 하단 행: AI 배경 | 최종 합성 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-center text-gray-400 font-medium">③ AI 생성 배경</p>
                    {isAiBgComposing && !aiBgBackground ? (
                      <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : aiBgBackground ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={aiBgBackground}
                        alt="AI 생성 배경"
                        className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-center text-gray-400 font-medium">④ 최종 합성 결과</p>
                    {isAiBgComposing ? (
                      <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : aiBgResult ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={aiBgResult}
                        alt="최종 합성 결과"
                        className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* 다운로드 */}
            {aiBgResult && !isAiBgComposing && (
              <a
                href={aiBgResult}
                download={`ai-compose-${aiBgStyle}.png`}
                className="w-full flex items-center justify-center gap-2 py-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl text-sm font-medium transition-colors"
              >
                ↓ 합성 결과 PNG 다운로드
              </a>
            )}
          </div>
        )}

      </div>
    </main>
  );
}

/* ── 2가지 시안 안내 카드 (delivery-hero 외 스타일용) ─────────────── */

function VariantInfoCard({ template }: { template: PhotoTemplate }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-700">
        이 스타일은 2가지 시안으로 생성됩니다.
      </p>
      {template.noticeKo && (
        <p className="text-xs leading-relaxed text-orange-600 font-medium bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          {template.noticeKo}
        </p>
      )}
      {template.variantLabels && (
        <div className="space-y-2">
          {template.variantLabels.map((label, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-xs font-bold text-orange-500 shrink-0 pt-0.5">
                {i + 1}번 —
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                {template.variantDescriptionsKo?.[i] && (
                  <p className={`text-xs mt-0.5 leading-relaxed ${
                    template.variantDescriptionsKo[i].startsWith('⚠️')
                      ? 'text-orange-600 font-medium'
                      : 'text-gray-400'
                  }`}>
                    {template.variantDescriptionsKo[i]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 선택사항 카테고리 섹션 ──────────────────────────────────────── */

function CollapsibleCategorySection({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (cat: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
            선택사항
          </span>
          <span className="text-sm font-medium text-gray-700">음식 카테고리</span>
          {selected && (
            <span className="text-xs text-orange-500 font-medium truncate">{selected}</span>
          )}
        </div>
        <span
          className="text-gray-400 text-lg leading-none shrink-0 ml-2 transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          ›
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 py-2">
            선택하면 AI가 해당 음식에 더 잘 맞는 결과를 만들어 드려요.
            없으면 건너뛰어도 됩니다.
          </p>
          <CategorySelect selected={selected} onSelect={onSelect} />
        </div>
      )}
    </div>
  );
}

/* ── 로딩 UI ─────────────────────────────────────────────────────── */

function GeneratingView() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
      <div className="flex justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <div>
        <p className="font-semibold text-gray-800">AI가 메뉴 사진 2장을 만들고 있어요.</p>
        <p className="text-sm text-gray-400 mt-1">잠시만 기다려 주세요. 보통 15~30초 소요됩니다.</p>
      </div>
    </div>
  );
}

/* ── 공통 UI 컴포넌트 ─────────────────────────────────────────────── */

function StepChip({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  const base = 'px-2 py-1 rounded-full transition-colors whitespace-nowrap font-medium';
  if (done) return <span className={`${base} bg-green-500 text-white`}>{label} ✓</span>;
  if (active) return <span className={`${base} bg-orange-500 text-white`}>{label}</span>;
  return <span className={`${base} bg-gray-100 text-gray-400`}>{label}</span>;
}

function SectionBlock({
  sectionRef,
  step,
  title,
  children,
}: {
  sectionRef?: React.RefObject<HTMLElement | null>;
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section ref={sectionRef}>
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-orange-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
          {step}
        </span>
        <h2 className="font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}
