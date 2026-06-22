// ─────────────────────────────────────────────────────────────────────────────
// preservation 모드 = "음식 자체의 충실도" 전용 축.
//
// 소품·배경·연출의 양은 여기서 제어하지 않는다 — 그건 variant(A/B)가 결정한다:
//   시안 A (기본 스튜디오형)  = 소품 0개 고정
//   시안 B (프리미엄 소품형) = staging 소품 전부 고정
//
// 이 모드는 A/B 양쪽에 동일하게 적용되며, 오직 음식 픽셀을 얼마나 그대로
// 둘 것인지(원본 유지 ↔ 광고급 보정)만 결정한다.
// ─────────────────────────────────────────────────────────────────────────────

export type PreservationMode = 'strict' | 'natural' | 'abundant';

export interface PreservationOption {
  id: PreservationMode;
  labelKo: string;
  descriptionKo: string;
  previewImage: string;
  promptEn: string;
}

export const DEFAULT_PRESERVATION: PreservationMode = 'strict';

export const preservationOptions: PreservationOption[] = [
  {
    id: 'strict',
    labelKo: '실제 메뉴 그대로',
    descriptionKo: '음식은 원본 그대로 — 조명·색만 정리',
    previewImage: '/preservation-examples/strict.png',
    promptEn:
      'Reproduce the food exactly as photographed — same shape, amount, piece count, arrangement, color, and texture. ' +
      'On the food itself, only lighting cleanup and color correction are allowed. ' +
      'Do not make the food look richer, taller, glossier, or more complex than the original.',
  },
  {
    id: 'natural',
    labelKo: '자연스럽게 보정',
    descriptionKo: '음식 정체성 유지, 색감·윤기 자연 보정',
    previewImage: '/preservation-examples/natural.png',
    promptEn:
      'Keep the same menu identity and all visible food elements. ' +
      'Gentle enhancement of the food itself is allowed: balanced color, natural gloss, fresher-looking surfaces. ' +
      'Do not change the food\'s shape, amount, piece count, or arrangement. ' +
      'The result should look naturally appetizing, not artificially perfect.',
  },
  {
    id: 'abundant',
    labelKo: '먹음직스럽게 강조',
    descriptionKo: '형태는 유지, 윤기·볼륨감을 광고 수준으로 강조',
    previewImage: '/preservation-examples/abundant.png',
    promptEn:
      'Keep the menu identity, piece count, and overall arrangement of the original food. ' +
      'Advertisement-level enhancement of the food itself is allowed: richer gloss, more vivid appetizing color, ' +
      'slightly fuller-looking volume, and perfected positioning of the existing food elements. ' +
      'Do not add new ingredients, do not replace the dish, and do not transform it into a different menu item.',
  },
];
