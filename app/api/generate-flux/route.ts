import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

const MODEL = 'fal-ai/flux-pro/kontext';
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface FluxKontextOutput {
  images?: Array<{ url: string; width?: number; height?: number; content_type?: string }>;
}

function fileToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const b64 = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${b64}`;
}

export async function POST(req: NextRequest) {
  // ── 1. API 키 확인 ───────────────────────────────────────────────
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return NextResponse.json({ error: 'FAL_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }
  fal.config({ credentials: falKey });

  // ── 2. 요청 파싱 ─────────────────────────────────────────────────
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
      { error: `이미지 파일이 너무 큽니다. ${MAX_FILE_SIZE / 1024 / 1024}MB 이하로 업로드해 주세요.` },
      { status: 400 },
    );
  }

  // ── 3. 이미지 → base64 data URL 변환 ────────────────────────────
  let imageBuffer: ArrayBuffer;
  try {
    imageBuffer = await imageFile.arrayBuffer();
  } catch {
    return NextResponse.json({ error: '이미지를 읽을 수 없습니다.' }, { status: 400 });
  }

  const imageDataUrl = fileToDataUrl(imageBuffer, imageFile.type || 'image/jpeg');
  const effectivePromptB = promptB || promptA;

  // ── 4. Flux Kontext Pro 2회 병렬 호출 ───────────────────────────
  try {
    const [resultA, resultB] = await Promise.all([
      fal.subscribe(MODEL, {
        input: { image_url: imageDataUrl, prompt: promptA },
        logs: false,
      }),
      fal.subscribe(MODEL, {
        input: { image_url: imageDataUrl, prompt: effectivePromptB },
        logs: false,
      }),
    ]);

    const urlA = (resultA.data as FluxKontextOutput)?.images?.[0]?.url ?? null;
    const urlB = (resultB.data as FluxKontextOutput)?.images?.[0]?.url ?? null;
    const images = [urlA, urlB].filter((u): u is string => u !== null);

    if (images.length === 0) {
      return NextResponse.json(
        { error: '이미지를 생성하지 못했습니다. 다시 시도해 주세요.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ images });
  } catch (err: unknown) {
    const errMessage =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : String(err);
    console.error('[generate-flux] fal.ai error:', errMessage);
    return NextResponse.json(
      { error: errMessage || '이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
