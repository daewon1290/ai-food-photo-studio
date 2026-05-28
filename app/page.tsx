'use client';

import { useRef, useState } from 'react';
import { PhotoTemplate } from '@/lib/photoTemplates';
import { PlatformPreset } from '@/lib/platformPresets';
import { CaptionTone, CaptionResult, captionTones, generateCaptions } from '@/lib/captionPresets';
import ImageUpload from '@/components/ImageUpload';
import CategorySelect from '@/components/CategorySelect';
import TemplateSelect from '@/components/TemplateSelect';
import PhotoResult from '@/components/PhotoResult';
import PlatformSelect from '@/components/PlatformSelect';
import ExportView from '@/components/ExportView';
import CaptionView from '@/components/CaptionView';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PhotoTemplate | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [usePhotoClicked, setUsePhotoClicked] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformPreset | null>(null);
  const [selectedTone, setSelectedTone] = useState<CaptionTone | null>(null);
  const [captions, setCaptions] = useState<CaptionResult | null>(null);

  const categoryRef = useRef<HTMLElement>(null);
  const templateRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const platformRef = useRef<HTMLElement>(null);
  const exportRef = useRef<HTMLElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  };

  const handleImageUpload = (dataUrl: string) => {
    setUploadedImage(dataUrl);
    setSelectedCategory(null);
    setSelectedTemplate(null);
    setIsGenerated(false);
    setUsePhotoClicked(false);
    setSelectedPlatform(null);
    setSelectedTone(null);
    setCaptions(null);
    scrollTo(categoryRef);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedTemplate(null);
    setIsGenerated(false);
    setUsePhotoClicked(false);
    setSelectedPlatform(null);
    setSelectedTone(null);
    setCaptions(null);
    scrollTo(templateRef);
  };

  const handleTemplateSelect = (template: PhotoTemplate) => {
    setSelectedTemplate(template);
    setIsGenerated(false);
    setUsePhotoClicked(false);
    setSelectedPlatform(null);
    setSelectedTone(null);
    setCaptions(null);
  };

  const handleGenerate = () => {
    setIsGenerated(true);
    scrollTo(resultRef);
  };

  const handleUsePhoto = () => {
    setUsePhotoClicked(true);
    scrollTo(platformRef);
  };

  const handlePlatformSelect = (platform: PlatformPreset) => {
    setSelectedPlatform(platform);
    setSelectedTone(null);
    setCaptions(null);
    scrollTo(exportRef);
  };

  const handleToneSelect = (tone: CaptionTone) => {
    setSelectedTone(tone);
    if (selectedCategory && selectedTemplate && selectedPlatform) {
      setCaptions(generateCaptions(selectedCategory, selectedTemplate, selectedPlatform, tone));
    }
  };

  const phase1Done = isGenerated;
  const phase2Done = !!selectedPlatform;
  const phase3Done = !!captions;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
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
          {/* 단계 표시 */}
          <div className="flex items-center gap-1.5 text-xs">
            <StepChip active={!!uploadedImage} done={phase1Done} label="1단계: 사진 생성" />
            <span className="text-gray-300">›</span>
            <StepChip active={usePhotoClicked} done={phase2Done} label="2단계: 사용처" />
            <span className="text-gray-300">›</span>
            <StepChip active={!!selectedPlatform} done={phase3Done} label="3단계: 추천 문구" />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-20">
        {/* ── 1단계: 사진 생성 ── */}
        <SectionBlock step="1" title="음식 사진 업로드">
          <ImageUpload onUpload={handleImageUpload} currentImage={uploadedImage} />
        </SectionBlock>

        {uploadedImage && (
          <SectionBlock sectionRef={categoryRef} step="2" title="음식 카테고리 선택">
            <CategorySelect selected={selectedCategory} onSelect={handleCategorySelect} />
          </SectionBlock>
        )}

        {selectedCategory && (
          <SectionBlock sectionRef={templateRef} step="3" title="사진 템플릿 선택">
            <TemplateSelect selected={selectedTemplate} onSelect={handleTemplateSelect} />
            {selectedTemplate && !isGenerated && (
              <button
                onClick={handleGenerate}
                className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-4 rounded-xl font-bold text-base transition-colors"
              >
                ✨ AI 사진 생성하기
              </button>
            )}
          </SectionBlock>
        )}

        {isGenerated && selectedTemplate && selectedCategory && (
          <SectionBlock sectionRef={resultRef} step="4" title="생성 결과 확인">
            <PhotoResult
              originalImage={uploadedImage!}
              category={selectedCategory}
              template={selectedTemplate}
            />
            {!usePhotoClicked && (
              <button
                onClick={handleUsePhoto}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-4 rounded-xl font-bold text-base transition-colors"
              >
                이 사진 사용하기 →
              </button>
            )}
          </SectionBlock>
        )}

        {/* ── 2단계: 사용처별 Export ── */}
        {usePhotoClicked && (
          <>
            <StageDivider label="2단계: 사용처별 Export" />
            <SectionBlock sectionRef={platformRef} step="5" title="사용처 선택">
              <PlatformSelect selected={selectedPlatform} onSelect={handlePlatformSelect} />
            </SectionBlock>
          </>
        )}

        {selectedPlatform && (
          <SectionBlock sectionRef={exportRef} step="6" title="Export 정보 및 다운로드">
            <ExportView platform={selectedPlatform} sourceImage={uploadedImage!} />
          </SectionBlock>
        )}

        {/* ── 3단계: 추천 업로드 문구 ── */}
        {selectedPlatform && (
          <>
            <StageDivider label="3단계: 추천 업로드 문구" />
            <SectionBlock step="7" title="추천 업로드 문구 생성">
              <CaptionView
                category={selectedCategory!}
                template={selectedTemplate!}
                platform={selectedPlatform}
                tones={captionTones}
                selectedTone={selectedTone}
                onToneSelect={handleToneSelect}
                captions={captions}
              />
            </SectionBlock>
          </>
        )}
      </div>
    </main>
  );
}

/* ── 공통 UI 컴포넌트 ── */

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

function StageDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <hr className="flex-1 border-gray-200" />
      <span className="text-xs font-bold text-gray-400 whitespace-nowrap">{label}</span>
      <hr className="flex-1 border-gray-200" />
    </div>
  );
}
