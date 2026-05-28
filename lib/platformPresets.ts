export type ImageFormat = 'JPG' | 'PNG' | 'JPG_PNG' | 'WEBP';

export interface PlatformPreset {
  id: string;
  nameKo: string;
  platform: string;
  platformGroupKo: string;
  width: number;
  height: number;
  aspectRatio: string;
  format: ImageFormat;
  maxFileSizeMb: number | null;
  descriptionKo: string;
}

export const platformPresets: PlatformPreset[] = [
  {
    id: 'instagram-feed-square',
    nameKo: '인스타그램 피드 (정사각형)',
    platform: 'Instagram',
    platformGroupKo: '인스타그램',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    format: 'JPG',
    maxFileSizeMb: 8,
    descriptionKo: '인스타그램 피드에서 가장 많이 사용되는 정사각형 포맷',
  },
  {
    id: 'instagram-feed-portrait',
    nameKo: '인스타그램 피드 (세로형)',
    platform: 'Instagram',
    platformGroupKo: '인스타그램',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    format: 'JPG',
    maxFileSizeMb: 8,
    descriptionKo: '피드에서 더 많은 공간을 차지해 주목도가 높은 세로 포맷',
  },
  {
    id: 'instagram-story',
    nameKo: '인스타그램 스토리 / 릴스',
    platform: 'Instagram',
    platformGroupKo: '인스타그램',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    format: 'JPG',
    maxFileSizeMb: 8,
    descriptionKo: '스토리와 릴스 커버에 최적화된 전체화면 세로 포맷',
  },
  {
    id: 'baemin-menu',
    nameKo: '배달의민족 메뉴 사진',
    platform: 'Baemin',
    platformGroupKo: '배달앱',
    width: 1280,
    height: 960,
    aspectRatio: '4:3',
    format: 'JPG_PNG',
    maxFileSizeMb: 15,
    descriptionKo: '배달의민족 개별 메뉴 등록용 사진',
  },
  {
    id: 'baemin-store-main',
    nameKo: '배달의민족 가게 대표사진',
    platform: 'Baemin',
    platformGroupKo: '배달앱',
    width: 1280,
    height: 960,
    aspectRatio: '4:3',
    format: 'JPG_PNG',
    maxFileSizeMb: 15,
    descriptionKo: '배달의민족 가게 메인 대표사진',
  },
  {
    id: 'coupang-eats-menu',
    nameKo: '쿠팡이츠 메뉴 사진',
    platform: 'CoupangEats',
    platformGroupKo: '배달앱',
    width: 1280,
    height: 960,
    aspectRatio: '4:3',
    format: 'JPG',
    maxFileSizeMb: 10,
    descriptionKo: '쿠팡이츠 메뉴 등록용 사진',
  },
  {
    id: 'yogiyo-menu',
    nameKo: '요기요 메뉴 사진',
    platform: 'Yogiyo',
    platformGroupKo: '배달앱',
    width: 1280,
    height: 960,
    aspectRatio: '4:3',
    format: 'JPG',
    maxFileSizeMb: 10,
    descriptionKo: '요기요 메뉴 등록용 사진',
  },
  {
    id: 'daangn-post',
    nameKo: '당근마켓 동네 홍보',
    platform: 'Daangn',
    platformGroupKo: '기타',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    format: 'JPG',
    maxFileSizeMb: 10,
    descriptionKo: '당근마켓 동네 홍보 게시물에 적합한 정사각형 포맷',
  },
  {
    id: 'naver-place',
    nameKo: '네이버 플레이스 사진',
    platform: 'NaverPlace',
    platformGroupKo: '기타',
    width: 720,
    height: 720,
    aspectRatio: '1:1',
    format: 'JPG_PNG',
    maxFileSizeMb: 20,
    descriptionKo: '네이버 플레이스 업체 사진 등록용',
  },
  {
    id: 'blog-thumbnail',
    nameKo: '블로그 썸네일',
    platform: 'Blog',
    platformGroupKo: '기타',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    format: 'JPG',
    maxFileSizeMb: 5,
    descriptionKo: '네이버 블로그·티스토리 썸네일에 적합한 가로 포맷',
  },
];

export function formatLabel(format: ImageFormat): string {
  if (format === 'JPG_PNG') return 'JPG / PNG';
  return format;
}

export function isInstagram(platform: PlatformPreset): boolean {
  return platform.platform === 'Instagram';
}

export function isDeliveryApp(platform: PlatformPreset): boolean {
  return ['Baemin', 'CoupangEats', 'Yogiyo'].includes(platform.platform);
}
