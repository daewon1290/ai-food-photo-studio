/**
 * 원본 픽셀 후합성 방식 (프로토타입)
 *
 * 기존 방식과의 차이:
 * - generate-photo: AI가 전체 이미지 생성 (음식 보존 미보장)
 * - generate-preserve: AI mask 기반 (실제 픽셀 보존 안 됨)
 * - 이 route: AI로 스타일 배경 생성 → 원본 음식 픽셀을 코드로 직접 덮어씌움
 *
 * 처리 흐름:
 * 1. 원본 이미지 1024×1024 PNG 정규화
 * 2. OpenAI로 스타일 결과 이미지 생성 (음식 보존 기대 안 함)
 * 3. 페더링된 타원 마스크 생성 (중앙 음식 영역)
 * 4. 원본 음식 픽셀을 AI 결과 위에 합성 (코드 레벨)
 * 5. 최종 합성 이미지 반환
 *
 * 기존 generate-photo/route.ts, generate-preserve/route.ts는 변경 없음.
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const PROCESS_SIZE = 1024;

// ─────────────────────────────────────────────────────────────────────────────
// 페더링된 타원 알파 마스크 생성
//
// 반환값: 1채널 grayscale Buffer (size × size bytes)
//   - 타원 내부 (innerEdge 이내): 255 (원본 픽셀 100%)
//   - 타원 경계부 (innerEdge ~ 1.0): smoothstep 페더 (점진적 투명)
//   - 타원 외부: 0 (AI 결과 배경 100%)
//
// rxRatio/ryRatio: 이미지 크기 대비 타원 반경 비율
//   기존 generate-preserve(0.38/0.42)보다 약간 크게 설정
// featherNorm: 정규화된 타원 반경 기준 페더 폭 (0.14 = 외곽 14% 구간)
// ─────────────────────────────────────────────────────────────────────────────
function createFeatheredEllipseAlpha(
  size: number,
  rxRatio = 0.44,
  ryRatio = 0.41,
  featherNorm = 0.14,
): Buffer {
  const cx = size / 2;
  const cy = size / 2;
  const rx = size * rxRatio;
  const ry = size * ryRatio;
  const innerEdge = 1.0 - featherNorm;

  const data = Buffer.alloc(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = Math.sqrt(dx * dx + dy * dy);

      let alpha: number;
      if (d <= innerEdge) {
        alpha = 255; // 완전 불투명 — 원본 음식 100%
      } else if (d <= 1.0) {
        const t = (1.0 - d) / featherNorm;
        const st = t * t * (3 - 2 * t); // smoothstep 보간
        alpha = Math.round(st * 255);
      } else {
        alpha = 0; // 완전 투명 — AI 배경 100%
      }

      data[y * size + x] = alpha;
    }
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI 결과 URL → Buffer 변환 (data URL 또는 HTTPS URL 모두 처리)
// ─────────────────────────────────────────────────────────────────────────────
async function urlToBuffer(urlOrDataUrl: string): Promise<Buffer> {
  if (urlOrDataUrl.startsWith('data:')) {
    const base64 = urlOrDataUrl.split(',')[1];
    return Buffer.from(base64, 'base64');
  }
  const res = await fetch(urlOrDataUrl);
  if (!res.ok) throw new Error(`AI 결과 이미지 다운로드 실패: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ─────────────────────────────────────────────────────────────────────────────
// 원본 음식 픽셀 후합성
//
// 1. 원본 이미지의 RGBA raw 추출
// 2. 알파 채널을 페더링 마스크값으로 교체
// 3. 마스크 적용된 원본 레이어를 AI 결과 위에 overlay composite
// ─────────────────────────────────────────────────────────────────────────────
async function compositeOriginalFood(
  normalizedOriginalBuffer: Buffer, // 1024×1024 PNG
  aiResultUrl: string,
  alphaData: Buffer, // 1024×1024 1-channel
  size: number,
): Promise<string> {
  // AI 결과를 버퍼로 변환
  const aiBuffer = await urlToBuffer(aiResultUrl);

  // 원본 이미지의 RGBA raw 데이터 추출
  const { data: originalRGBAData } = await sharp(normalizedOriginalBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 알파 채널을 페더링 마스크값으로 교체
  // (픽셀 인덱스 i의 alpha 바이트 = [i*4+3])
  const foodLayerRaw = Buffer.from(originalRGBAData);
  for (let i = 0; i < size * size; i++) {
    foodLayerRaw[i * 4 + 3] = alphaData[i];
  }

  // raw RGBA → PNG (음식 레이어)
  const foodLayerPng = await sharp(foodLayerRaw, {
    raw: { width: size, height: size, channels: 4 },
  })
    .png()
    .toBuffer();

  // AI 결과 위에 음식 레이어 overlay
  const compositedBuffer = await sharp(aiBuffer)
    .resize(size, size, { fit: 'fill' }) // 크기 안전 보정
    .composite([{ input: foodLayerPng, blend: 'over' }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${compositedBuffer.toString('base64')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 응답 데이터 URL 추출 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
function extractImageUrl(data: { b64_json?: string | null; url?: string | null }[]): string | null {
  const item = data[0];
  if (!item) return null;
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item.url) return item.url;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST 핸들러
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: '요청 데이터를 읽을 수 없습니다.' }, { status: 400 });
  }

  const imageFile = formData.get('image') as File | null;
  const promptA = formData.get('promptA') as string | null;
  const promptB = formData.get('promptB') as string | null;

  if (!imageFile || !promptA) {
    return NextResponse.json({ error: '이미지 또는 프롬프트가 없습니다.' }, { status: 400 });
  }

  if (imageFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `이미지가 너무 큽니다. ${MAX_FILE_SIZE / 1024 / 1024}MB 이하로 업로드해 주세요.` },
      { status: 400 },
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const effectivePromptB = promptB || promptA;

  try {
    // ── 1. 원본 이미지 정규화 ─────────────────────────────────────────
    const originalBuffer = Buffer.from(await imageFile.arrayBuffer());
    const normalizedBuffer = await sharp(originalBuffer)
      .resize(PROCESS_SIZE, PROCESS_SIZE, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    // ── 2. 페더링된 음식 보호 알파 마스크 생성 ──────────────────────
    const alphaData = createFeatheredEllipseAlpha(PROCESS_SIZE);

    // ── 3. OpenAI로 스타일 결과 이미지 2장 생성 ─────────────────────
    //    이 단계에서는 음식 보존을 기대하지 않음 — 배경/분위기만 참고
    const makeInputFile = () =>
      new File([new Uint8Array(normalizedBuffer)], 'food.png', { type: 'image/png' });

    const [responseA, responseB] = await Promise.all([
      openai.images.edit({
        model: 'gpt-image-1',
        image: makeInputFile(),
        prompt: promptA,
        n: 1,
        size: '1024x1024',
        quality: 'high',
      }),
      openai.images.edit({
        model: 'gpt-image-1',
        image: makeInputFile(),
        prompt: effectivePromptB,
        n: 1,
        size: '1024x1024',
      }),
    ]);

    const aiUrlA = extractImageUrl(responseA.data ?? []);
    const aiUrlB = extractImageUrl(responseB.data ?? []);

    if (!aiUrlA || !aiUrlB) {
      return NextResponse.json(
        { error: 'AI 이미지를 생성하지 못했습니다. 다시 시도해 주세요.' },
        { status: 500 },
      );
    }

    // ── 4. 원본 음식 픽셀 후합성 (코드 레벨) ────────────────────────
    const [compositedA, compositedB] = await Promise.all([
      compositeOriginalFood(normalizedBuffer, aiUrlA, alphaData, PROCESS_SIZE),
      compositeOriginalFood(normalizedBuffer, aiUrlB, alphaData, PROCESS_SIZE),
    ]);

    return NextResponse.json({ images: [compositedA, compositedB], mode: 'composite' });
  } catch (err: unknown) {
    console.error('[generate-composite] error:', err);

    if (err instanceof OpenAI.APIError) {
      if (err.status === 401)
        return NextResponse.json({ error: 'API 키가 올바르지 않습니다.' }, { status: 500 });
      if (err.status === 429)
        return NextResponse.json({ error: 'API 사용량 한도에 도달했습니다.' }, { status: 429 });
      if (err.status === 400)
        return NextResponse.json({ error: `요청 오류: ${err.message}` }, { status: 400 });
    }

    return NextResponse.json(
      { error: '이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
