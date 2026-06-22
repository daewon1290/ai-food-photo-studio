// ─────────────────────────────────────────────────────────────────────────────
// 최종 템플릿 라이브러리 (16개)
//
// 각 템플릿은 감성 문장이 아니라 구조화된 규칙으로 정의된다:
//   촬영 규칙: foodRatio(A/B) · foodPlacement · camera · background · table ·
//             lighting · colorTemperature · mood
//   소품 규칙: requiredFoodProps · optionalFoodProps(B 최대 2개) ·
//             sceneProps(B 3–5개, 템플릿 광고 컨셉의 핵심) · garnish · steam
//
// buildPrompt.ts가 이 규칙을 STYLE DIRECTION / OUTPUT SPEC으로 조립한다.
// 템플릿 차이는 배경 문장이 아니라 음식 비율·배치·테이블·소품 세트에서 나온다.
//
// A/B 구조:
//   시안 A = 음식 중심형 (foodRatioA, 소품 0–1개)
//   시안 B = 프리미엄 소품형 (foodRatioB, foodProps 최대 2 + sceneProps 3–5)
// ─────────────────────────────────────────────────────────────────────────────

export type SteamLevel = 'none' | 'medium' | 'strong';

export type FoodPlacement = 'center' | 'offset-third' | 'full-spread';

export type ActionElement =
  | 'chopsticks'
  | 'korean-spoon'
  | 'ladle'
  | 'fork'
  | 'knife'
  | 'hand-picking'
  | 'hand-pouring'
  | 'hand-holding-pot'
  | 'tongs';

export interface PhotoTemplate {
  id: string;
  nameKo: string;
  shortDescriptionKo: string;
  bestFor: string;

  // ── 촬영 규칙 (buildPrompt가 STYLE DIRECTION으로 조립) ──────────────────
  /** 시안 A 음식 점유율 범위 (%) */
  foodRatioA: [number, number];
  /** 시안 B 음식 점유율 범위 (%) */
  foodRatioB: [number, number];
  /** 음식 위치: center 정중앙 / offset-third 3분할 오프셋 / full-spread 풀프레임 */
  foodPlacement: FoodPlacement;
  cameraAngleEn: string;
  backgroundEn: string;
  tableSurfaceEn: string;
  lightingEn: string;
  colorTemperatureEn: string;
  moodEn: string;

  // ── 소품 규칙 ────────────────────────────────────────────────────────────
  /** 필수 표면·용기. A에서는 첫 항목 1개만, B에서는 전부 등장. */
  requiredFoodProps: string[];
  /** 음식 관련 소품. A 미사용 / B 최대 2개. */
  optionalFoodProps: string[];
  /** 공간 연출 소품 — 템플릿 고유 광고 컨셉. A 미사용 / B 3–5개. */
  sceneProps: string[];
  /** 가니쉬. A는 음식 위 항목만 / B 전부. */
  garnish: string[];
  steamLevel: SteamLevel;
  /** 동적 요소. 시안 B에만 선택적으로 주입. */
  actionElements: ActionElement[];

  // ── 모델·네거티브 ───────────────────────────────────────────────────────
  preferredModel: 'gpt' | 'flux';
  negativePromptEn: string;

  // ── UI 표시용 (한글) ─────────────────────────────────────────────────────
  backgroundStyleKo: string;
  lightingStyleKo: string;
  plateStyleKo: string;
  propsKo: string;
  cameraAngleKo: string;
  colorMoodKo: string;
  previewImage?: string;
  referenceImagePath?: string;
  variantLabels?: [string, string];
  variantDescriptionsKo?: [string, string];
  noticeKo?: string;
  /** 템플릿 선택 UI용 커버 이미지 경로 (public/template-covers/[id].png) */
  coverImage?: string;
  /** 커버 이미지 재생성용 텍스트→이미지 프롬프트 */
  thumbnailPrompt?: string;
  /** 출시 기본 목록에서 제외하는 실험 템플릿 */
  isExperimental?: boolean;
}

// 모든 템플릿 공통 네거티브 (buildPrompt의 Flux 압축 프롬프트가 고유 네거티브 분리에 사용)
export const COMMON_NEGATIVE_EN =
  'no text, no captions, no labels, no logo, no watermark, no Korean text, no Chinese text, no menu text, no price text, no brand names, no written content anywhere in image, no copyrighted logo reproduction, no brand package replication, finger distortion, food form collapse, excessive plastic texture, unrealistic colors';

const neg = (en: string) => `${en}, ${COMMON_NEGATIVE_EN}`;

const VARIANT_LABELS: [string, string] = ['기본 스튜디오형', '프리미엄 소품형'];
const VARIANT_A_DESC = '템플릿 배경·분위기 유지, 소품 0~1개로 음식 중심 — 깔끔한 메뉴사진.';

