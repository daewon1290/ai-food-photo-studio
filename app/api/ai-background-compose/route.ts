/**
 * AI 배경 생성 + Photoroom 음식 PNG 합성 route
 *
 * 처리 흐름:
 *   1. Photoroom Remove Background API → 원본 음식/접시 PNG 추출 (병렬)
 *   2. OpenAI images.generate → 음식 없는 빈 배경 1024×1024 생성 (병렬)
 *   3. sharp: AI 배경 위에 shadow → 음식 PNG 순으로 합성
 *   4. 세 결과 모두 반환: removedBg, aiBg, composed
 *
 * 프롬프트 원칙:
 *   - 음식·접시·식재료 관련 단어는 부정 명령(NO ...)으로만 사용
 *   - "food photography background"는 허용 (맥락 설정용)
 *   - 중앙 영역이 비어 있어야 나중 합성 자연스러움
 *
 * 반환값: { removedBg: string; aiBg: string; composed: string } | { error: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';

const PHOTOROOM_ENDPOINT = 'https://sdk.photoroom.com/v1/segment';
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const S = 1024;

type BgStyle = 'delivery-app' | 'dark-premium' | 'brand-color';
const VALID_STYLES: BgStyle[] = ['delivery-app', 'dark-premium', 'brand-color'];

// ── 스타일별 설정 ─────────────────────────────────────────────────────

interface StyleConfig {
  /** OpenAI에 보낼 배경 생성 프롬프트 */
  promptEn: string;
  /** 음식 PNG 최대 크기 (캔버스 대비 비율) */
  foodScale: number;
  /** contact shadow 불투명도 */
  shadowContact: number;
  /** cast shadow 불투명도 */
  shadowCast: number;
}

const STYLE_CONFIGS: Record<BgStyle, StyleConfig> = {
  /**
   * 배달앱 대표사진형
   * - 밝은 크림/오프화이트 스튜디오 배경
   * - 소프트 오버헤드 라이팅
   * - 음식 85% 크기로 꽉 차게
   */
  'delivery-app': {
    promptEn: `Create an empty professional food photography studio background.
MANDATORY: The image must contain absolutely NO food, NO plate, NO dish, NO bowl, NO cup, NO sauce, NO garnish, NO ingredients, NO chopsticks, NO spoon, NO fork, NO tongs, NO cooking utensils anywhere in the image.
The center area of the image must be completely empty — just a clean table surface or backdrop.
A food product PNG will be composited on top of this background later in post-production.

Background style:
- Bright, warm off-white or light cream studio backdrop
- Clean, smooth light-colored table surface subtly visible at the lower portion
- Soft, even front-overhead studio lighting
- A gentle, natural shadow in the empty center, as if the surface is ready for a product to be placed
- Bright and appetizing commercial style suitable for a delivery app menu thumbnail

Do NOT include any text, logo, price tag, watermark, menu board, sign, or any written characters.
The result must look like a clean empty professional studio setup, ready for a food product image to be dropped in.`,
    foodScale: 0.85,
    shadowContact: 0.42,
    shadowCast: 0.16,
  },

  /**
   * 다크 프리미엄 메인디쉬형
   * - 다크 월넛/마호가니 테이블
   * - 따뜻한 드라마틱 사이드 스팟라이트
   * - 음식 73% 크기로 여백 확보
   */
  'dark-premium': {
    promptEn: `Create an empty professional food photography background for a premium upscale restaurant menu.
MANDATORY: The image must contain absolutely NO food, NO plate, NO dish, NO bowl, NO sauce, NO garnish, NO ingredients, NO chopsticks, NO spoon, NO fork, NO glass, NO cup anywhere in the image — especially not in the center area.
The center of the image must be completely empty — just the bare table surface, ready for a dish to be placed.
A plated dish PNG will be composited on top of this background later.

Background style:
- Dark walnut or mahogany wooden table surface with realistic visible grain
- Deep brown or near-black background behind the table
- Warm dramatic spotlight illuminating the center of the table from above
- Subtle warm rim light from the side
- Cinematic, premium, upscale restaurant atmosphere
- Very subtle background bokeh far in the background is acceptable, but absolutely no props or objects in the foreground or center
- The table surface in the center must be bare and clean

Do NOT include any text, logo, price tag, watermark, or written characters.
The result must look like an elegant empty premium restaurant table, ready for a fine dish to be placed on it.`,
    foodScale: 0.73,
    shadowContact: 0.56,
    shadowCast: 0.22,
  },

  /**
   * 브랜드 컬러 포스터형
   * - 강한 단색 또는 그라데이션 배경
   * - 광고 포스터 스타일
   * - 음식 68% 크기로 텍스트 여백 확보
   */
  'brand-color': {
    promptEn: `Create an empty commercial food advertising poster background.
MANDATORY: The image must contain absolutely NO food, NO plate, NO dish, NO bowl, NO cup, NO sauce, NO garnish, NO ingredients, NO utensils anywhere in the image.
The entire image must be a clean background only — completely empty with no objects.
A food product PNG will be composited on top of this background later.

Background style:
- Bold solid color background — choose one striking option: deep red, vibrant orange, rich burgundy, bold navy, or warm saffron yellow
- Clean, flat or very subtly textured surface
- Commercial food advertising poster style
- The color should be vivid and appetizing, suitable for a restaurant brand poster
- Minimal subtle vignette at the edges to add depth is acceptable

Do NOT include any text, logo, price, watermark, decorative lettering, menu names, signs, or any written content.
The result must look like a clean commercial food poster backdrop, ready for a product image to be dropped in.`,
    foodScale: 0.68,
    shadowContact: 0.45,
    shadowCast: 0.18,
  },
};

