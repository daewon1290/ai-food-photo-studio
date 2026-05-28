export interface PhotoTemplate {
  id: string;
  nameKo: string;
  shortDescriptionKo: string;
  bestFor: string;
  backgroundStyleKo: string;
  lightingStyleKo: string;
  plateStyleKo: string;
  propsKo: string;
  cameraAngleKo: string;
  colorMoodKo: string;
  previewImage?: string;
  promptKo: string;
  promptEn: string;
  negativePromptKo: string;
  negativePromptEn: string;
}

// 모든 템플릿에 공통으로 적용되는 네거티브 프롬프트
const COMMON_NEGATIVE_KO =
  '저작권 있는 로고 복제 금지, 특정 브랜드 패키지 복제 금지, 손가락 왜곡, 음식 형태 붕괴, 과도한 플라스틱 질감, 비현실적인 색감, 텍스트 깨짐, 워터마크';

const COMMON_NEGATIVE_EN =
  'no copyrighted logo reproduction, no brand package replication, finger distortion, food form collapse, excessive plastic texture, unrealistic colors, broken text artifacts, watermark';

const neg = (ko: string, en: string) => ({
  negativePromptKo: `${ko}, ${COMMON_NEGATIVE_KO}`,
  negativePromptEn: `${en}, ${COMMON_NEGATIVE_EN}`,
});

