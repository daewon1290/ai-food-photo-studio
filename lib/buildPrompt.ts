import { PhotoTemplate } from './photoTemplates';

/**
 * OpenAI images.edit API에 전달할 최종 프롬프트를 조합합니다.
 *
 * 우선순위:
 * 1. 음식 원본 유지 (음식 종류·모양·양·색감·질감 불변)
 * 2. 스타일 적용 (배경·조명·접시·테이블·소품·카메라 앵글만 교체)
 * 3. 이미지 내 텍스트 전면 금지
 * 4. 템플릿별 네거티브 가이드
 */
export function buildGenerationPrompt(
  category: string | null,
  template: PhotoTemplate,
): string {
  const intro = category
    ? `Professional food photography edit for: ${category}.`
    : `Professional food photography edit.`;

  return [
    intro,
    ``,
    // ── 음식 원본 유지 (최우선) ──────────────────────────────────────
    `FOOD PRESERVATION (top priority):`,
    `The food in the final image must look IDENTICAL to the original.`,
    `Preserve exactly: food type, shape, portion size, texture, color, sauce, and glaze.`,
    `Do NOT substitute, rearrange, add, or remove any part of the food itself.`,
    ``,
    // ── 스타일 적용 범위 ─────────────────────────────────────────────
    `ALLOWED CHANGES ONLY:`,
    `Transform background, lighting, table surface, plates/bowls, props, and camera angle.`,
    ``,
    // ── 템플릿 스타일 지시 ───────────────────────────────────────────
    `STYLE DIRECTION:`,
    template.promptEn,
    ``,
    // ── 텍스트 완전 금지 ─────────────────────────────────────────────
    `TEXT PROHIBITION (strictly enforced):`,
    `Do NOT include ANY text, letters, numbers, characters, captions, labels, logos,`,
    `watermarks, Korean text, Chinese text, Japanese text, menu names, prices,`,
    `brand names, or any written content anywhere in the image.`,
    ``,
    // ── 네거티브 가이드 ──────────────────────────────────────────────
    `AVOID: ${template.negativePromptEn}`,
  ].join('\n');
}
