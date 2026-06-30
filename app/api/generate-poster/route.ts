import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { checkCredits, deductCredit } from '@/lib/supabase/credits';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

type PosterRatio = '1:1' | '4:5' | '9:16';
type GenerationMode = 'edit' | 'generate';

// POSTER_GENERATION_MODE=edit   → images.edit()  (업로드 이미지 기반 변환, 기본값)
// POSTER_GENERATION_MODE=generate → images.generate() (텍스트 기반 생성)
const GENERATION_MODE: GenerationMode =
  process.env.POSTER_GENERATION_MODE === 'generate' ? 'generate' : 'edit';
const DEFAULT_MODEL = GENERATION_MODE === 'generate' ? 'gpt-image-2' : 'gpt-image-1';
const POSTER_IMAGE_MODEL = process.env.POSTER_IMAGE_MODEL || DEFAULT_MODEL;

// gpt-image-2는 임의 해상도 지원 → 정확한 비율 적용
const SIZE_MAP: Record<PosterRatio, string> = POSTER_IMAGE_MODEL.includes('gpt-image-2')
  ? { '1:1': '1024x1024', '4:5': '1024x1280', '9:16': '720x1280' }
  : { '1:1': '1024x1024', '4:5': '1024x1536', '9:16': '1024x1536' };

const STYLE_DESCRIPTIONS: Record<string, string> = {
  '인스타 감성 메뉴 포스터':
    'trendy Instagram-aesthetic food poster — clean minimal layout, pastel or vibrant accent color, airy whitespace, soft drop shadows, modern bold Korean typography',
  '빈티지 메뉴판 포스터':
    'vintage restaurant menu board poster — aged paper or dark chalkboard background, warm amber/brown tones, retro hand-lettered font feel, nostalgic Korean food aesthetic',
  '프리미엄 광고 포스터':
    'premium luxury food advertisement — dark dramatic or pure white minimal background, gold or silver accent details, refined typography, upscale restaurant brand aesthetic',
  '동네맛집 전단 포스터':
    'local Korean neighborhood restaurant promotional flyer — bright energetic colors (red, yellow, orange), bold simple layout, enthusiastic everyday food brand',
  '배달앱 썸네일 포스터':
    'Korean food delivery app listing banner — high-contrast vivid colors, bold price badge prominent, large food close-up composition, eye-catching on small mobile screens',
};

interface PromptInput {
  menuName: string;
  subtitle: string;
  price: string;
  badge: string;
  features: string[];
  ratio: PosterRatio;
  posterStyle: string;
}

function getStyleDesc(posterStyle: string): string {
  return STYLE_DESCRIPTIONS[posterStyle] ?? STYLE_DESCRIPTIONS['인스타 감성 메뉴 포스터'];
}

function formatRatioDesc(ratio: PosterRatio): string {
  if (ratio === '1:1') return 'square (1:1) for Instagram feed or Naver Smart Place';
  if (ratio === '4:5') return 'portrait (4:5) for Instagram feed';
  return 'tall portrait (9:16) for Instagram Stories or Reels';
}