export const photoTemplates: PhotoTemplate[] = [
  {
    id: 'delivery-hero',
    nameKo: '배달앱 대표사진형',
    shortDescriptionKo: '밝은 단색 배경에 음식 중앙 배치, 텍스트 여백 확보',
    bestFor: '배달의민족·쿠팡이츠 대표사진, 메뉴 등록',
    backgroundStyleKo: '밝은 흰색 또는 밝은 단색 배경',
    lightingStyleKo: '정면 소프트박스 조명, 균일한 밝기, 그림자 최소화',
    plateStyleKo: '흰 접시 또는 포장 용기 그대로',
    propsKo: '최소 소품, 음식이 중심',
    cameraAngleKo: '45도 하이앵글 또는 정면',
    colorMoodKo: '밝고 선명, 높은 채도, 먹음직스러운 색감',
    promptKo:
      '밝은 단색 배경, 음식 화면 중앙 배치, 소프트박스 정면 조명, 선명하고 먹음직스러운 색감, 텍스트·로고 여백 확보, 배달앱 메뉴 대표사진 스타일, 선명한 포커스',
    promptEn:
      'Bright solid color background, food centered in frame, front softbox lighting, vivid and appetizing colors, text/logo margin space, delivery app menu hero photo style, sharp focus',
    ...neg(
      '어두운 배경, 과도한 그림자, 블러, 지저분한 배경, 어두운 조명',
      'dark background, heavy shadows, blur, messy background, dim lighting',
    ),
  },
  {
    id: 'dark-premium',
    nameKo: '다크 프리미엄 메인디쉬',
    shortDescriptionKo: '검은 배경과 따뜻한 측면 조명, 고급 식당 메뉴판 느낌',
    bestFor: '고기, 전골, 치킨, 술안주, 프리미엄 브랜딩',
    backgroundStyleKo: '딥 블랙 또는 짙은 원목 배경',
    lightingStyleKo: '따뜻한 측면 스포트라이트, 은은한 림라이트',
    plateStyleKo: '검정 또는 무광 도자기 접시, 고급 테이블웨어',
    propsKo: '목재 트레이, 금속 수저, 냅킨, 작은 소스그릇',
    cameraAngleKo: '30~45도 하이앵글 또는 측면 클로즈업',
    colorMoodKo: '어둡고 드라마틱, 따뜻한 황금빛 하이라이트, 은은한 김',
    promptKo:
      '딥 블랙 또는 짙은 원목 배경, 따뜻한 측면 스포트라이트, 은은한 스팀·김, 고급 도자기 접시, 파인다이닝 스타일 메뉴 사진, 하이 컨트라스트',
    promptEn:
      'Deep black or dark wood background, warm side spotlight, subtle steam/vapor, premium ceramic plate, fine dining style menu photo, high contrast',
    ...neg(
      '밝은 배경, 차가운 형광등, 저렴해 보이는 소품, 과도하게 밝은 조명',
      'bright background, cold fluorescent light, cheap props, overexposed lighting',
    ),
  },
  {
    id: 'crispy-fried',
    nameKo: '치킨/튀김 크리스피 강조형',
    shortDescriptionKo: '황금빛 튀김 질감과 소스 윤기를 극대화한 스타일',
    bestFor: '치킨, 닭강정, 돈까스, 튀김류',
    backgroundStyleKo: '어두운 배경 또는 브랜드 컬러 배경',
    lightingStyleKo: '강한 링라이트 또는 상단 집중 조명',
    plateStyleKo: '검정 플레이트 또는 치킨 전용 박스',
    propsKo: '소스컵, 감자튀김, 치킨무 (절제된 소품)',
    cameraAngleKo: '로우앵글 측면 또는 45도',
    colorMoodKo: '황금빛 갈색, 높은 채도, 바삭함이 느껴지는 질감',
    promptKo:
      '황금빛 바삭한 튀김 질감 강조, 강한 링라이트, 소스 윤기, 어두운 배경, 치킨·튀김류 광고 스타일, 로우앵글 드라마틱 구도',
    promptEn:
      'Golden crispy fried texture emphasis, strong ring light, glossy sauce, dark background, fried chicken advertisement style, low angle dramatic composition',
    ...neg(
      '흐릿한 튀김옷, 눅눅해 보임, 차가운 색감, 소프트 포커스',
      'soggy batter, greasy looking, cold color tone, soft focus',
    ),
  },
  {
    id: 'spicy-action',
    nameKo: '매운 음식 액션형',
    shortDescriptionKo: '젓가락 들어올리는 순간과 붉은 소스 윤기, 뜨거운 김',
    bestFor: '떡볶이, 마라, 볶음면, 닭볶음탕',
    backgroundStyleKo: '어두운 배경 또는 붉은 계열 배경',
    lightingStyleKo: '측면 드라마틱 조명, 붉은 소스 윤기를 살리는 조명',
    plateStyleKo: '한국식 냄비 또는 전통 그릇 그대로',
    propsKo: '젓가락, 연기·김, 고추 가니쉬',
    cameraAngleKo: '측면 또는 약간 낮은 앵글, 젓가락 들어올리는 순간',
    colorMoodKo: '강렬한 붉은 계열, 윤기 있는 소스, 뜨거운 느낌',
    promptKo:
      '젓가락으로 떡·면을 들어올리는 액션 샷, 붉은 소스 윤기 강조, 뜨거운 김, 드라마틱 측면 조명, 매운 음식 강조, 생동감 있는 구도',
    promptEn:
      'Action shot of chopsticks lifting rice cakes or noodles, glossy red sauce emphasis, steam, dramatic side lighting, spicy food emphasis, dynamic composition',
    ...neg(
      '정적인 구도, 차가워 보임, 소스 없음, 소프트 포커스',
      'static composition, cold looking, no sauce, soft focus',
    ),
  },
  {
    id: 'korean-table-spread',
    nameKo: '한상차림 풍성형',
    shortDescriptionKo: '메인 요리와 반찬을 탑뷰로 담는 풍성한 한상 스타일',
    bestFor: '한식 정식, 전골, 고기류, 가족·회식 메뉴',
    backgroundStyleKo: '한국식 전통 테이블 또는 나무 식탁',
    lightingStyleKo: '균일한 자연광 또는 전체 조명, 반찬이 모두 잘 보이게',
    plateStyleKo: '한국식 그릇 세트, 돌솥, 뚝배기, 다양한 반찬그릇',
    propsKo: '전통 수저, 반찬 그릇 여러 개, 냅킨',
    cameraAngleKo: '오버헤드 탑뷰 또는 45도 하이앵글',
    colorMoodKo: '따뜻하고 풍성한 색감, 한국식 자연 색감',
    promptKo:
      '한상 차림 푸드 포토그래피, 메인 요리와 다양한 반찬, 오버헤드 또는 45도 구도, 한국식 그릇과 수저, 풍성하고 따뜻한 색감, 가족 식사 분위기',
    promptEn:
      'Korean table spread food photography, main dish and various side dishes, overhead or 45-degree angle, Korean tableware and chopsticks, abundant and warm colors, family meal atmosphere',
    ...neg(
      '반찬 없음, 텅 빈 느낌, 서양식 플레이팅, 차가운 색감',
      'no side dishes, empty feeling, Western-style plating, cold color tone',
    ),
  },
  {
    id: 'natural-light-healthy',
    nameKo: '자연광 건강식형',
    shortDescriptionKo: '밝은 자연광과 식물·린넨 소품으로 건강하고 에어리한 무드',
    bestFor: '샐러드, 브런치, 카페, 디저트',
    backgroundStyleKo: '흰색 또는 밝은 원목 테이블',
    lightingStyleKo: '창문 자연광, 밝고 에어리한 느낌',
    plateStyleKo: '흰 세라믹 접시 또는 우드 볼',
    propsKo: '녹색 식물, 린넨 냅킨, 유리컵, 허브 가니쉬',
    cameraAngleKo: '오버헤드 플랫레이 또는 45도 하이앵글',
    colorMoodKo: '밝고 청량한 색감, 건강하고 자연스러운 느낌',
    promptKo:
      '밝은 자연광, 흰 테이블 또는 밝은 원목, 녹색 식물과 린넨 소품, 건강식 푸드 포토그래피 스타일, 에어리하고 청량한 색감, 깨끗한 분위기',
    promptEn:
      'Bright natural light, white table or light wood, green plant and linen props, healthy food photography style, airy and fresh color tone, clean atmosphere',
    ...neg(
      '어두운 조명, 탁한 색감, 무거운 소품, 형광등 조명',
      'dim lighting, muddy colors, heavy props, fluorescent lighting',
    ),
  },
  {
    id: 'brand-poster',
    nameKo: '브랜드 컬러 포스터형',
    shortDescriptionKo: '강한 단색 배경과 텍스트 여백으로 SNS 광고처럼 정돈',
    bestFor: 'SNS 광고, 음료·패키지 홍보, 브랜딩 이미지',
    backgroundStyleKo: '강한 단색 또는 브랜드 컬러 배경',
    lightingStyleKo: '균일하고 깔끔한 스튜디오 조명',
    plateStyleKo: '깔끔한 접시 또는 패키지 그대로',
    propsKo: '최소 소품, 텍스트·로고 여백 확보가 핵심',
    cameraAngleKo: '정면 또는 약간의 45도 하이앵글',
    colorMoodKo: '선명한 단색 대비, 브랜드 색감 강조',
    promptKo:
      '강한 단색 배경, 브랜드 컬러와 어울리는 구성, 음식 또는 패키지 중앙 배치, 텍스트·로고 여백 확보, 상업용 포스터 스타일, 깔끔한 스튜디오 조명',
    promptEn:
      'Strong solid color background, brand color-aligned composition, food or package centered, text/logo margin space, commercial poster style, clean studio lighting',
    ...neg(
      '복잡한 배경, 여백 없음, 지저분한 소품, 텍스트와 음식 겹침',
      'complex background, no margin, cluttered props, text overlapping food',
    ),
  },
  {
    id: 'hand-action',
    nameKo: '손동작 라이브형',
    shortDescriptionKo: '음식을 집거나 소스를 붓는 생동감 있는 손 동작 순간',
    bestFor: '릴스·쇼츠 썸네일, 상세페이지, 스토리 콘텐츠',
    backgroundStyleKo: '자연스러운 식탁 또는 주방 배경',
    lightingStyleKo: '자연광 또는 따뜻한 실내 조명',
    plateStyleKo: '실제 사용 접시 또는 그릇',
    propsKo: '젓가락·포크·나이프 등 식사 도구',
    cameraAngleKo: '측면 또는 약간 낮은 앵글, 손 동작이 보이도록',
    colorMoodKo: '자연스럽고 생동감 있는 색감',
    promptKo:
      '손으로 음식을 집거나 자르거나 소스를 붓는 자연스러운 순간, 생동감 있는 구도, 손은 음식보다 주인공이 되지 않도록, 릴스·쇼츠 썸네일 스타일',
    promptEn:
      'Natural moment of hand picking, cutting, or pouring sauce on food, dynamic composition, hand should not overpower the food, reels/shorts thumbnail style',
    ...neg(
      '부자연스러운 손 모양, 손이 너무 클로즈업, 정적인 구도',
      'unnatural hand shape, extreme hand close-up, static composition',
    ),
  },
];
