import { PhotoTemplate, FoodPlacement, SteamLevel, COMMON_NEGATIVE_EN } from './photoTemplates';
import { PreservationMode, preservationOptions } from './preservationModes';

export interface GenerationParams {
  category: string | null;
  template: PhotoTemplate;
  preservation: PreservationMode;
  variantIndex: 0 | 1;
  /**
   * 프롬프트를 받을 모델. 미지정 시 template.preferredModel 사용.
   * flux → 압축 프롬프트 (Flux Kontext는 유효 프롬프트 길이가 짧아
   *        긴 구조화 프롬프트의 후반부를 무시함 — 실측 확인)
   * gpt  → 전체 구조화 프롬프트
   */
  model?: 'gpt' | 'flux';
}

// ─────────────────────────────────────────────────────────────────────────────
// A/B 출력 구조
//
//   A/B 차이는 배경이 아니라 "음식 비율"과 "소품 개수"다.
//   두 시안 모두 템플릿의 촬영 규칙(배경·테이블·조명·색온도·무드)을 따른다.
//
//   시안 A (variantIndex 0) = 기본 스튜디오형 (음식 중심)
//     - 음식 비율 = template.foodRatioA
//     - 소품: requiredFoodProps 첫 1개만 / optional·scene 소품 금지
//     - 가니쉬: 음식 위에 올라가는 것만
//
//   시안 B (variantIndex 1) = 프리미엄 소품형
//     - 음식 비율 = template.foodRatioB
//     - requiredFoodProps 전부 + optionalFoodProps 최대 2개
//     - sceneProps 3–5개가 템플릿 광고 컨셉의 핵심
//     - 과장 연출 금지
//
//   preservation 모드는 "음식 자체의 충실도"만 제어한다. 소품 양은 variant가 결정.
//   A와 B는 독립된 API 호출이므로 상호 참조("variant A와 달라야 함") 지시는 금지.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 시안 A 전용 보존 원칙 — 소품 제한과 방향 일치
// ─────────────────────────────────────────────────────────────────────────────
const CORE_FOOD_PRESERVATION = `CORE FOOD PRESERVATION — ABSOLUTE TOP PRIORITY (overrides all style instructions):
- Do not recreate, redesign, replace, or reinterpret the food itself.
- Keep the uploaded food visually as close to the original as possible.
- Preserve the original food's visible shape, amount, piece count, arrangement, color, surface texture, and overall menu identity.
- The food must look like the same photographed menu item professionally re-shot, NOT a newly generated version of the dish.
- AI's role: make the original food look like it was photographed in a professional studio. Not to reinvent the food.
- Only restyle the surroundings: background, plate, lighting, shadows, and camera composition.
- If any style instruction conflicts with preserving the original food, prioritize preserving the original food.
- Never make the food look less appetizing than the original uploaded photo.
- Do not assume standard ingredients for this dish.
- Do not add any ingredients, toppings, or food elements that are not visible in the uploaded photo.
- Do not transform the food into another menu item or recipe.`;

// ─────────────────────────────────────────────────────────────────────────────
// 시안 B 전용 보존 원칙 — 음식만 보존, 주변 연출은 의무
// ─────────────────────────────────────────────────────────────────────────────
const FOOD_ONLY_PRESERVATION = `FOOD-ONLY PRESERVATION — ABSOLUTE TOP PRIORITY:
- The FOOD ITSELF must stay exactly as photographed: shape, piece count, color, surface texture, and arrangement. Never alter the food.
- The SURROUNDINGS are yours to design: actively build a rich, styled scene with the surface, props, and garnish specified below.
- Adding non-food props AROUND the food is REQUIRED, not optional.
- Never place props on top of or inside the food.
- Do not add other food DISHES that are not in the original photo. (Tableware, drinks in glasses, sauce in small dishes, and garnish are props — they are allowed and expected.)
- Never make the food look less appetizing than the original uploaded photo.`;

// ─────────────────────────────────────────────────────────────────────────────
// 음식 정체성 가드 — 실측에서 발견된 변형 사고 방지 (먹태→감자튀김, 음료→빙수)
// ─────────────────────────────────────────────────────────────────────────────
const FOOD_IDENTITY_GUARDS = `FOOD IDENTITY GUARDS:
- If the food consists of thin dried shredded strips (dried pollack 먹태, dried squid, or similar), preserve their exact fibrous strand form, muted golden-white color, and airy dried texture — do NOT transform them into fried fries, noodles, or any other item.
- If the food is a drink or beverage, preserve its liquid form and the original glass or cup shape — do NOT transform it into shaved ice, granita, ice cream, or any solid food.`;