function buildTextBlock(input: PromptInput): string {
  const { menuName, subtitle, price, badge, features } = input;
  return [
    `• Main title (large, bold Korean text, top area): "${menuName}"`,
    subtitle ? `• Subtitle (Korean, below title): "${subtitle}"` : null,
    price ? `• Price / event text (Korean, bottom area): "${price}"` : null,
    badge ? `• Emphasis badge (small rounded sticker, Korean): "${badge}"` : null,
    features.length > 0
      ? `• Ingredient / feature callout labels (floating near food, small rounded tags, Korean): ${features.map((f) => `"${f}"`).join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

// edit 모드: 업로드 이미지 기반 → 광고 포스터로 변환
function buildEditPrompt(input: PromptInput): string {
  const { ratio, posterStyle } = input;
  const styleDesc = getStyleDesc(posterStyle);
  const ratioDesc = formatRatioDesc(ratio);
  const textBlock = buildTextBlock(input);

  return `Transform this uploaded food photo into a ${styleDesc} in ${ratioDesc} format.

Use the uploaded food photo as the main reference. Recompose and relight it into a polished advertising poster.

POSTER TEXT — embed all Korean text as design elements inside the image:
${textBlock}

COMPOSITION:
- The food occupies 45–65% of the image, beautifully lit and recomposed for advertising appeal
- Ingredient/feature callout labels float around the food like modern menu design elements or ingredient tags
- The food must remain clearly recognizable and appetizing

REQUIREMENTS:
- All text must be in Korean, embedded as part of the design (not overlaid externally)
- Clear typographic hierarchy: main title largest → subtitle → price/event → callout labels/badge smallest
- The result should look like a real promotional poster from a Korean restaurant SNS or delivery app listing
- No human faces, no brand logos, no watermarks, no copyright symbols`;
}

// generate 모드: 텍스트 입력만으로 고퀄 AI 포스터 생성
function buildGeneratePrompt(input: PromptInput): string {
  const { menuName, features, ratio, posterStyle } = input;
  const styleDesc = getStyleDesc(posterStyle);
  const ratioDesc = formatRatioDesc(ratio);
  const foodSubject = features.length > 0 ? `${menuName} (${features.join(', ')})` : menuName;
  const textBlock = buildTextBlock(input);

  return `Create a ${styleDesc} for "${menuName}" in ${ratioDesc} format.

Food subject: ${foodSubject}
The food should occupy 45–65% of the composition, beautifully plated with professional studio lighting.

POSTER TEXT — embed all Korean text as design elements inside the image:
${textBlock}

REQUIREMENTS:
- Photo-realistic food, natural appetizing lighting
- All text in Korean, embedded in the design — clear typographic hierarchy
- Callout labels float around the food like modern restaurant menu design elements
- Result should look like a real Korean restaurant promotional poster or delivery app advertisement
- No human faces, no brand logos, no watermarks
- Tone: premium, appetizing, trustworthy`;
}

export async function POST(req: NextRequest) {
  // ── 0. 인증 + 크레딧 확인 ────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const balance = await checkCredits(supabase, user.id);
  if (balance < 1) {
    return NextResponse.json(
      { error: 'INSUFFICIENT_CREDITS', errorKo: '크레딧이 부족합니다.' },
      { status: 402 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.' },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: '요청 데이터를 읽을 수 없습니다.' }, { status: 400 });
  }

  const imageFile = formData.get('image') as File | null;
  const ratio = (formData.get('ratio') as string | null) ?? '1:1';
  const menuName = ((formData.get('menuName') as string | null) ?? '').trim();
  const subtitle = ((formData.get('subtitle') as string | null) ?? '').trim();
  const price = ((formData.get('price') as string | null) ?? '').trim();
  const badge = ((formData.get('badge') as string | null) ?? '').trim();
  const posterStyle = (
    (formData.get('posterStyle') as string | null) ?? '인스타 감성 메뉴 포스터'
  ).trim();
  const featuresRaw = (formData.get('features') as string | null) ?? '[]';

  if (GENERATION_MODE === 'edit' && !imageFile) {
    return NextResponse.json({ error: '이미지가 없습니다.' }, { status: 400 });
  }
  if (!menuName) {
    return NextResponse.json({ error: '메뉴명을 입력해 주세요.' }, { status: 400 });
  }
  if (imageFile && imageFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `이미지 파일이 너무 큽니다. ${MAX_FILE_SIZE / 1024 / 1024}MB 이하로 업로드해 주세요.` },
      { status: 400 },
    );
  }

  let features: string[] = [];
  try {
    const parsed = JSON.parse(featuresRaw);
    features = Array.isArray(parsed)
      ? parsed.filter((s: unknown) => typeof s === 'string' && s.trim())
      : [];
  } catch {
    features = [];
  }

  const posterRatio: PosterRatio = ratio in SIZE_MAP ? (ratio as PosterRatio) : '1:1';
  const size = SIZE_MAP[posterRatio];
  const promptInput: PromptInput = {
    menuName,
    subtitle,
    price,
    badge,
    features,
    ratio: posterRatio,
    posterStyle,
  };

  console.log(
    `[generate-poster] mode=${GENERATION_MODE} model=${POSTER_IMAGE_MODEL} size=${size} ratio=${posterRatio} style="${posterStyle}" menu="${menuName}"`,
  );

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    let imageUrl: string | null = null;

    if (GENERATION_MODE === 'generate') {
      // ── generate 모드: images.generate() ──────────────────────────────────
      const prompt = buildGeneratePrompt(promptInput);
      const response = await openai.images.generate({
        model: POSTER_IMAGE_MODEL,
        prompt,
        n: 1,
        size,
        quality: 'high',
      });
      const item = response.data?.[0];
      imageUrl = item?.b64_json
        ? `data:image/png;base64,${item.b64_json}`
        : (item?.url ?? null);
    } else {
      // ── edit 모드: images.edit() — 업로드 이미지 기반 변환 (기본) ──────────
      if (!imageFile) {
        return NextResponse.json({ error: '이미지가 없습니다.' }, { status: 400 });
      }
      const prompt = buildEditPrompt(promptInput);
      const imageBuffer = await imageFile.arrayBuffer();
      const imageForApi = new File([imageBuffer], imageFile.name, { type: imageFile.type });

      const response = await openai.images.edit({
        model: POSTER_IMAGE_MODEL,
        image: imageForApi,
        prompt,
        n: 1,
        size,
        quality: 'high',
      });
      const item = response.data?.[0];
      imageUrl = item?.b64_json
        ? `data:image/png;base64,${item.b64_json}`
        : (item?.url ?? null);
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: '이미지를 생성하지 못했습니다. 다시 시도해 주세요.' },
        { status: 500 },
      );
    }

    // ── 생성 성공 → 크레딧 1개 차감 ─────────────────────────────────
    const deductResult = await deductCredit(supabase, user.id, `poster-${Date.now()}`);
    console.log('[generate-poster] credit deduct:', deductResult);

    return NextResponse.json({ imageUrl, mode: GENERATION_MODE, model: POSTER_IMAGE_MODEL, creditBalance: deductResult.balance });
  } catch (err: unknown) {
    console.error(
      `[generate-poster] mode=${GENERATION_MODE} model=${POSTER_IMAGE_MODEL} OpenAI error:`,
      err,
    );

    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) {
        return NextResponse.json({ error: 'API 키가 올바르지 않습니다.' }, { status: 500 });
      }
      if (err.status === 429) {
        return NextResponse.json(
          { error: 'API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.' },
          { status: 429 },
        );
      }
      if (err.status === 400) {
        const msg = err.message ?? '';
        return NextResponse.json(
          {
            error: `이미지 생성 오류: ${msg || '이미지 형식이 올바르지 않습니다. JPG·PNG 파일을 사용해 주세요.'}`,
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: '생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
