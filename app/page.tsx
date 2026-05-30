'use client';

import { useRef, useState } from 'react';
import { PhotoTemplate } from '@/lib/photoTemplates';
import { buildGenerationPrompt } from '@/lib/buildPrompt';
import ImageUpload from '@/components/ImageUpload';
import CategorySelect from '@/components/CategorySelect';
import TemplateSelect from '@/components/TemplateSelect';
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

  // 생성 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

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
    if (!uploadedFile || !selectedTemplate) return; // 카테고리는 필수 조건에서 제외

    setIsGenerating(true);
    setGeneratedImages([]);
    setSelectedImageIndex(null);
    setGenerateError(null);
    scrollTo(resultRef);

    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('prompt', buildGenerationPrompt(selectedCategory, selectedTemplate));

      const res = await fetch('/api/generate-photo', {
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

              {selectedTemplate && !isGenerating && !hasGeneratedImages && (
                <button
                  onClick={handleGenerate}
                  className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-4 rounded-xl font-bold text-base transition-colors"
                >
                  ✨ AI 사진 2장 생성하기
                </button>
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

      </div>
    </main>
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