// ─────────────────────────────────────────────────────────────────────────────
// 시안 B — 카메라 깊이 구조
// ─────────────────────────────────────────────────────────────────────────────
const CAMERA_DEPTH = `CAMERA DEPTH (three-layer structure):
- Foreground table surface softly visible at the bottom → sharp food in the midground → background receding naturally behind.
- The full plate must always remain visible — never cut off at any frame edge.
- Camera angle, color temperature, surface material, and composition are defined in STYLE DIRECTION — follow them precisely; do not average them toward a generic food photo look.`;

// ─────────────────────────────────────────────────────────────────────────────
// 시안 B — 품질 실패 조건
// ─────────────────────────────────────────────────────────────────────────────
const PREMIUM_FAILURE = `QUALITY FAILURE — the result is unacceptable if:
- The food looks less appetizing than the original.
- The food's texture, shape, piece count, or menu identity is lost or altered.
- NO props are visible in the final image — a bare food-only shot is a failure for this variant.
- Props are placed on top of or inside the food.
- Fried food loses its crispy golden texture.`;

// ─────────────────────────────────────────────────────────────────────────────
// 텍스트 금지 (공통)
// ─────────────────────────────────────────────────────────────────────────────
const TEXT_PROHIBITION = `TEXT PROHIBITION (strictly enforced):
Do NOT include ANY text, letters, numbers, characters, captions, labels, logos, watermarks, Korean text, Chinese text, Japanese text, menu names, prices, brand names, menu boards, signage, or any written content anywhere in the image.`;

// ─────────────────────────────────────────────────────────────────────────────
// 메뉴별 질감 보존 (공통)
// ─────────────────────────────────────────────────────────────────────────────
const FRIED_FOOD_CATEGORIES = new Set(['후라이드 치킨', '양념치킨', '닭강정', '돈가스', '치킨·버거·피자류']);

