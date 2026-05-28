import { PhotoTemplate } from './photoTemplates';
import { PlatformPreset, isInstagram, isDeliveryApp } from './platformPresets';

export type CaptionTone =
  | '깔끔한 홍보형'
  | '감성형'
  | '동네 사장님형'
  | '짧고 강한 후킹형'
  | '재미형'
  | '고급 브랜드형';

export const captionTones: CaptionTone[] = [
  '깔끔한 홍보형',
  '감성형',
  '동네 사장님형',
  '짧고 강한 후킹형',
  '재미형',
  '고급 브랜드형',
];

export interface CaptionResult {
  title: string;
  captions: string[];
  hashtags?: string[];
  menuDescription?: string;
}

const hashtagsByCategory: Record<string, string[]> = {
  '후라이드 치킨': [
    '#후라이드치킨',
    '#치킨맛집',
    '#바삭치킨',
    '#치킨스타그램',
    '#오늘치킨',
    '#야식',
    '#치킨집',
    '#먹스타그램',
  ],
  양념치킨: [
    '#양념치킨',
    '#달콤매콤',
    '#치킨맛집',
    '#치킨스타그램',
    '#야식추천',
    '#주말치킨',
    '#먹스타그램',
  ],
  닭강정: [
    '#닭강정',
    '#달콤바삭',
    '#분식맛집',
    '#닭강정맛집',
    '#간식스타그램',
    '#먹스타그램',
    '#치킨',
  ],
  떡볶이: [
    '#떡볶이',
    '#매콤달콤',
    '#분식맛집',
    '#떡볶이맛집',
    '#국민간식',
    '#먹스타그램',
    '#매운음식',
    '#분식',
  ],
  돈가스: [
    '#돈가스',
    '#돈까스맛집',
    '#바삭돈가스',
    '#점심메뉴',
    '#가성비맛집',
    '#먹스타그램',
    '#일식',
  ],
  '카페 음료': [
    '#카페스타그램',
    '#커피그램',
    '#카페투어',
    '#음료스타그램',
    '#카페',
    '#커피',
    '#카페라떼',
    '#카페인',
  ],
  디저트: [
    '#디저트스타그램',
    '#디저트맛집',
    '#달달한거',
    '#케이크스타그램',
    '#카페디저트',
    '#먹스타그램',
    '#달콤',
  ],
};

const captionsByTone: Record<CaptionTone, (category: string) => string[]> = {
  '깔끔한 홍보형': (c) => [
    `${c}, 이제 사진으로 먼저 맛보세요. 정성껏 준비했습니다.`,
    `매일 신선한 재료로 만드는 ${c}. 한 번 드셔보시면 압니다.`,
    `우리 ${c}의 자신감. 사진 속에 고스란히 담았습니다.`,
  ],
  감성형: (c) => [
    `오늘 하루도 수고했어요. 따뜻한 ${c} 한 입 어떠세요?`,
    `특별한 날이 아니어도 괜찮아요. 그냥 맛있고 싶은 날, ${c}.`,
    `가게 문 열고 제일 먼저 하는 일, 오늘도 정성껏 ${c} 준비하기.`,
  ],
  '동네 사장님형': (c) => [
    `저희 ${c} 진짜 맛있어요. 안 드셔보신 분들 후회하실 거예요.`,
    `우리 동네 최고 ${c}라고 자신합니다! 한번 와보세요~`,
    `사장이 직접 만드는 ${c}. 뭐가 들어갔는지는 비밀입니다.`,
  ],
  '짧고 강한 후킹형': (c) => [
    `지금 이 ${c}, 안 보이세요?`,
    `오늘 저녁 고민 끝. ${c}.`,
    `먹어봤어요? 이 ${c}? 아직이면 늦은 거예요.`,
  ],
  재미형: (c) => [
    `다이어트는 내일부터. 오늘은 ${c}!`,
    `${c} 앞에서 이성을 잃는 건 저뿐인가요?`,
    `눈으로 먼저 먹는 ${c}. 근데 눈만으로는 부족해요.`,
  ],
  '고급 브랜드형': (c) => [
    `엄선된 재료, 일관된 품질. 우리의 ${c}는 타협하지 않습니다.`,
    `${c}가 예술이 되는 순간. 저희 주방에서만 경험할 수 있습니다.`,
    `진정한 ${c}의 가치를 아는 분들을 위해.`,
  ],
};

const titleByTone: Record<CaptionTone, (c: string) => string> = {
  '깔끔한 홍보형': (c) => `정성을 담은 ${c}`,
  감성형: (c) => `오늘의 ${c}`,
  '동네 사장님형': (c) => `우리 가게 ${c}`,
  '짧고 강한 후킹형': (c) => `이 ${c}, 실화?`,
  재미형: (c) => `${c}에 진심인 편`,
  '고급 브랜드형': (c) => `Premium ${c}`,
};

const menuDescriptionByTone: Record<CaptionTone, (c: string) => string> = {
  '깔끔한 홍보형': (c) =>
    `매일 신선한 재료로 정성껏 만드는 ${c}. 바삭하고 풍부한 맛이 일품입니다.`,
  감성형: (c) => `한 입 먹으면 기분이 좋아지는 ${c}. 따뜻한 마음으로 준비했습니다.`,
  '동네 사장님형': (c) =>
    `사장님이 직접 만드는 ${c}. 재료 타협 없이 최고로 드립니다.`,
  '짧고 강한 후킹형': (c) =>
    `바삭하고 맛있는 ${c}. 한 번 드시면 계속 생각납니다.`,
  재미형: (c) =>
    `먹다 보면 어느새 다 없어지는 ${c}. 양이 아쉬울 수도 있어요.`,
  '고급 브랜드형': (c) =>
    `엄선된 재료와 정통 레시피로 완성한 프리미엄 ${c}.`,
};

export function generateCaptions(
  category: string,
  _template: PhotoTemplate,
  platform: PlatformPreset,
  tone: CaptionTone,
): CaptionResult {
  const captions = captionsByTone[tone]?.(category) ?? [
    `${category} 맛있게 드세요!`,
    `신선한 재료로 만든 ${category}`,
    `오늘도 맛있는 ${category}`,
  ];

  const title = titleByTone[tone]?.(category) ?? `${category}`;

  const result: CaptionResult = { title, captions };

  if (isInstagram(platform)) {
    result.hashtags = hashtagsByCategory[category] ?? ['#음식', '#맛집', '#먹스타그램'];
  }

  if (isDeliveryApp(platform)) {
    result.menuDescription =
      menuDescriptionByTone[tone]?.(category) ?? `맛있는 ${category}`;
  }

  return result;
}
