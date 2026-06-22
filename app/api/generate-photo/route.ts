import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// 20MB — gpt-image-1 최대 25MB, 여유 마진 포함
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function extractImageUrl(data: { b64_json?: string | null; url?: string | null }[]): string | null {
  const item = data[0];
  if (!item) return null;
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item.url) return item.url;
  return null;
}

export async function POST(req: NextRequest) {
  // ── 1. API 키 확인 ───────────────────────────────────────────────
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.' },
      { status: 500 },
    );
  }

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
  const referenceFile = formData.get('referenceImage') as File | null;

  if (!imageFile || !promptA) {
    return NextResponse.json({ error: '이미지 또는 프롬프트가 없습니다.' }, { status: 400 });
  }

  // ── 3. 파일 크기 검사 ────────────────────────────────────────────
  if (imageFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `이미지 파일이 너무 큽니다. ${MAX_FILE_SIZE / 1024 / 1024}MB 이하로 업로드해 주세요.` },
      { status: 400 },
    );
  }

  // ── 4. 파일 버퍼 → 각 호출용 File 복사 ──────────────────────────
  // 같은 File 객체를 두 번 읽으면 스트림이 소진되므로 버퍼로 복사
  let imageBuffer: ArrayBuffer;
  try {
    imageBuffer = await imageFile.arrayBuffer();
  } catch {
    return NextResponse.json({ error: '이미지를 읽을 수 없습니다.' }, { status: 400 });
  }

  const makeFile = () => new File([imageBuffer], imageFile.name, { type: imageFile.type });

  // reference image가 있으면 [음식사진, 레퍼런스] 배열로 전달
  let referenceBuffer: ArrayBuffer | null = null;
  if (referenceFile) {
    try {
      referenceBuffer = await referenceFile.arrayBuffer();
    } catch {
      // 레퍼런스 로드 실패 시 단일 이미지로 폴백
      referenceBuffer = null;
    }
  }

  const makeImageInput = () => {
    if (referenceBuffer) {
      const refFile = new File([referenceBuffer!], 'reference.png', { type: 'image/png' });
      return [makeFile(), refFile];
    }
    return makeFile();
  };

  // reference가 있을 때 프롬프트에 컨텍스트 prefix 추가
  const REFERENCE_PREFIX = referenceBuffer
    ? 'STYLE REFERENCE: The second image provided is a style reference photo. ' +
      'Match its: camera angle and distance, lighting direction and character, ' +
      'surface/background texture and material, prop type and placement pattern. ' +
      'Do NOT copy any food items or ingredients from the reference image — ' +
      'the first image (user food photo) is the only source of food content.\n\n'
    : '';

  const withRef = (prompt: string) => REFERENCE_PREFIX + prompt;

  // ── 5. OpenAI API 2회 병렬 호출 ─────────────────────────────────
  // 시안 A(기본 스튜디오형)는 흰 배경 공통 스펙이므로 스타일 레퍼런스를 붙이지 않는다.
  // 레퍼런스는 템플릿 정체성이 적용되는 시안 B에만 전달.
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const effectivePromptB = promptB || promptA;

  try {
    const [responseA, responseB] = await Promise.all([
      openai.images.edit({
        model: 'gpt-image-1',
        image: makeFile(),
        prompt: promptA,
        n: 1,
        size: '1024x1024',
        quality: 'high',
      }),
      openai.images.edit({
        model: 'gpt-image-1',
        image: makeImageInput(),
        prompt: withRef(effectivePromptB),
        n: 1,
        size: '1024x1024',
        quality: 'high',
      }),
    ]);

    const imageA = extractImageUrl(responseA.data ?? []);
    const imageB = extractImageUrl(responseB.data ?? []);
    const images = [imageA, imageB].filter((url): url is string => url !== null);

    if (images.length === 0) {
      return NextResponse.json(
        { error: '이미지를 생성하지 못했습니다. 다시 시도해 주세요.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ images });
  } catch (err: unknown) {
    console.error('[generate-photo] OpenAI error:', err);

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
        if (msg.toLowerCase().includes('billing') || msg.toLowerCase().includes('limit')) {
          return NextResponse.json(
            { error: 'OpenAI 결제 한도에 도달했습니다. OpenAI 대시보드에서 한도를 확인해 주세요.' },
            { status: 400 },
          );
        }
        return NextResponse.json(
          { error: `이미지 생성 오류: ${msg || '이미지 형식이 올바르지 않습니다. JPG·PNG·WEBP 파일을 사용해 주세요.'}` },
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