function getMenuTextureNote(category: string | null): string | null {
  if (!category) return null;

  if (FRIED_FOOD_CATEGORIES.has(category)) {
    return `FRIED FOOD TEXTURE PRESERVATION (critical):
- Preserve the crispy fried coating, golden color, irregular crunchy crust, natural fried texture, and the original piece shapes.
- Do not smooth out the crust or make it look plastic, molded, or unnaturally uniform.
- Do not make fried food look soggy, dark, dull, burnt, over-oily, or plastic-looking.
- Keep fried food visibly crisp, golden, and appetizing even under dark or dramatic lighting.
- Do not redraw the fried pieces into smooth or uniform shapes.`;
  }

  if (category === '떡볶이' || category === '떡볶이·분식류') {
    return `TTEOKBOKKI / SPICY FOOD PRESERVATION:
- Preserve glossy red sauce, original rice cake shapes, sauce thickness, steam, and the spicy appetizing color.
- Do not turn it into a different noodle dish, stew, or unrelated food.
- Do not over-darken or desaturate the red sauce.
- Maintain the glossy, saucy texture throughout.`;
  }

  if (category === '카페 음료' || category === '디저트' || category === '디저트·베이커리') {
    return `CAFE DRINK / DESSERT PRESERVATION:
- Preserve fresh colors, the original drink or dessert identity, and clean natural presentation.
- If it is a layered drink, preserve the visible layer structure.
- Do not make it look oily, overly dark, or artificially altered.`;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 음식 충실도 프롬프트 (preservation 모드 — A/B 공통 적용)
// ─────────────────────────────────────────────────────────────────────────────
function getPreservationPrompt(mode: PreservationMode): string {
  return preservationOptions.find((o) => o.id === mode)?.promptEn ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// 구조화 규칙 → 프롬프트 변환 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
const PLACEMENT_LABELS: Record<FoodPlacement, string> = {
  'center': 'food centered with balanced margins',
  'offset-third': 'rule of thirds — food offset to one side, breathing space on the opposite side',
  'full-spread': 'dishes fill the frame generously, edge to edge',
};

function formatRatio(ratio: [number, number]): string {
  return `${ratio[0]}–${ratio[1]}%`;
}

function steamLine(level: SteamLevel): string {
  switch (level) {
    case 'strong':
      return '- STEAM: rising steam is a KEY visual element — generous, backlit so it glows, but still realistic.';
    case 'medium':
      return '- STEAM: gentle natural steam rising from the hot food, backlit softly to make it wispy and visible. Subtle — not dense or dramatic.';
    default:
      return '- STEAM: none. Do not add any steam, smoke, or heat haze. Convey heat and freshness through color richness, texture, and warm directional lighting.';
  }
}

/**
 * 템플릿의 구조화 촬영 규칙 → STYLE DIRECTION 블록.
 * PhotoResult 등 UI에서도 표시용으로 사용한다.
 */
export function buildStyleDirection(t: PhotoTemplate): string {
  return [
    'STYLE DIRECTION:',
    `- CAMERA: ${t.cameraAngleEn}.`,
    `- BACKGROUND: ${t.backgroundEn}.`,
    `- SURFACE: ${t.tableSurfaceEn}.`,
    `- LIGHTING: ${t.lightingEn}.`,
    `- COLOR TEMPERATURE: ${t.colorTemperatureEn}.`,
    `- MOOD: ${t.moodEn}.`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 시안 A — 스튜디오 출력 스펙 (음식 중심, 소품 0–1개)
// ─────────────────────────────────────────────────────────────────────────────
function buildStudioSpec(t: PhotoTemplate): string {
  const lines: string[] = [
    'OUTPUT SPEC — STUDIO MENU SHOT:',
    `- FOOD SCALE: the food fills ${formatRatio(t.foodRatioA)} of the frame — the food is the dominant subject.`,
    `- PLACEMENT: ${PLACEMENT_LABELS[t.foodPlacement]}.`,
  ];

  if (t.requiredFoodProps.length > 0) {
    lines.push(`- PROPS: at most ONE prop, and only if it is essential to the scene: ${t.requiredFoodProps[0]}. No other props of any kind.`);
  } else {
    lines.push('- PROPS: NONE. Only the food and the plate or container it sits on.');
  }
  lines.push('- Do NOT add optional decorative props: no side bowls, no drinks, no napkins, no cutlery laid out, no scattered ingredients on the table.');
  lines.push('- GARNISH: only garnish that naturally sits ON TOP of the dish itself (e.g., sliced scallions or sesame already part of the dish). Do NOT place any garnish items on the table beside the food.');
  lines.push(steamLine(t.steamLevel));
  lines.push("- PURPOSE: a clean menu photo — keep this template's background, lighting, and mood, but the food is the only story.");

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 시안 B — 프리미엄 출력 스펙 (음식 소품 최대 2 + 공간 연출 소품 3–5)
// ─────────────────────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  'chopsticks':        'chopsticks resting in or gently touching the food',
  'korean-spoon':      'Korean soup spoon resting in the bowl',
  'ladle':             'ladle resting in the pot at a natural angle',
  'fork':              'fork placed beside the food on the surface',
  'knife':             'knife laid flat beside food on the board',
  'hand-picking':      'a hand naturally picking up food — relaxed, not staged',
  'hand-pouring':      'a hand pouring sauce in a thin, controlled stream',
  'hand-holding-pot':  'a hand holding the pot handle from the side',
  'tongs':             'tongs gripping food at a natural angle',
};

function buildPremiumSpec(t: PhotoTemplate): string {
  const lines: string[] = [
    'OUTPUT SPEC — PREMIUM STYLED SHOT:',
    `- FOOD SCALE: the food occupies ${formatRatio(t.foodRatioB)} of the frame — pulled back enough to show the styled scene around it.`,
    `- PLACEMENT: ${PLACEMENT_LABELS[t.foodPlacement]}.`,
  ];

  // 필수 표면·용기 — 전부 등장
  if (t.requiredFoodProps.length > 0) {
    lines.push('- REQUIRED SURFACE / VESSEL (ALL of these must appear in the scene):');
    for (const p of t.requiredFoodProps) {
      lines.push(`  · ${p}`);
    }
  }

  // 음식 관련 소품 — 최대 2개
  if (t.optionalFoodProps.length > 0) {
    lines.push('- FOOD-RELATED PROPS (use AT MOST 2 — these are secondary, not the main styling tool):');
    for (const p of t.optionalFoodProps) {
      lines.push(`  · ${p}`);
    }
  }

  // 공간 연출 소품 — 3–5개, 템플릿 광고 컨셉의 핵심
  if (t.sceneProps.length > 0) {
    lines.push('- SCENE-STYLING PROPS (use 3–5 of these — they define this template\'s unique advertising concept and carry the mood of the scene):');
    for (const p of t.sceneProps) {
      lines.push(`  · ${p}`);
    }
  }
  lines.push('- The SCENE props build the advertising concept; the FOOD props stay minimal. Place everything beside or behind the food — never in front of or on top of it.');

  // 가니쉬
  if (t.garnish.length > 0) {
    lines.push(`- GARNISH (place beside or gently on the food — never obscuring it): ${t.garnish.join('; ')}.`);
  }

  lines.push(steamLine(t.steamLevel));

  // 액션 요소 (있는 템플릿만)
  if (t.actionElements.length > 0) {
    const actions = t.actionElements.map((el) => ACTION_LABELS[el] ?? el);
    lines.push(`- ACTION ELEMENT (optional, only if it looks natural): ${actions.join(' or ')}. Motion must look natural and unstaged — as if caught mid-meal.`);
  }

  // 과장 금지
  lines.push('- PROHIBITED STAGING: exaggerated action, flames, flying food pieces, dramatic splashes, crumb explosions, oversized props that compete with the food.');

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 시안 A — 기본 스튜디오형 프롬프트
// ─────────────────────────────────────────────────────────────────────────────
function buildStudioPrompt(
  category: string | null,
  template: PhotoTemplate,
  preservation: PreservationMode,
): string {
  const intro = category
    ? `Professional food photography re-styling for: ${category}.`
    : `Professional food photography re-styling.`;

  const parts: string[] = [intro, '', CORE_FOOD_PRESERVATION, '', FOOD_IDENTITY_GUARDS, ''];

  const textureNote = getMenuTextureNote(category);
  if (textureNote) {
    parts.push(textureNote, '');
  }

  const fidelity = getPreservationPrompt(preservation);
  if (fidelity) {
    parts.push('FOOD FIDELITY (user-selected):', fidelity, '');
  }

  parts.push(buildStudioSpec(template), '');
  parts.push(buildStyleDirection(template), '');
  parts.push(CAMERA_DEPTH, '');
  parts.push(TEXT_PROHIBITION, '', `AVOID: ${template.negativePromptEn}`);

  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 시안 B — 프리미엄 소품형 프롬프트
// ─────────────────────────────────────────────────────────────────────────────
function buildPremiumPrompt(
  category: string | null,
  template: PhotoTemplate,
  preservation: PreservationMode,
): string {
  const intro = category
    ? `Professional food photography re-styling for: ${category}.`
    : `Professional food photography re-styling.`;

  const parts: string[] = [intro, '', FOOD_ONLY_PRESERVATION, '', FOOD_IDENTITY_GUARDS, ''];

  const textureNote = getMenuTextureNote(category);
  if (textureNote) {
    parts.push(textureNote, '');
  }

  const fidelity = getPreservationPrompt(preservation);
  if (fidelity) {
    parts.push('FOOD FIDELITY (user-selected, applies to the food only — not the surroundings):', fidelity, '');
  }

  parts.push(buildPremiumSpec(template), '');
  parts.push(buildStyleDirection(template), '');
  parts.push(CAMERA_DEPTH, '', PREMIUM_FAILURE, '');
  parts.push(TEXT_PROHIBITION, '', `AVOID: ${template.negativePromptEn}`);

  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Flux 전용 압축 프롬프트
//
// Flux Kontext Pro는 유효 프롬프트 길이가 짧아 (수백 토큰 수준),
// 4,000자급 구조화 프롬프트의 후반부(STYLE DIRECTION·소품 목록)를 무시한다.
// → 같은 규칙을 ~1,200자 이내로 압축하고, 차별화 핵심(스타일·소품)을 앞에 배치한다.
// 실측: 압축 전 Flux 결과는 템플릿이 달라도 거의 동일한 이미지로 수렴했음.
// ─────────────────────────────────────────────────────────────────────────────

/** preservation 모드 → 한 줄 압축 (Flux용) */
const FLUX_FIDELITY: Record<PreservationMode, string> = {
  strict:   'Reproduce the food exactly as photographed; only lighting and color cleanup on the food itself.',
  natural:  'Gentle enhancement of the food\'s color and gloss is allowed; shape, amount, and arrangement unchanged.',
  abundant: 'Ad-level gloss and vivid color on the food are allowed; same dish, same piece count, nothing added.',
};

/** 카테고리별 질감 보존 → 한 줄 압축 (Flux용) */
function fluxTextureLine(category: string | null): string | null {
  if (!category) return null;
  if (FRIED_FOOD_CATEGORIES.has(category)) {
    return 'Keep the fried coating crispy, golden, and irregular — never smooth, soggy, dark, or plastic-looking.';
  }
  if (category === '떡볶이') {
    return 'Keep the red sauce glossy and vivid, and the rice cake shapes unchanged.';
  }
  if (category === '카페 음료' || category === '디저트') {
    return 'Keep the drink or dessert identity, fresh colors, and any visible layers unchanged.';
  }
  return null;
}

/** 음식 정체성 가드 → 한 줄 압축 (Flux용) */
const FLUX_IDENTITY_GUARD =
  'If the food is dried shredded strips (먹태/dried squid), keep their thin fibrous dried form — never turn them into fries or noodles. If it is a drink, keep its liquid form and original glass.';

/** 템플릿 고유 네거티브만 추출 (공통 텍스트 금지 목록 제외) */
function specificNegative(t: PhotoTemplate): string {
  return t.negativePromptEn.replace(`, ${COMMON_NEGATIVE_EN}`, '');
}

/** 촬영 규칙 → 압축 스타일 문단 (Flux용) */
function fluxStyleLines(t: PhotoTemplate): string {
  return [
    `Camera: ${t.cameraAngleEn}.`,
    `Background: ${t.backgroundEn}.`,
    `Surface: ${t.tableSurfaceEn}.`,
    `Lighting: ${t.lightingEn}. Color temperature: ${t.colorTemperatureEn}.`,
    `Mood: ${t.moodEn}.`,
  ].join('\n');
}

/** 스팀 규칙 → 한 줄 압축 (Flux용) */
function fluxSteamLine(level: SteamLevel): string {
  switch (level) {
    case 'strong': return 'Generous glowing backlit steam rising — a key visual element.';
    case 'medium': return 'Gentle wispy steam, softly backlit.';
    default:       return 'No steam or smoke.';
  }
}

// 시안 A 압축 (Flux) — 스타일 먼저, 소품 제한·보존은 뒤에 짧게
function buildFluxStudioPrompt(
  category: string | null,
  t: PhotoTemplate,
  preservation: PreservationMode,
): string {
  const propLine = t.requiredFoodProps.length > 0
    ? `Props: at most ONE — ${t.requiredFoodProps[0]}. No other props, no napkins, no drinks, no cutlery, no garnish on the table.`
    : 'Props: NONE — only the food and its plate or container.';

  return [
    `Re-style this food photo as a clean professional menu shot${category ? ` (${category})` : ''}.`,
    fluxStyleLines(t),
    `Composition: ${PLACEMENT_LABELS[t.foodPlacement]}; the food fills ${formatRatio(t.foodRatioA)} of the frame and is the only story.`,
    propLine,
    fluxSteamLine(t.steamLevel),
    `Keep the food itself exactly as photographed — same shape, piece count, color, and texture; never make it less appetizing. ${FLUX_FIDELITY[preservation]}`,
    fluxTextureLine(category),
    FLUX_IDENTITY_GUARD,
    `No text, letters, or logos anywhere. Avoid: ${specificNegative(t)}, distorted fingers, deformed or plastic-looking food.`,
  ].filter((s): s is string => s !== null).join('\n');
}

// 시안 B 압축 (Flux) — 공간 연출 소품을 최상단 가까이 배치
function buildFluxPremiumPrompt(
  category: string | null,
  t: PhotoTemplate,
  preservation: PreservationMode,
): string {
  const sceneList = t.sceneProps.slice(0, 5).join('; ');
  const foodList  = t.optionalFoodProps.slice(0, 2).join('; ');
  const required  = t.requiredFoodProps.join('; ');

  const propsLines = [
    required ? `Required surface/vessel: ${required}.` : null,
    sceneList
      ? `Build the scene with these styling props placed beside or behind the food, never on it: ${sceneList}.`
      : null,
    foodList ? `Plus at most TWO food props: ${foodList}.` : null,
    t.garnish.length > 0 ? `Garnish: ${t.garnish.join('; ')}.` : null,
  ].filter((s): s is string => s !== null).join('\n');

  const action = t.actionElements.length > 0
    ? `Optional action if natural: ${t.actionElements.map((el) => ACTION_LABELS[el] ?? el).join(' or ')}.`
    : null;

  return [
    `Re-style this food photo as a premium styled advertisement${category ? ` (${category})` : ''}.`,
    fluxStyleLines(t),
    `Composition: ${PLACEMENT_LABELS[t.foodPlacement]}; the food occupies ${formatRatio(t.foodRatioB)} of the frame, pulled back to show the styled scene.`,
    propsLines,
    fluxSteamLine(t.steamLevel),
    action,
    `Keep the food itself exactly as photographed — same shape, piece count, color, and texture; do not add new food dishes. ${FLUX_FIDELITY[preservation]}`,
    fluxTextureLine(category),
    FLUX_IDENTITY_GUARD,
    'No exaggerated action, flames, flying food, or splashes.',
    `No text, letters, or logos anywhere. Avoid: ${specificNegative(t)}, distorted fingers, deformed or plastic-looking food.`,
  ].filter((s): s is string => s !== null).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 프롬프트 빌더 — 모델·variant에 따라 다른 골격 사용
// ─────────────────────────────────────────────────────────────────────────────
export function buildGenerationPrompt(params: GenerationParams): string {
  const { category, template, preservation, variantIndex } = params;
  const model = params.model ?? template.preferredModel;

  if (model === 'flux') {
    return variantIndex === 0
      ? buildFluxStudioPrompt(category, template, preservation)
      : buildFluxPremiumPrompt(category, template, preservation);
  }

  return variantIndex === 0
    ? buildStudioPrompt(category, template, preservation)
    : buildPremiumPrompt(category, template, preservation);
}

// ─────────────────────────────────────────────────────────────────────────────
// 개발용 모드 공통 — variant별 구도 한 줄 요약
// ─────────────────────────────────────────────────────────────────────────────
function getCompositionLine(t: PhotoTemplate, variantIndex: 0 | 1): string {
  return variantIndex === 0
    ? `Menu-focused composition: keep the template background and mood, at most one prop, food at ${formatRatio(t.foodRatioA)} of frame.`
    : `Premium styled composition: keep the template background and mood, required props plus scene-styling props around the food, food at ${formatRatio(t.foodRatioB)} of frame.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 마스크 보존 모드 전용 프롬프트 (generate-preserve 라우트용)
// ─────────────────────────────────────────────────────────────────────────────
export function buildPreservePrompt(params: GenerationParams): string {
  const { category, template, variantIndex } = params;

  const intro = category
    ? `Food photography styling for: ${category}.`
    : `Food photography styling.`;

  return [
    intro,
    '',
    'MASK-BASED EDIT:',
    'The central food area is protected by a mask — do NOT repaint, alter, or recreate it.',
    'Only edit the unprotected transparent surrounding areas: background, table, plate surroundings, lighting, shadows, and props.',
    'Blend the preserved food naturally and seamlessly with the newly styled surroundings.',
    'The final result must look like a single professionally photographed image, not a composite.',
    '',
    buildStyleDirection(template),
    '',
    'COMPOSITION:',
    getCompositionLine(template, variantIndex),
    '',
    TEXT_PROHIBITION,
    '',
    `AVOID: ${template.negativePromptEn}`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 원본 픽셀 합성 모드 전용 프롬프트 (generate-composite 라우트용)
// ─────────────────────────────────────────────────────────────────────────────
export function buildCompositePrompt(params: GenerationParams): string {
  const { category, template, preservation, variantIndex } = params;

  const preservationPrompt = getPreservationPrompt(preservation);

  const intro = category
    ? `Professional food photography scene for: ${category}.`
    : `Professional food photography scene.`;

  return [
    intro,
    '',
    'BACKGROUND & SCENE STYLING:',
    'Create a beautifully styled scene: background, table surface, plate, lighting, shadows, and surrounding props.',
    'The food placed in the center should look natural in the composition.',
    'Focus on creating the best possible background and atmosphere for this food type.',
    '',
    ...(preservationPrompt ? ['SCENE GUIDE:', preservationPrompt, ''] : []),
    buildStyleDirection(template),
    '',
    'COMPOSITION:',
    getCompositionLine(template, variantIndex),
    '',
    TEXT_PROHIBITION,
    '',
    `AVOID: ${template.negativePromptEn}`,
  ].join('\n');
}
