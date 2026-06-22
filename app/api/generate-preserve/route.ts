/**
 * 마스크 기반 원본 음식 보존 생성 API (프로토타입)
 *
 * 기존 generate-photo 방식과 비교 테스트용으로 분리된 route입니다.
 * 기존 generate-photo/route.ts는 수정하지 않습니다.
 *
 * 마스크 원리:
 * - 중앙 음식 영역: 불투명(alpha=255) → OpenAI가 보존
 * - 주변 배경 영역: 투명(alpha=0) → OpenAI가 스타일에 맞게 수정
 *
 * 마스크 파일 요구사항 (OpenAI):
 * - PNG 형식 필수
 * - 4MB 이하
 * - 입력 이미지와 동일한 크기 필수
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const PROCESS_SIZE = 1024; // 이미지와 마스크를 동일 크기로 정규화

/**
 * 중앙 음식 보호 마스크 생성
 * - 중앙 타원 내부: 불투명 흰색 (음식 보존 영역)
 * - 타원 외부: 완전 투명 (배경 수정 영역)
 *
 * rx/ry 비율 조정:
 * 0.38/0.42 → 음식이 보통 중앙 70-80% 영역에 있다고 가정한 기본값
 * 음식이 너무 잘리면 비율을 높이고, 배경 변화가 너무 적으면 비율을 낮춤
 */
function createFoodPreservationMask(
  size: number,
  rxRatio = 0.38,
  ryRatio = 0.42,
): Buffer {
  const cx = size / 2;
  const cy = size / 2;
  const rx = size * rxRatio;
  const ry = size * ryRatio;

  // 4채널(RGBA) 버퍼 생성 — 초기값 전체 투명(0)
  const data = Buffer.alloc(size * size * 4, 0);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        // 타원 내부 = 불투명 흰색 (음식 보존)
        const idx = (y * size + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
      // 타원 외부는 초기값 그대로 투명 (배경 수정)
    }
  }

  return data;
}

function extractImageUrl(data: { b64_json?: string | null; url?: string | null }[]): string | null {
  const item = data[0];
  if (!item) return null;
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item.url) return item.url;
  return null;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'API 키가 설정되지 않았습니다.' },
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
    // ── 1. 원본 이미지를 1024×1024 PNG로 정규화 ────────────────────
    const originalBuffer = Buffer.from(await imageFile.arrayBuffer());
    const normalizedImageBuffer = await sharp(originalBuffer)
      .resize(PROCESS_SIZE, PROCESS_SIZE, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    // ── 2. 중앙 음식 보호 마스크 생성 → PNG 인코딩 ─────────────────
    const rawMaskData = createFoodPreservationMask(PROCESS_SIZE);
    const maskBuffer = await sharp(rawMaskData, {
      raw: { width: PROCESS_SIZE, height: PROCESS_SIZE, channels: 4 },
    })
      .png()
      .toBuffer();

    // 마스크 크기 확인 (OpenAI 4MB 제한)
    if (maskBuffer.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: '마스크 이미지 생성 실패: 크기 초과' },
        { status: 500 },
      );
    }

    // ── 3. 2회 병렬 호출 (각각 다른 File 인스턴스 사용) ────────────
    // Buffer → Uint8Array 변환 (Web File API의 BlobPart 타입 호환)
    const makeImageFile = () =>
      new File([new Uint8Array(normalizedImageBuffer)], 'food.png', { type: 'image/png' });
    const makeMaskFile = () =>
      new File([new Uint8Array(maskBuffer)], 'mask.png', { type: 'image/png' });

    const [responseA, responseB] = await Promise.all([
      openai.images.edit({
        model: 'gpt-image-1',
        image: makeImageFile(),
        mask: makeMaskFile(),
        prompt: promptA,
        n: 1,
        size: '1024x1024',
        quality: 'high',
      }),
      openai.images.edit({
        model: 'gpt-image-1',
        image: makeImageFile(),
        mask: makeMaskFile(),
        prompt: effectivePromptB,
        n: 1,
        size: '1024x1024',
      }),
    ]);

    const imageA = extractImageUrl(responseA.data ?? []);
    const imageB = extractImageUrl(responseB.data ?? []);
    const images = [imageA, imageB].filter((u): u is string => u !== null);

    if (images.length === 0) {
      return NextResponse.json(
        { error: '이미지를 생성하지 못했습니다. 다시 시도해 주세요.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ images, mode: 'mask-preserve' });
  } catch (err: unknown) {
    console.error('[generate-preserve] error:', err);

    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) {
        return NextResponse.json({ error: 'API 키가 올바르지 않습니다.' }, { status: 500 });
      }
      if (err.status === 429) {
        return NextResponse.json(
          { error: 'API 사용량 한도에 도달했습니다.' },
          { status: 429 },
        );
      }
      if (err.status === 400) {
        return NextResponse.json(
          { error: `요청 오류: ${err.message}` },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: '이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
