export type PosterRatio = '1:1' | '4:5' | '9:16';

export interface PosterRatioOption {
  id: PosterRatio;
  emoji: string;
  label: string;
  desc: string;
  canvasWidth: number;
  canvasHeight: number;
  cssAspectRatio: string;
}

export const POSTER_RATIO_OPTIONS: PosterRatioOption[] = [
  {
    id: '1:1',
    emoji: '⬜',
    label: '정사각형 1:1',
    desc: '인스타 피드, 당근, 스마트플레이스에 무난해요.',
    canvasWidth: 1080,
    canvasHeight: 1080,
    cssAspectRatio: '1/1',
  },
  {
    id: '4:5',
    emoji: '📱',
    label: '세로형 4:5',
    desc: '인스타 피드에서 더 크게 보여요.',
    canvasWidth: 1080,
    canvasHeight: 1350,
    cssAspectRatio: '4/5',
  },
  {
    id: '9:16',
    emoji: '📲',
    label: '스토리형 9:16',
    desc: '인스타 스토리, 릴스 커버, 모바일 공지에 좋아요.',
    canvasWidth: 1080,
    canvasHeight: 1920,
    cssAspectRatio: '9/16',
  },
];

export interface PosterContent {
  menuName: string;
  tagline: string;
  price: string;
  features: [string, string, string];
}