// ── 2단계 그림자 SVG ─────────────────────────────────────────────────

function buildShadowSvg(
  fLeft: number,
  fTop: number,
  fW: number,
  fH: number,
  contactOpacity: number,
  castOpacity: number,
): Buffer {
  const cx = fLeft + fW / 2;
  const baseY = fTop + fH;

  // contact shadow: 음식 바닥에 딱 붙어있는 좁은 타원
  const cRx = fW * 0.28;
  const cRy = Math.max(7, fH * 0.020);
  const cCy = baseY - cRy * 0.4; // 음식 경계선 약간 안쪽

  // cast shadow: 아래로 퍼지는 넓은 타원
  const sRx = fW * 0.38;
  const sRy = Math.max(12, fH * 0.048);
  const sCy = baseY + sRy * 0.12;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs>
      <filter id="sf"><feGaussianBlur stdDeviation="24"/></filter>
      <filter id="cf"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <ellipse cx="${cx}" cy="${sCy}" rx="${sRx}" ry="${sRy}"
      fill="rgba(5,2,1,${castOpacity})" filter="url(#sf)"/>
    <ellipse cx="${cx}" cy="${cCy}" rx="${cRx}" ry="${cRy}"
      fill="rgba(5,2,1,${contactOpacity})" filter="url(#cf)"/>
  </svg>`;
  return Buffer.from(svg);
}

// ── Route handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }
  if (!process.env.PHOTOROOM_API_KEY) {
    return NextResponse.json({ error: 'PHOTOROOM_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: '요청 데이터를 읽을 수 없습니다.' }, { status: 400 });
  }

  const imageFile = formData.get('image') as File | null;
  const bgStyleRaw = (formData.get('bgStyle') as string | null) ?? 'delivery-app';
  const bgStyle: BgStyle = VALID_STYLES.includes(bgStyleRaw as BgStyle)
    ? (bgStyleRaw as BgStyle)
    : 'delivery-app';

  if (!imageFile) {
    return NextResponse.json({ error: '이미지가 없습니다.' }, { status: 400 });
  }
  if (imageFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `이미지가 너무 큽니다. ${MAX_FILE_SIZE / 1024 / 1024}MB 이하로 업로드해 주세요.` },
      { status: 400 },
    );
  }

  let imageBuffer: ArrayBuffer;
  try {
    imageBuffer = await imageFile.arrayBuffer();
  } catch {
    return NextResponse.json({ error: '이미지를 읽을 수 없습니다.' }, { status: 400 });
  }

  const { promptEn, foodScale, shadowContact, shadowCast } = STYLE_CONFIGS[bgStyle];

  // ── Step 1 & 2: Photoroom 배경 제거 + OpenAI 배경 생성 병렬 실행 ──
  let removedBgBuffer: Buffer;
  let aiBgBuffer: Buffer;

  try {
    const photoroomForm = new FormData();
    photoroomForm.append(
      'image_file',
      new File([imageBuffer], imageFile.name, { type: imageFile.type }),
    );

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const [prRes, aiRes] = await Promise.all([
      fetch(PHOTOROOM_ENDPOINT, {
        method: 'POST',
        headers: { 'x-api-key': process.env.PHOTOROOM_API_KEY! },
        body: photoroomForm,
      }),
      openai.images.generate({
        model: 'gpt-image-1',
        prompt: promptEn,
        n: 1,
        size: '1024x1024',
        quality: 'high',
      }),
    ]);

    // Photoroom 결과 처리
    if (!prRes.ok) {
      const s = prRes.status;
      if (s === 401 || s === 403)
        return NextResponse.json({ error: 'Photoroom 인증 실패입니다.' }, { status: 500 });
      if (s === 402)
        return NextResponse.json({ error: 'Photoroom 크레딧이 부족합니다.' }, { status: 402 });
      if (s === 429)
        return NextResponse.json({ error: 'Photoroom 요청 한도를 초과했습니다.' }, { status: 429 });
      return NextResponse.json({ error: `Photoroom API 오류 (${s}).` }, { status: 500 });
    }
    removedBgBuffer = Buffer.from(await prRes.arrayBuffer());

    // OpenAI 결과 처리
    const aiItem = aiRes.data?.[0];
    if (!aiItem) {
      return NextResponse.json({ error: 'AI 배경 이미지를 받지 못했습니다.' }, { status: 500 });
    }
    if (aiItem.b64_json) {
      aiBgBuffer = Buffer.from(aiItem.b64_json, 'base64');
    } else if (aiItem.url) {
      const urlRes = await fetch(aiItem.url);
      if (!urlRes.ok)
        return NextResponse.json({ error: 'AI 배경 이미지 다운로드에 실패했습니다.' }, { status: 500 });
      aiBgBuffer = Buffer.from(await urlRes.arrayBuffer());
    } else {
      return NextResponse.json({ error: 'AI 배경 이미지 형식을 알 수 없습니다.' }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error(
      '[ai-background-compose] api error:',
      err instanceof Error ? err.message : err,
    );
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401)
        return NextResponse.json({ error: 'OpenAI API 키가 올바르지 않습니다.' }, { status: 500 });
      if (err.status === 429)
        return NextResponse.json({ error: 'OpenAI API 한도를 초과했습니다.' }, { status: 429 });
      if (err.status === 400)
        return NextResponse.json(
          { error: 'OpenAI 요청이 거부되었습니다. 잠시 후 다시 시도해 주세요.' },
          { status: 400 },
        );
    }
    return NextResponse.json(
      { error: '배경 생성 또는 배경 제거 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }

  // ── Step 3: sharp 합성 ───────────────────────────────────────────
  try {
    const removedBgDataUrl = `data:image/png;base64,${removedBgBuffer.toString('base64')}`;
    const aiBgDataUrl = `data:image/png;base64,${aiBgBuffer.toString('base64')}`;

    // 음식 PNG 원본 크기
    const fgMeta = await sharp(removedBgBuffer).metadata();
    const fgW = fgMeta.width ?? S;
    const fgH = fgMeta.height ?? S;

    // 스타일별 비율로 object-contain
    const maxDim = Math.floor(S * foodScale);
    const scale = Math.min(maxDim / fgW, maxDim / fgH, 1);
    const placedW = Math.round(fgW * scale);
    const placedH = Math.round(fgH * scale);

    // 수평 정중앙, 수직 52% 중심 (테이블 위에 놓인 느낌)
    const left = Math.round((S - placedW) / 2);
    const idealTop = Math.round(S * 0.52 - placedH / 2);
    const top = Math.max(40, Math.min(S - placedH - 55, idealTop));

    // 음식 PNG 리사이즈
    const resizedFg = await sharp(removedBgBuffer)
      .resize(placedW, placedH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // AI 배경을 1024×1024로 보정
    const bgBuffer = await sharp(aiBgBuffer)
      .resize(S, S, { fit: 'cover' })
      .png()
      .toBuffer();

    // 2단계 그림자
    const shadowBuffer = await sharp(
      buildShadowSvg(left, top, placedW, placedH, shadowContact, shadowCast),
    ).png().toBuffer();

    // 최종 합성: 배경 → 그림자 → 음식
    const composedBuffer = await sharp(bgBuffer)
      .composite([
        { input: shadowBuffer, top: 0, left: 0 },
        { input: resizedFg,    top,    left     },
      ])
      .png()
      .toBuffer();

    return NextResponse.json({
      removedBg: removedBgDataUrl,
      aiBg:      aiBgDataUrl,
      composed:  `data:image/png;base64,${composedBuffer.toString('base64')}`,
    });
  } catch (err: unknown) {
    console.error('[ai-background-compose] sharp error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: '이미지 합성에 실패했습니다.' }, { status: 500 });
  }
}