export const photoTemplates: PhotoTemplate[] = [
  // ───────────────────────────────────────────────────────────── 1. 배달앱
  {
    id: 'delivery-hero',
    nameKo: '배달앱 대표사진형',
    shortDescriptionKo: '밝은 단색 배경에 음식 중앙 배치, 메뉴 등록 최적화',
    bestFor: '배달의민족·쿠팡이츠 대표사진, 메뉴 등록',
    foodRatioA: [75, 85],
    foodRatioB: [60, 70],
    foodPlacement: 'center',
    cameraAngleEn: '55–65 degrees overhead — high, clear menu-photo angle',
    backgroundEn: 'pure white or bright neutral solid color — completely flat, zero texture',
    tableSurfaceEn: 'none — seamless studio backdrop; the plate sits directly on the clean background',
    lightingEn: 'even front softbox, flat and uniform, only a minimal soft shadow under the plate',
    colorTemperatureEn: '5000K neutral — clean and true-color',
    moodEn: 'product catalog clarity — zero atmosphere; the food is the only subject',
    requiredFoodProps: [],
    optionalFoodProps: [
      'small sauce dish beside the plate',
      'simple chopsticks or cutlery laid neatly beside the plate',
    ],
    sceneProps: [
      'clean white wooden tray under the plate',
      'bright folded linen napkin',
      'minimal light-gray coaster with an empty clear glass',
      'soft pastel backdrop card creating a subtle color block behind the food',
    ],
    garnish: [],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'gpt',
    negativePromptEn: neg('dark background, heavy shadows, blur, messy background, dim lighting'),
    backgroundStyleKo: '밝은 흰색 또는 밝은 단색 배경',
    lightingStyleKo: '정면 소프트박스, 균일한 밝기, 그림자 최소화',
    plateStyleKo: '흰 접시 또는 포장 용기 그대로',
    propsKo: 'A: 없음 / B: 흰 트레이·밝은 린넨·코스터',
    cameraAngleKo: '55~65도 하이앵글',
    colorMoodKo: '밝고 선명, 높은 채도',
    previewImage: '/style-examples/delivery-app.png',
    coverImage: '/template-covers/delivery-hero.png',
    thumbnailPrompt: 'Golden crispy fried chicken on a white ceramic plate. Pure white seamless studio background. Overhead 60-degree angle. Even flat softbox lighting, 5000K neutral. White wooden tray under the plate, bright folded linen napkin and a light-gray coaster with an empty clear glass beside it. Commercial food photography, no text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '흰 트레이·린넨·파스텔 배경 카드를 더한 밝은 상업 스튜디오 연출.'],
  },

  // ───────────────────────────────────────────────────── 2. 다크 프리미엄
  {
    id: 'dark-premium',
    nameKo: '다크 프리미엄·술안주형',
    shortDescriptionKo: '근검정 슬레이트와 앰버 조명, 고급 바 분위기',
    bestFor: '술안주, 고기, 치킨·튀김, 곱창, 프리미엄 야식',
    foodRatioA: [70, 80],
    foodRatioB: [55, 65],
    foodPlacement: 'offset-third',
    cameraAngleEn: '25–35 degrees — low, dramatic angle',
    backgroundEn: 'near-black void with almost no visible detail',
    tableSurfaceEn: 'near-black matte slate or rough dark stone — must read as near-black, NOT brown wood, NOT gray concrete',
    lightingEn: 'single hard 45-degree side spotlight, strong directional shadow falling away from the food',
    colorTemperatureEn: '2700K — deep amber tungsten warmth, like a bar or pub',
    moodEn: 'moody upscale bar — the frame is predominantly dark; the food is an illuminated object against darkness',
    requiredFoodProps: ['dark slate board or matte black ceramic plate'],
    optionalFoodProps: [
      'small sauce dish beside the plate',
      'garlic cloves or dried chili beside the plate',
    ],
    sceneProps: [
      'amber drink in a heavy lowball glass on a dark wooden coaster',
      'dark linen cloth draped loosely beside the board',
      'vintage brass candlestick with a softly lit candle in the background',
      'aged dark wood serving tray under the slate',
      'blurred bar bottles in the deep background',
    ],
    garnish: ['rosemary sprig or thyme laid beside food'],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'flux',
    negativePromptEn: neg('bright background, cold fluorescent light, cheap props, overexposed lighting, soggy batter'),
    backgroundStyleKo: '근검정 배경, 디테일 없는 어둠',
    lightingStyleKo: '45도 하드 사이드 스포트라이트, 방향성 그림자',
    plateStyleKo: '다크 슬레이트 보드 또는 무광 블랙 도자기',
    propsKo: 'A: 슬레이트만 / B: 위스키잔·캔들·다크 린넨·바 보틀',
    cameraAngleKo: '25~35도 로우앵글',
    colorMoodKo: '딥 앰버 2700K, 드라마틱 하이 컨트라스트',
    previewImage: '/style-examples/dark-premium.png',
    referenceImagePath: '/reference-images/dark-premium-ref.png',
    coverImage: '/template-covers/dark-premium.png',
    thumbnailPrompt: 'Crispy fried chicken on a dark matte slate board. Near-black void background. Low dramatic 30-degree angle. Single hard 45-degree amber side spotlight with strong directional shadow. Amber whiskey in a heavy lowball glass on a dark wooden coaster, vintage brass candlestick softly lit, dark linen cloth draped loosely beside. 2700K deep tungsten bar warmth. Moody upscale bar atmosphere. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '위스키 잔·캔들·다크 린넨을 더한 바 카운터 연출.'],
  },

  // ───────────────────────────────────────────────────────── 3. 매운 불맛
  {
    id: 'spicy-action',
    nameKo: '매운 불맛형',
    shortDescriptionKo: '초저앵글과 백라이트 스팀, 붉은 소스의 열기',
    bestFor: '떡볶이, 불닭, 마라, 볶음면, 닭볶음탕',
    foodRatioA: [70, 80],
    foodRatioB: [60, 70],
    foodPlacement: 'center',
    cameraAngleEn: '15–25 degrees — near-horizontal, almost at bowl level',
    backgroundEn: 'near-black with almost no detail — the background is a void',
    tableSurfaceEn: 'dark textured table surface',
    lightingEn: 'primary backlight so steam glows against the dark background; dim side fill only, no front lighting',
    colorTemperatureEn: '2500K deep amber — fire-like, dominated by the vivid red of the sauce',
    moodEn: 'intense heat and craving — the food still seems to be cooking',
    requiredFoodProps: ['dark pot or deep bowl centered in frame'],
    optionalFoodProps: [
      'small side plate with pickled radish',
      'sliced green onion in a tiny bowl',
    ],
    sceneProps: [
      'cast-iron trivet under the pot',
      'cold glass of beer or cider with condensation in the background',
      'dark linen napkin beside the pot',
      'metal chopsticks resting on a chopstick rest',
      'a few whole dried red chilies scattered sparsely on the dark table',
    ],
    garnish: ['thinly sliced green onion on top of food'],
    steamLevel: 'medium',
    actionElements: ['chopsticks', 'korean-spoon'],
    preferredModel: 'gpt',
    negativePromptEn: neg('static composition, cold looking, no sauce, soft focus'),
    backgroundStyleKo: '근검정 배경',
    lightingStyleKo: '백라이트로 스팀 강조, 정면광 없음',
    plateStyleKo: '다크 냄비 또는 깊은 그릇',
    propsKo: 'A: 냄비만 / B: 무쇠 받침·차가운 음료·마른 고추',
    cameraAngleKo: '15~25도 초저앵글',
    colorMoodKo: '딥 앰버 2500K + 붉은 소스 지배',
    previewImage: '/style-examples/spicy-fire.png',
    referenceImagePath: '/reference-images/spicy-action-ref.png',
    noticeKo: '⚠️ 프리미엄 소품형은 드라마틱한 연출을 위해 원본 그릇이 어두운 냄비로 바뀔 수 있습니다. 결과를 확인 후 사용하세요.',
    coverImage: '/template-covers/spicy-action.png',
    thumbnailPrompt: 'Glossy bright red tteokbokki in a dark ceramic pot. Near-black void background. Near-horizontal 20-degree angle. Strong backlight making steam glow against the darkness, no front lighting. Cast-iron trivet under the pot, cold beer glass with condensation in the background, scattered dried red chilies on the dark table, chopped green onion on top. 2500K deep amber. Intense heat and craving mood. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '무쇠 받침·차가운 음료 대비·마른 고추를 더한 분식 광고 연출.'],
  },

  // ─────────────────────────────────────────────── 4. 뜨거운 국물·스팀 (신규)
  {
    id: 'hot-soup',
    nameKo: '뜨거운 국물·스팀형',
    shortDescriptionKo: '백라이트로 피어오르는 김이 주인공인 탕·찌개 전용',
    bestFor: '설렁탕, 국밥, 찌개, 라면, 어묵탕',
    foodRatioA: [70, 80],
    foodRatioB: [60, 70],
    foodPlacement: 'center',
    cameraAngleEn: '25–40 degrees — slightly high, showing the surface of the broth',
    backgroundEn: 'dark warm blurred interior — cozy Korean restaurant depth',
    tableSurfaceEn: 'dark wood with visible warm grain',
    lightingEn: 'strong backlight behind the pot making rising steam glow; soft warm fill from the front',
    colorTemperatureEn: '3000K warm tungsten',
    moodEn: 'steaming comfort — the rising steam is the hero of the shot',
    requiredFoodProps: ['Korean earthenware pot (뚝배기) or stone bowl'],
    optionalFoodProps: [
      'small bowl of white rice beside the pot',
      'kimchi in a small side dish',
    ],
    sceneProps: [
      'wooden trivet under the pot',
      'Korean soup spoon resting on a spoon rest',
      'linen napkin beside the pot',
      'small ceramic teapot in the background',
      'blurred warm kitchen glow in the background',
    ],
    garnish: ['chopped scallions on the broth surface'],
    steamLevel: 'strong',
    actionElements: ['korean-spoon', 'ladle'],
    preferredModel: 'gpt',
    negativePromptEn: neg('no steam, flat cold lighting, bright clinical background, dry-looking broth'),
    backgroundStyleKo: '어둡고 따뜻한 식당 내부 블러',
    lightingStyleKo: '냄비 뒤 백라이트로 스팀 글로우',
    plateStyleKo: '뚝배기 또는 돌그릇',
    propsKo: 'A: 뚝배기만 / B: 나무 받침·국자·찻주전자',
    cameraAngleKo: '25~40도',
    colorMoodKo: '따뜻한 3000K, 김이 핵심 비주얼',
    previewImage: '/style-examples/hot-soup-steam.png',
    coverImage: '/template-covers/hot-soup.png',
    thumbnailPrompt: 'Steaming seolleongtang (Korean ox bone soup) in a Korean earthenware ddukbaegi pot. Dark warm blurred Korean restaurant interior. 30-degree angle showing the broth surface. Strong backlight behind the pot making rising steam glow dramatically. Wooden trivet under the pot, Korean soup spoon on a spoon rest, ceramic teapot in the background, linen napkin beside. 3000K warm tungsten. Rising steam is the hero of the shot. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '나무 받침·수저 받침·찻주전자를 더한 따뜻한 국밥집 연출.'],
  },

  // ───────────────────────────────────────────────────────── 5. 한상차림
  {
    id: 'korean-table-spread',
    nameKo: '한상차림형',
    shortDescriptionKo: '메인과 반찬이 프레임을 채우는 풍성한 한상',
    bestFor: '한정식, 백반, 보쌈 한상, 가족·회식 메뉴',
    foodRatioA: [80, 90],
    foodRatioB: [70, 80],
    foodPlacement: 'full-spread',
    cameraAngleEn: '45–55 degrees — high enough that all dishes are simultaneously visible',
    backgroundEn: 'warm Korean dining room, softly blurred',
    tableSurfaceEn: 'traditional warm wooden dining table with natural grain',
    lightingEn: 'soft warm directional side light, broad enough to illuminate all dishes evenly, no harsh shadows',
    colorTemperatureEn: '3800K warm natural',
    moodEn: 'abundance — a full, generous Korean table',
    requiredFoodProps: [
      'Korean tableware set — round ceramic or brass bowls',
      'chopsticks and spoon placed neatly beside the main bowl',
    ],
    optionalFoodProps: [
      'one small side dish bowl beside the main dish',
      'small soup bowl',
    ],
    sceneProps: [
      'low traditional wooden tray (소반) under the main dish',
      'linen table runner across the wooden table',
      'small ceramic teapot with a matching teacup',
      'folded cotton napkin',
      'subtle traditional Korean fabric (조각보) accent in the blurred background',
    ],
    garnish: [],
    steamLevel: 'medium',
    actionElements: ['chopsticks'],
    preferredModel: 'gpt',
    negativePromptEn: neg('no side dishes, empty feeling, Western-style plating, cold color tone'),
    backgroundStyleKo: '한식당 내부, 따뜻한 블러',
    lightingStyleKo: '따뜻한 사이드 자연광, 반찬 고른 조명',
    plateStyleKo: '한식 그릇 세트, 유기·도자기',
    propsKo: 'A: 수저만 / B: 소반·린넨 러너·찻주전자·조각보',
    cameraAngleKo: '45~55도 하이앵글',
    colorMoodKo: '따뜻한 3800K, 풍성한 색감',
    previewImage: '/style-examples/korean-full-table.png',
    noticeKo: '⚠️ 반찬이 없는 단품 사진은 AI가 반찬을 자동으로 추가할 수 있습니다. 이미 반찬이 함께 있는 사진을 사용하면 더 좋은 결과를 얻을 수 있습니다.',
    coverImage: '/template-covers/korean-table-spread.png',
    thumbnailPrompt: 'Abundant Korean table spread with crispy fried chicken as the main dish and multiple traditional side dishes in brass and ceramic bowls. Warm traditional wooden dining table. 50-degree overhead angle. Low wooden soban tray under the main dish, linen table runner, ceramic teapot with a matching teacup, traditional Korean jogakbo fabric softly blurred in background. 3800K warm natural light. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '소반·린넨 러너·찻주전자·조각보를 더한 한정식 연출.'],
  },

  // ─────────────────────────────────────────────── 6. 자연광 밝은형 (브런치 흡수)
  {
    id: 'natural-light-healthy',
    nameKo: '자연광 밝은형',
    shortDescriptionKo: '창가 자연광과 흰 표면, 건강하고 에어리한 무드',
    bestFor: '샐러드, 그레인볼, 브런치, 건강식 카페',
    foodRatioA: [65, 75],
    foodRatioB: [50, 60],
    foodPlacement: 'center',
    cameraAngleEn: '55–65 degrees, or flat lay at 75–85 degrees',
    backgroundEn: 'bright airy café interior, nearly overexposed in the far background',
    tableSurfaceEn: 'bright white marble or painted white wood — never dark, never brown',
    lightingEn: 'single directional window light from the left, creating a soft gentle shadow to the right',
    colorTemperatureEn: '5600K daylight — cool, fresh, clean white',
    moodEn: 'high-key bright and airy — a café window seat',
    requiredFoodProps: ['white ceramic plate or natural wooden bowl'],
    optionalFoodProps: [
      'small glass jar of dressing',
      'thin citrus slice on a tiny side dish',
    ],
    sceneProps: [
      'small potted green plant beside the plate',
      'folded beige linen napkin',
      'clear glass of water with condensation',
      'light wood cutting board layered under the plate',
      'soft white curtain glow in the blurred background',
    ],
    garnish: ['fresh herb leaves', 'thin citrus or fruit slice'],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'gpt',
    negativePromptEn: neg('dim lighting, muddy colors, heavy props, fluorescent lighting'),
    backgroundStyleKo: '밝고 에어리한 카페 내부',
    lightingStyleKo: '왼쪽 창문 자연광, 부드러운 그림자',
    plateStyleKo: '흰 세라믹 접시 또는 우드 볼',
    propsKo: 'A: 접시만 / B: 화분·린넨·물컵·밝은 도마',
    cameraAngleKo: '55~65도 또는 플랫레이',
    colorMoodKo: '데이라이트 5600K, 하이키 밝음',
    previewImage: '/style-examples/bright-natural.png',
    coverImage: '/template-covers/natural-light-healthy.png',
    thumbnailPrompt: 'Fresh grain bowl salad with colorful vegetables on a white ceramic plate. Bright white marble table. 55-degree overhead angle. Single directional window light from the left creating a soft gentle shadow to the right. Small potted green plant beside the plate, folded beige linen napkin, clear glass of water with condensation, light wood cutting board layered under the plate. 5600K daylight. High-key bright airy café window atmosphere. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '화분·린넨·물방울 유리컵을 더한 카페 창가 연출.'],
  },

  // ───────────────────────────────────────────────────── 7. 카페 음료 (신규)
  {
    id: 'cafe-drink',
    nameKo: '카페 음료형',
    shortDescriptionKo: '글라스의 투명함과 레이어가 살아나는 음료 전용',
    bestFor: '아이스 음료, 라테, 주스, 스무디, 에이드',
    foodRatioA: [65, 75],
    foodRatioB: [55, 65],
    foodPlacement: 'center',
    cameraAngleEn: '20–40 degrees — near eye level so the glass and its layers read clearly',
    backgroundEn: 'bright neutral café wall or soft warm tone, softly blurred',
    tableSurfaceEn: 'light wood or white marble café table',
    lightingEn: 'soft window light passing through the glass, creating a glowing transparent effect',
    colorTemperatureEn: '5000K clean daylight',
    moodEn: 'fresh café menu — the drink glows from within',
    requiredFoodProps: ['clear glassware with the original ice, layers, or crema preserved'],
    optionalFoodProps: [
      'small dessert on a side plate',
      'tiny syrup jar',
    ],
    sceneProps: [
      'wooden or stone coaster under the glass',
      'paper straw',
      'small bud vase with a single stem',
      'open book or magazine corner blurred at the frame edge',
      'soft window light pattern falling on the table',
    ],
    garnish: ['mint sprig', 'thin citrus slice on the rim'],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'gpt',
    negativePromptEn: neg('melted ice, spilled liquid, dull flat drink, drink transformed into solid food'),
    backgroundStyleKo: '밝은 카페 벽, 소프트 블러',
    lightingStyleKo: '유리를 통과하는 창문 빛',
    plateStyleKo: '투명 글라스 그대로',
    propsKo: 'A: 글라스만 / B: 코스터·스트로·꽃병·책',
    cameraAngleKo: '20~40도 아이레벨',
    colorMoodKo: '클린 데이라이트 5000K',
    previewImage: '/style-examples/cafe-drink.png',
    coverImage: '/template-covers/cafe-drink.png',
    thumbnailPrompt: 'Iced latte with distinct cream layers in a tall clear glass. Bright neutral café wall softly blurred in background. Near eye-level 30-degree angle. Soft window light glowing through the glass creating a transparent luminous effect. Wooden coaster under the glass, paper straw, small bud vase with a single flower, corner of an open book blurred at the frame edge. 5000K clean daylight. The drink glows from within. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '코스터·스트로·꽃병을 더한 카페 테이블 연출.'],
  },

  // ───────────────────────────────────────────────── 8. 파인다이닝 (신규)
  {
    id: 'fine-dining',
    nameKo: '파인다이닝 단품형',
    shortDescriptionKo: '넓은 여백과 한 접시 — 조용한 고급스러움',
    bestFor: '스테이크, 코스 요리, 오마카세, 특선 메뉴',
    foodRatioA: [45, 60],
    foodRatioB: [30, 45],
    foodPlacement: 'center',
    cameraAngleEn: '45–55 degrees, formal and restrained',
    backgroundEn: 'deep neutral dark tone, completely uncluttered',
    tableSurfaceEn: 'matte dark stone or deep charcoal linen tablecloth',
    lightingEn: 'soft single directional light with gentle falloff and refined shadows',
    colorTemperatureEn: '4000K neutral warm',
    moodEn: 'quiet luxury — vast negative space, one perfect plate',
    requiredFoodProps: ['oversized matte plate — black or white — with the food composed at its center'],
    optionalFoodProps: ['tiny sauce pot beside the plate'],
    sceneProps: [
      'fine cutlery aligned precisely beside the plate',
      'crisp folded napkin',
      'wine glass blurred in the background',
      'single low candle',
      'subtle stone texture visible around the plate',
    ],
    garnish: ['microgreens', 'sauce dots placed with precision', 'single edible flower'],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'flux',
    negativePromptEn: neg('crowded frame, casual tableware, bright cheerful colors, fast-food look'),
    backgroundStyleKo: '딥 뉴트럴 다크, 완전한 무배경',
    lightingStyleKo: '부드러운 단일 방향광, 정제된 그림자',
    plateStyleKo: '오버사이즈 무광 플레이트 (블랙/화이트)',
    propsKo: 'A: 플레이트만 / B: 파인 커틀러리·와인잔·캔들',
    cameraAngleKo: '45~55도, 절제된 구도',
    colorMoodKo: '뉴트럴 웜 4000K, 여백이 주인공',
    previewImage: '/style-examples/fine-dining-single.png',
    coverImage: '/template-covers/fine-dining.png',
    thumbnailPrompt: 'Crispy fried chicken elegantly plated at the center of an oversized matte black plate. Deep neutral dark background, completely uncluttered with vast negative space. Formal 50-degree angle. Soft single directional light with gentle falloff and refined shadows. Fine cutlery aligned precisely beside the plate, crisp folded napkin, wine glass blurred in the deep background, single low candle. 4000K neutral warm. Quiet luxury — one perfect plate. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '파인 커틀러리·와인잔·캔들을 더한 코스 레스토랑 연출.'],
  },

  // ─────────────────────────────────────────────── 9. 칵테일·하이볼 바 (신규)
  {
    id: 'cocktail-bar',
    nameKo: '칵테일·하이볼 바형',
    shortDescriptionKo: '다크 바 카운터와 보케 조명 속 음료',
    bestFor: '하이볼, 칵테일, 와인, 수제맥주',
    foodRatioA: [65, 75],
    foodRatioB: [55, 65],
    foodPlacement: 'offset-third',
    cameraAngleEn: '10–30 degrees — eye level at the bar counter',
    backgroundEn: 'dark bar with warm bokeh lights and blurred bottle shelves',
    tableSurfaceEn: 'polished dark wood bar counter with subtle reflections',
    lightingEn: 'warm backbar glow plus a soft key light on the glass',
    colorTemperatureEn: '2700K amber',
    moodEn: 'after-hours bar — the drink is jewelry against the dark',
    requiredFoodProps: ['premium glassware appropriate to the drink — highball, coupe, or rocks glass'],
    optionalFoodProps: ['small snack dish beside the glass'],
    sceneProps: [
      'dark stone or leather coaster',
      'bar spoon or jigger placed beside the glass',
      'blurred backbar bottles with bokeh',
      'single candle or low amber lamp',
      'ice bucket edge in the background',
    ],
    garnish: ['citrus peel twist', 'herb sprig', 'cocktail cherry'],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'flux',
    negativePromptEn: neg('bright daylight, plastic cups, cluttered bar, washed-out colors'),
    backgroundStyleKo: '다크 바, 보케 조명과 보틀 셸프 블러',
    lightingStyleKo: '백바 글로우 + 글라스 키 라이트',
    plateStyleKo: '프리미엄 글라스웨어',
    propsKo: 'A: 글라스만 / B: 코스터·지거·바 보틀·캔들',
    cameraAngleKo: '10~30도 아이레벨',
    colorMoodKo: '앰버 2700K, 어둠 속 보석 같은 음료',
    previewImage: '/style-examples/cocktail-highball.png',
    coverImage: '/template-covers/cocktail-bar.png',
    thumbnailPrompt: 'Premium highball cocktail with ice and citrus garnish in a tall highball glass. Dark polished wood bar counter with subtle reflections. Eye-level 20-degree angle. Warm backbar amber glow and blurred bottle shelves with bokeh. Dark stone coaster, bar jigger placed beside the glass, single amber candle, ice bucket edge in the background. Citrus peel twist garnish on the rim. 2700K amber. The drink is jewelry against the dark. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '코스터·바 스푼·보케 보틀을 더한 바 카운터 연출.'],
  },

  // ───────────────────────────────────────────── 10. 화이트 미니멀 디저트 (신규)
  {
    id: 'white-dessert',
    nameKo: '화이트 미니멀 디저트형',
    shortDescriptionKo: '새하얀 배경 위 디저트 색이 유일한 악센트',
    bestFor: '케이크, 마카롱, 초콜릿, 베이커리',
    foodRatioA: [60, 70],
    foodRatioB: [50, 60],
    foodPlacement: 'center',
    cameraAngleEn: 'flat lay at 75–85 degrees, or 45 degrees',
    backgroundEn: 'pure white seamless, bright and soft',
    tableSurfaceEn: 'white marble or white painted wood',
    lightingEn: 'bright soft diffused light with delicate shadows',
    colorTemperatureEn: '5300K clean bright',
    moodEn: 'delicate patisserie — the dessert color is the only accent on white',
    requiredFoodProps: ['white or pastel fine ceramic plate'],
    optionalFoodProps: [
      'small dessert fork beside the plate',
      'tiny jam or cream jar',
    ],
    sceneProps: [
      'white lace or linen cloth partially under the plate',
      'dried flower stem',
      'thin ribbon laid loosely on the surface',
      'vintage silver teaspoon',
      'small white bud vase',
    ],
    garnish: ['fresh berries', 'mint leaf', 'light dusting of sugar powder'],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'gpt',
    negativePromptEn: neg('dark moody tones, heavy rustic props, greasy look, saturated backgrounds'),
    backgroundStyleKo: '퓨어 화이트 심리스',
    lightingStyleKo: '밝고 부드러운 확산광',
    plateStyleKo: '화이트·파스텔 도자기 접시',
    propsKo: 'A: 접시만 / B: 레이스·드라이플라워·리본·빈티지 스푼',
    cameraAngleKo: '플랫레이 또는 45도',
    colorMoodKo: '클린 브라이트 5300K',
    previewImage: '/style-examples/white-minimal-dessert.png',
    coverImage: '/template-covers/white-dessert.png',
    thumbnailPrompt: 'Pastel macarons in three colors arranged on a white fine ceramic plate. Pure white seamless background. Flat lay overhead shot. Bright soft diffused light with delicate subtle shadows. White lace cloth partially under the plate, dried flower stem beside it, thin ribbon laid loosely on the surface, vintage silver teaspoon, small white bud vase. 5300K clean bright. Delicate patisserie — the macaron colors are the only accent on white. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '레이스·드라이플라워·리본을 더한 파티세리 연출.'],
  },

  // ─────────────────────────────────────────────── 11. 바비큐·그릴 (신규)
  {
    id: 'bbq-grill',
    nameKo: '바비큐·그릴형',
    shortDescriptionKo: '숯불과 연기, 그릴 위에서 막 구워진 순간',
    bestFor: '삼겹살, 갈비, 해산물 구이, 통닭 구이',
    foodRatioA: [70, 80],
    foodRatioB: [60, 70],
    foodPlacement: 'center',
    cameraAngleEn: '20–40 degrees — close to the grill surface',
    backgroundEn: 'dark smoky outdoor or open kitchen, embers glowing softly',
    tableSurfaceEn: 'grill grate or seasoned cast-iron over charcoal',
    lightingEn: 'warm ember glow from below plus a directional key light; light smoke catching the light',
    colorTemperatureEn: '3000K fire warm',
    moodEn: 'live fire craft — char, smoke, and heat',
    requiredFoodProps: ['grill grate or cast-iron pan holding the food'],
    optionalFoodProps: [
      'ssam vegetable basket',
      'dipping sauce bowl',
    ],
    sceneProps: [
      'glowing charcoal embers visible below or beside the grill',
      'long metal tongs resting at the grill edge',
      'cold beer glass or can in the background',
      'metal serving tray',
      'coarse salt scattered on a side board',
    ],
    garnish: ['grilled garlic cloves', 'charred scallion'],
    steamLevel: 'medium',
    actionElements: ['tongs'],
    preferredModel: 'flux',
    negativePromptEn: neg('raw-looking meat, cold lighting, indoor studio feel, no fire context'),
    backgroundStyleKo: '어두운 야외·오픈키친, 숯불 글로우',
    lightingStyleKo: '아래에서 올라오는 숯불 빛 + 키 라이트',
    plateStyleKo: '그릴 그레이트 또는 무쇠팬',
    propsKo: 'A: 그릴만 / B: 숯·집게·맥주·굵은소금',
    cameraAngleKo: '20~40도, 그릴 가까이',
    colorMoodKo: '파이어 웜 3000K, 연기와 열기',
    noticeKo: '⚠️ [실험 템플릿] 그릴 컨텍스트가 강해 구운 닭처럼 보이는 등 음식 변형 위험이 높습니다. 구이류(삼겹살·갈비) 전용으로만 사용하세요.',
    isExperimental: true,
    previewImage: '/style-examples/bbq-grill.png',
    coverImage: '/template-covers/bbq-grill.png',
    thumbnailPrompt: 'Samgyeopsal (Korean pork belly) sizzling on a cast-iron grill grate. Dark smoky atmosphere with glowing charcoal embers visible below the grill. Low 30-degree angle close to the grill surface. Warm ember glow from below plus a directional key light, light smoke catching the light. Metal tongs resting at the grill edge, cold beer can in the background, coarse salt scattered on a side board. 3000K fire warm. Char, smoke, and heat. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '숯불 글로우·집게·차가운 맥주를 더한 화로 연출.'],
  },

  // ───────────────────────────────────────────── 12. 손동작 라이브 (소스붓기 흡수)
  {
    id: 'hand-action',
    nameKo: '손동작 라이브형',
    shortDescriptionKo: '음식을 집거나 소스를 붓는 생동감 있는 순간',
    bestFor: '릴스·쇼츠 썸네일, 상세페이지, 스토리 콘텐츠',
    foodRatioA: [70, 80],
    foodRatioB: [60, 70],
    foodPlacement: 'offset-third',
    cameraAngleEn: '5–20 degrees — near eye-level, almost at table height',
    backgroundEn: 'natural dining room or kitchen, warmly blurred',
    tableSurfaceEn: 'natural wooden dining table',
    lightingEn: 'warm ambient room light with a slight rim light behind the food',
    colorTemperatureEn: '3500K warm natural',
    moodEn: 'a real moment at the table — caught mid-meal, not staged',
    requiredFoodProps: ['chopsticks or appropriate utensil clearly visible in frame'],
    optionalFoodProps: ['small dipping sauce dish'],
    sceneProps: [
      'wooden cutting board under the plate',
      'neatly folded kitchen cloth beside the plate',
      'warm ceramic teacup in the background',
      'soft warm lamp glow in the blurred background',
    ],
    garnish: [],
    steamLevel: 'none',
    actionElements: ['hand-picking', 'chopsticks', 'hand-pouring'],
    preferredModel: 'gpt',
    negativePromptEn: neg('unnatural hand shape, extreme hand close-up, static composition'),
    backgroundStyleKo: '자연스러운 식탁·주방 배경',
    lightingStyleKo: '따뜻한 실내광 + 음식 뒤 림라이트',
    plateStyleKo: '실제 사용 접시 그대로',
    propsKo: 'A: 젓가락만 / B: 도마·키친 클로스·찻잔·램프',
    cameraAngleKo: '5~20도, 식탁 높이',
    colorMoodKo: '따뜻한 3500K, 생활감',
    previewImage: '/style-examples/sauce-action-live.png',
    coverImage: '/template-covers/hand-action.png',
    thumbnailPrompt: 'A hand using chopsticks to pick up a piece of crispy fried chicken from a plate. Natural warm dining room softly blurred in background. Near eye-level 15-degree angle. Warm ambient room light with a slight rim light behind the food. Wooden cutting board under the plate, neatly folded kitchen cloth beside it, warm ceramic teacup in the background, soft warm lamp glow in the blur. 3500K warm natural. A real moment caught mid-meal. No text, no logos.',
    variantLabels: ['기본 스튜디오형', '프리미엄 소품형 ⚠️'],
    variantDescriptionsKo: [
      VARIANT_A_DESC,
      '⚠️ 실험적 — 도마·램프 연출에 손동작(집기·소스 붓기)을 더합니다. 원본에 손이 없으면 AI가 새 손을 생성하며 왜곡이 생길 수 있습니다. 결과를 반드시 확인하세요.',
    ],
  },

  // ─────────────────────────────────────────── 13. 시즌·선물세트 (신규, 통합)
  {
    id: 'season-gift',
    nameKo: '시즌·선물세트형',
    shortDescriptionKo: '선물 박스와 계절 소품 — 음식을 선물처럼',
    bestFor: '명절 선물세트, 크리스마스·발렌타인 시즌, 프리미엄 패키지',
    foodRatioA: [60, 70],
    foodRatioB: [45, 60],
    foodPlacement: 'center',
    cameraAngleEn: '30–45 degrees',
    backgroundEn: 'deep festive dark with soft string-light bokeh',
    tableSurfaceEn: 'dark wood with a seasonal fabric runner',
    lightingEn: 'warm candle-like key light with gentle sparkle highlights',
    colorTemperatureEn: '3000K warm festive',
    moodEn: 'premium gift — the food presented as a present',
    requiredFoodProps: ['wooden gift box or premium packaging tray holding the food'],
    optionalFoodProps: ['small condiment jar set inside the box'],
    sceneProps: [
      'low dry-ice fog drifting around the box',
      'fresh seasonal flowers',
      'satin ribbon laid across the corner',
      'lit candles',
      'pine cones or seasonal greens',
      'string-light bokeh in the background',
    ],
    garnish: ['decorative seasonal greens'],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'flux',
    negativePromptEn: neg('plain everyday table, harsh daylight, cluttered random props'),
    backgroundStyleKo: '딥 다크 + 스트링라이트 보케',
    lightingStyleKo: '캔들 톤 키 라이트, 스파클 하이라이트',
    plateStyleKo: '나무 선물 박스·프리미엄 패키지',
    propsKo: 'A: 박스만 / B: 드라이아이스·생화·리본·캔들·솔방울',
    cameraAngleKo: '30~45도',
    colorMoodKo: '웜 페스티브 3000K',
    noticeKo: '⚠️ 선물 박스·패키지에 담긴 사진에 최적화되어 있습니다.',
    previewImage: '/style-examples/season-gift-set.png',
    coverImage: '/template-covers/season-gift.png',
    thumbnailPrompt: 'Premium Korean food gift set beautifully arranged in an open wooden gift box. Deep dark festive background with warm string-light bokeh. 35-degree angle. Warm candle-like key light with gentle sparkle highlights. Low dry-ice fog drifting around the box, fresh seasonal flowers, satin ribbon laid across the corner, lit candles, pine cones and seasonal greens. 3000K warm festive. Food presented as a premium gift. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '드라이아이스·생화·리본·캔들을 더한 프리미엄 선물 연출.'],
  },

  // ───────────────────────────────────────────── 14. 누끼·단색 배경 (신규)
  {
    id: 'cutout-solid',
    nameKo: '누끼·단색 배경형',
    shortDescriptionKo: '메뉴판·인쇄물용 — 흰 배경(A) 또는 단색 컬러(B)',
    bestFor: '메뉴판, POS, 인쇄물, 썸네일 그래픽 소스',
    foodRatioA: [75, 85],
    foodRatioB: [70, 80],
    foodPlacement: 'center',
    cameraAngleEn: '50–60 degrees overhead',
    backgroundEn: 'flawless seamless solid-color backdrop — bright white, zero texture',
    tableSurfaceEn: 'none — seamless backdrop; only a subtle contact shadow grounds the food',
    lightingEn: 'perfectly even studio light, crisp clean edges around the food',
    colorTemperatureEn: '5000K neutral',
    moodEn: 'clean cutout for menu boards — graphic, precise, commercial',
    requiredFoodProps: [],
    optionalFoodProps: ['single set of minimal cutlery placed graphically'],
    sceneProps: [
      'swap the backdrop to one bold saturated solid brand color',
      'one hard-edged graphic shadow cast deliberately',
      'geometric paper shapes in the same color family',
      'low display podium under the plate',
    ],
    garnish: [],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'gpt',
    negativePromptEn: neg('background texture, gradients, messy shadows, atmospheric mood, complex scene'),
    backgroundStyleKo: 'A: 퓨어 화이트 / B: 강한 단색 컬러',
    lightingStyleKo: '완전 균일 스튜디오 광',
    plateStyleKo: '접시 또는 용기 그대로',
    propsKo: 'A: 없음 / B: 기하 도형·포디움·그래픽 섀도',
    cameraAngleKo: '50~60도 하이앵글',
    colorMoodKo: '뉴트럴 5000K, 그래픽·커머셜',
    previewImage: '/style-examples/cutout-solid-background.png',
    coverImage: '/template-covers/cutout-solid.png',
    thumbnailPrompt: 'Crispy fried chicken on a white ceramic plate against a bold vibrant cobalt blue seamless solid-color background. Overhead 55-degree angle. Perfectly even studio light with a single hard-edged graphic shadow cast deliberately. A geometric paper shape in the same blue color family beside the plate. Graphic, precise, and bold commercial product shot. 5000K neutral. No text, no logos.',
    variantLabels: ['흰 배경 누끼형', '단색 컬러 그래픽형'],
    variantDescriptionsKo: [
      '완전한 흰 배경에 음식만 — 메뉴판·인쇄물에 바로 쓰는 누끼 스타일.',
      '강한 단색 배경 + 기하 도형·그래픽 섀도 — SNS 광고형 그래픽 컷.',
    ],
  },

  // ─────────────────────────────────────────── 15. 포장·배달 박스 (신규)
  {
    id: 'package-delivery',
    nameKo: '포장·배달 박스형',
    shortDescriptionKo: '포장 용기째로 먹음직스럽게 — 배달 전문점용',
    bestFor: '배달 전문점, 포장 메뉴, 도시락, 밀키트',
    foodRatioA: [70, 80],
    foodRatioB: [60, 70],
    foodPlacement: 'center',
    cameraAngleEn: '30–45 degrees',
    backgroundEn: 'warm restaurant kitchen counter, softly blurred',
    tableSurfaceEn: 'light wood or stainless kitchen counter',
    lightingEn: 'bright warm practical light — clean and appetizing',
    colorTemperatureEn: '4000K warm white',
    moodEn: 'fresh out of the kitchen, ready for delivery',
    requiredFoodProps: ['open delivery container or packaging showing the food clearly'],
    optionalFoodProps: [
      'sauce packets arranged on a small tray',
      'lidded drink cup beside the container',
    ],
    sceneProps: [
      'kraft paper sheet under the container',
      'plain paper bag standing behind (no text or logos)',
      'folded paper napkins',
      'wooden serving board',
      'blurred kitchen pass in the background',
    ],
    garnish: [],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'gpt',
    negativePromptEn: neg('fancy plating, fine-dining mood, dark dramatic lighting, text or logos on packaging'),
    backgroundStyleKo: '따뜻한 주방 카운터 블러',
    lightingStyleKo: '밝고 따뜻한 실용광',
    plateStyleKo: '포장 용기·배달 박스 그대로',
    propsKo: 'A: 용기만 / B: 크라프트지·종이백·냅킨',
    cameraAngleKo: '30~45도',
    colorMoodKo: '웜 화이트 4000K',
    noticeKo: '⚠️ 포장 용기에 담긴 사진에 최적화되어 있습니다.',
    previewImage: '/style-examples/delivery-package-box.png',
    coverImage: '/template-covers/package-delivery.png',
    thumbnailPrompt: 'Crispy fried chicken clearly visible in an open delivery container. Warm restaurant kitchen counter softly blurred in background. 35-degree angle. Bright warm practical lighting, clean and appetizing. Kraft paper sheet under the container, plain paper bag standing behind (no text or logos on the bag), folded paper napkins beside, wooden serving board. 4000K warm white. Fresh out of the kitchen, ready for delivery. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '크라프트지·종이백·냅킨을 더한 포장대 연출.'],
  },

  // ─────────────────────────────────────────── 16. 원물·신선 재료 (신규)
  {
    id: 'raw-ingredient',
    nameKo: '원물·신선 재료형',
    shortDescriptionKo: '조리 전 원물의 신선함 — 정육·수산·청과용',
    bestFor: '정육점, 수산물, 청과, 밀키트 재료',
    foodRatioA: [70, 80],
    foodRatioB: [55, 65],
    foodPlacement: 'center',
    cameraAngleEn: '40–60 degrees',
    backgroundEn: 'dark cool-toned stone or butcher-shop counter, softly blurred',
    tableSurfaceEn: 'dark slate or thick butcher block',
    lightingEn: 'crisp directional light emphasizing freshness and texture — slightly cool',
    colorTemperatureEn: '4500K crisp neutral',
    moodEn: 'market-fresh quality — the raw product as the hero',
    requiredFoodProps: ['butcher paper or slate board under the raw product'],
    optionalFoodProps: [
      'small dish of coarse salt',
      'fresh herb bundle',
    ],
    sceneProps: [
      'crushed ice bed beneath (for seafood)',
      'butcher knife laid flat beside',
      'rough linen cloth',
      'wooden crate edge at the frame border',
      'scattered whole peppercorns',
    ],
    garnish: ['single herb sprig'],
    steamLevel: 'none',
    actionElements: [],
    preferredModel: 'flux',
    negativePromptEn: neg('cooked appearance, dull gray meat, plastic wrap glare, warm yellow cast'),
    backgroundStyleKo: '다크 쿨톤 스톤·정육점 카운터',
    lightingStyleKo: '신선함 강조하는 크리스프 방향광',
    plateStyleKo: '부처 페이퍼 또는 슬레이트',
    propsKo: 'A: 보드만 / B: 얼음·나이프·린넨·통후추',
    cameraAngleKo: '40~60도',
    colorMoodKo: '크리스프 뉴트럴 4500K',
    noticeKo: '⚠️ 조리 전 원물(생고기·해산물·과일 등) 사진에 최적화되어 있습니다.',
    previewImage: '/style-examples/fresh-ingredients.png',
    coverImage: '/template-covers/raw-ingredient.png',
    thumbnailPrompt: 'Premium fresh Korean beef (hanwoo sirloin) on butcher paper over a dark slate board. Dark cool-toned stone butcher-shop counter softly blurred. 50-degree angle. Crisp directional light with a slightly cool tone emphasizing freshness and texture. Butcher knife laid flat beside the meat, rough linen cloth, wooden crate edge at the frame border, scattered whole black peppercorns. 4500K crisp neutral. Market-fresh quality — the raw product as the hero. No text, no logos.',
    variantLabels: VARIANT_LABELS,
    variantDescriptionsKo: [VARIANT_A_DESC, '얼음·나이프·린넨·통후추를 더한 마켓 연출.'],
  },
];
