'use client';

import { Fragment, useRef, useState } from 'react';
import Image from 'next/image';
import { PhotoTemplate } from '@/lib/photoTemplates';
import { buildGenerationPrompt, buildPreservePrompt, buildCompositePrompt } from '@/lib/buildPrompt';
import { PreservationMode, DEFAULT_PRESERVATION } from '@/lib/preservationModes';
import ImageUpload from '@/components/ImageUpload';
import PosterMode from '@/components/PosterMode';
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

  // 앱 모드 전환
  type AppMode = 'landing' | 'ai-studio' | 'poster';
  const [appMode, setAppMode] = useState<AppMode>('landing');
  const [posterBaseImage, setPosterBaseImage] = useState<string | null>(null);

  // 생성 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
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

  const abortControllerRef = useRef<AbortController | null>(null);

  // ── 섹션 스크롤 ref ───────────────────────────────────────────────
  const categoryRef = useRef<HTMLElement>(null);
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
    setIsCancelled(false);
  };

  // ── 핸들러 ───────────────────────────────────────────────────────

  const handleImageUpload = (dataUrl: string, file: File) => {
    setUploadedImage(dataUrl);
    setUploadedFile(file);
    setSelectedCategory(null);
    setSelectedTemplate(null);
    setSelectedPreservation(DEFAULT_PRESERVATION);
    resetGeneration();
    scrollTo(categoryRef); // 업로드 후 음식 종류 선택으로 이동
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleTemplateSelect = (template: PhotoTemplate) => {
    setSelectedTemplate(template);
    resetGeneration();
  };

  const handleGenerate = async () => {
    if (!uploadedFile || !selectedTemplate) return;

    setIsGenerating(true);
    setSelectedImageIndex(null);
    setGenerateError(null);
    setIsCancelled(false);
    scrollTo(resultRef);

    const controller = new AbortController();
    abortControllerRef.current = controller;

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

      // "잘 모르겠어요" 선택 시 프롬프트에 카테고리 힌트를 넘기지 않음
      const categoryForPrompt = selectedCategory === '잘 모르겠어요' ? null : selectedCategory;

      const promptA = buildPrompt({
        category: categoryForPrompt,
        template: selectedTemplate,
        preservation: effectivePreservation,
        variantIndex: 0,
        model: effectiveModel,
      });
      const promptB = buildPrompt({
        category: categoryForPrompt,
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
          const refRes = await fetch(selectedTemplate.referenceImagePath, { signal: controller.signal });
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
        signal: controller.signal,
      });

      const data: { images?: string[]; error?: string } = await res.json();

      if (!res.ok || !data.images) {
        setGenerateError(data.error ?? '이미지 생성에 실패했습니다. 다시 시도해 주세요.');
        return;
      }

      setGeneratedImages(data.images);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setIsCancelled(true);
      } else {
        setGenerateError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
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
  const isLanding = appMode === 'landing';
  const hasGeneratedImages = generatedImages.length > 0;
  const workspaceStep: number =
    !uploadedImage ? 1 :
    !selectedCategory ? 2 :
    !isGenerating && !hasGeneratedImages ? 3 :
    isGenerating && !hasGeneratedImages ? 4 :
    5;
  const selectedImage =
    selectedImageIndex !== null ? generatedImages[selectedImageIndex] : null;
  // ── 렌더 ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#FFF9F5]">
      {/* ── 헤더 ── */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">🍽️</span>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">AI 음식사진 스튜디오</h1>
            <p className="text-xs text-orange-400 leading-tight font-medium">대충 찍어도 광고사진처럼</p>
          </div>
        </div>
      </header>

      <div className={`max-w-2xl mx-auto px-4 py-6 space-y-5 ${selectedImage ? 'pb-32 sm:pb-20' : 'pb-20'}`}>

        {/* ── 소개 (랜딩 상태에서만 표시) ── */}
        {isLanding && (
          <HeroSection
            onStartAI={() => setAppMode('ai-studio')}
            onStartPoster={() => setAppMode('poster')}
          />
        )}

        {/* ── 포스터 모드 ── */}
        {appMode === 'poster' && (
          <PosterMode
            initialImage={posterBaseImage ?? undefined}
            onBack={() => { setAppMode('landing'); setPosterBaseImage(null); }}
          />
        )}

        {/* ── 1. 사진 업로드 ── */}
        {appMode === 'ai-studio' && (
          <>
            <WorkspaceSteps currentStep={workspaceStep} />
            <SectionBlock step="1" title="음식 사진 업로드">
              <ImageUpload onUpload={handleImageUpload} currentImage={uploadedImage} />
            </SectionBlock>
          </>
        )}

        {appMode === 'ai-studio' && uploadedImage && (
          <>
            {/* ── 2. 음식 종류 선택 ── */}
            <SectionBlock sectionRef={categoryRef} step="2" title="음식 종류 선택">
              <p className="text-sm text-gray-500 leading-relaxed mb-3">
                AI가 음식을 잘못 바꾸지 않도록 가장 가까운 종류를 골라주세요.
                애매하면 &quot;잘 모르겠어요&quot;를 선택해도 됩니다.
              </p>
              <CategorySelect selected={selectedCategory} onSelect={handleCategorySelect} />
            </SectionBlock>

            {/* ── 3. 사진 스타일 선택 ── */}
            <SectionBlock sectionRef={templateRef} step="3" title="사진 스타일 선택">
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
                  {selectedCategory ? (
                    <button
                      onClick={handleGenerate}
                      className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-4 rounded-2xl font-bold text-base transition-colors shadow-sm"
                    >
                      ✨ AI 사진 2장 생성하기
                    </button>
                  ) : (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                      <p className="text-sm text-orange-600 font-medium">위 2단계에서 음식 종류를 먼저 선택해 주세요</p>
                    </div>
                  )}

                  {/* 개발 전용: 생성 방식 + 모델 오버라이드 */}
                  {process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true' && (
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

        {/* ── 4. 생성 중 로딩 (첫 생성 — 이전 결과 없음) ── */}
        {appMode === 'ai-studio' && isGenerating && !hasGeneratedImages && (
          <SectionBlock sectionRef={resultRef} step="4" title="AI 사진 생성 중">
            <GeneratingView />
            <button
              onClick={handleCancel}
              className="mt-4 w-full py-3 border border-gray-200 rounded-2xl text-sm text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              취소
            </button>
          </SectionBlock>
        )}

        {/* ── 에러 ── */}
        {appMode === 'ai-studio' && generateError && !isGenerating && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium">생성 실패</p>
            <p className="text-xs text-red-600">{generateError}</p>
            <button onClick={handleGenerate} className="text-xs text-red-600 underline">
              다시 시도하기
            </button>
          </div>
        )}

        {/* ── 취소 ── */}
        {appMode === 'ai-studio' && isCancelled && !isGenerating && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">생성이 취소되었습니다.</p>
            <button onClick={handleGenerate} className="text-xs text-orange-500 font-medium underline">
              다시 시도하기
            </button>
          </div>
        )}

        {/* ── 4. 사진 2장 비교·선택 (재생성 중에도 이전 결과 유지) ── */}
        {appMode === 'ai-studio' && hasGeneratedImages && (
          <SectionBlock sectionRef={resultRef} step="4" title="마음에 드는 사진 선택">
            {isGenerating && (
              <div className="mb-3 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <span className="text-sm text-orange-600">새 이미지를 생성 중입니다…</span>
                <button
                  onClick={handleCancel}
                  className="text-xs text-gray-500 underline"
                >
                  취소
                </button>
              </div>
            )}
            <div className={isGenerating ? 'opacity-40 pointer-events-none' : ''}>
              <PhotoComparison
                generatedImages={generatedImages}
                selectedIndex={selectedImageIndex}
                onSelect={handleSelectImage}
                variantLabels={selectedTemplate?.variantLabels}
              />
            </div>
            {!isGenerating && (
              <button
                onClick={handleGenerate}
                className="mt-3 w-full py-3 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ↺ 다시 생성하기
              </button>
            )}
          </SectionBlock>
        )}

        {/* ── 5. 선택 결과 확인 + PNG 다운로드 ── */}
        {appMode === 'ai-studio' && selectedImage && selectedTemplate && (
          <SectionBlock sectionRef={downloadRef} step="5" title="생성 완료">
            <PhotoResult
              originalImage={uploadedImage!}
              resultImage={selectedImage}
              category={selectedCategory ?? '음식'}
              template={selectedTemplate}
            />

            <a
              href={selectedImage}
              download={buildDownloadFilename(selectedTemplate.id, selectedImage)}
              className="mt-4 hidden sm:flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-4 rounded-2xl font-bold text-base transition-colors shadow-sm"
            >
              ↓ PNG 다운로드
            </a>

            <button
              onClick={() => {
                setPosterBaseImage(selectedImage);
                setAppMode('poster');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mt-3 w-full py-3 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors"
            >
              ✏️ 이 사진으로 홍보 포스터 만들기
            </button>

          </SectionBlock>
        )}

        {/* ── 개발 전용: Photoroom 합성 테스트 ── */}
        {process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true' && uploadedImage && (
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
        {process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true' && uploadedImage && (
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
        {process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === 'true' && uploadedImage && (
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

      {/* ── 모바일 스티키 다운로드 바 ── */}
      {appMode === 'ai-studio' && selectedImage && selectedTemplate && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20">
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.10)] px-4 py-3">
            <a
              href={selectedImage}
              download={buildDownloadFilename(selectedTemplate.id, selectedImage)}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-colors"
            >
              ↓ AI 사진 저장하기
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

/* ── 워크스페이스 단계 안내 ───────────────────────────────────────── */

const WORKSPACE_STEPS = [
  { id: 1, label: '사진 업로드' },
  { id: 2, label: '음식 종류 선택' },
  { id: 3, label: '스타일 선택' },
  { id: 4, label: '이미지 생성' },
  { id: 5, label: '결과 확인' },
] as const;

function WorkspaceSteps({ currentStep }: { currentStep: number }) {
  const total = WORKSPACE_STEPS.length;
  const currentLabel = WORKSPACE_STEPS.find((s) => s.id === currentStep)?.label ?? '';

  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm space-y-2">
      {/* 진행 바 */}
      <div className="flex items-center">
        {WORKSPACE_STEPS.map((step, i) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <Fragment key={step.id}>
              {i > 0 && (
                <div className={`flex-1 h-0.5 ${done ? 'bg-orange-400' : 'bg-gray-200'}`} />
              )}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                  done
                    ? 'bg-orange-500 text-white'
                    : active
                    ? 'bg-orange-500 text-white ring-2 ring-orange-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? '✓' : step.id}
              </div>
            </Fragment>
          );
        })}
      </div>
      {/* 현재 단계 레이블 */}
      <p className="text-xs font-semibold text-orange-500">
        {currentStep}단계 / {total} — {currentLabel}
      </p>
    </div>
  );
}

/* ── 온보딩 소개 ─────────────────────────────────────────────────── */

const ONBOARDING_STEPS = [
  {
    image: '/onboarding/onboarding-upload.png',
    title: '먼저 사진을 올려요',
    desc: '가게에서 찍은 평범한 음식 사진도 괜찮아요.',
  },
  {
    image: '/onboarding/onboarding-template.png',
    title: '원하는 분위기를 골라요',
    desc: '배달앱 대표사진, 매운 불맛, 카페 음료, 고급 레스토랑 느낌까지 선택할 수 있어요.',
  },
  {
    image: '/onboarding/onboarding-preserve.png',
    title: '음식 정체성은 지켜요',
    desc: '햄버거는 햄버거답게, 치킨은 치킨답게 유지하면서 조명과 분위기를 개선해요.',
  },
  {
    image: '/onboarding/onboarding-download.png',
    title: '결과를 저장해요',
    desc: '완성된 이미지는 배달앱, 스마트플레이스, SNS 홍보에 바로 활용할 수 있어요.',
  },
] as const;

function HeroSection({
  onStartAI,
  onStartPoster,
}: {
  onStartAI: () => void;
  onStartPoster: () => void;
}) {
  return (
    <div className="space-y-5 pt-2">
      {/* 메인 카피 */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">AI 음식사진 스튜디오</h2>
        <p className="text-sm text-gray-400">무엇을 만들까요?</p>
      </div>

      {/* 기능 선택 카드 2장 */}
      <div className="space-y-3">

        {/* 카드 1: AI 음식 사진 만들기 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2">
            {[ONBOARDING_STEPS[0], ONBOARDING_STEPS[3]].map((step) => (
              <div key={step.image} className="relative aspect-video bg-gray-100">
                <Image src={step.image} alt={step.title} fill className="object-cover" sizes="50vw" />
              </div>
            ))}
          </div>
          <div className="px-4 py-4 space-y-3">
            <div>
              <h3 className="font-bold text-gray-900">📸 AI 음식 사진 만들기</h3>
              <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                평범한 음식 사진을 광고 사진처럼 바꿔드려요.
                스타일만 고르면 AI가 30초 안에 완성해요.
              </p>
            </div>
            <button
              onClick={onStartAI}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
            >
              시작하기 →
            </button>
          </div>
        </div>

        {/* 카드 2: 홍보 포스터 만들기 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2">
            {['/poster-examples/poster-burger-ingredients.png', '/poster-examples/poster-kimchi-humor.png'].map((src) => (
              <div key={src} className="relative aspect-video bg-gray-100">
                <Image src={src} alt="홍보 포스터 예시" fill className="object-cover" sizes="50vw" />
              </div>
            ))}
          </div>
          <div className="px-4 py-4 space-y-3">
            <div>
              <h3 className="font-bold text-gray-900">✏️ 홍보 포스터 만들기</h3>
              <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                이미 있는 음식 사진에 메뉴명·가격·홍보 문구를 얹어
                인스타·당근·스마트플레이스용 포스터를 만들어요.
              </p>
            </div>
            <button
              onClick={onStartPoster}
              className="w-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 active:bg-orange-100 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              시작하기 →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function buildDownloadFilename(templateId: string, imageUrl: string): string {
  const ext = imageUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png';
  const now = new Date();
  const date =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const time =
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0');
  return `ai-food-photo-${templateId}-${date}-${time}.${ext}`;
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
