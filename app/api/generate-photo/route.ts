import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// 20MB — gpt-image-1은 최대 25MB 허용, 여유 마진 포함
const MAX_FILE_SIZE = 20 * 1024 * 1024;

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
    return NextResponse.json(
      { error: '요청 데이터를 읽을 수 없습니다.' },
      { status: 400 },
    );
  }

  const imageFile = formData.get('image') as File | null;
  const prompt = formData.get('prompt') as string | null;

  if (!imageFile || !prompt) {
    return NextResponse.json(
      { error: '이미지 또는 프롬프트가 없습니다.' },
      { status: 400 },
    );
  }

  // ── 3. 파일 크기 검사 ────────────────────────────────────────────
  if (imageFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `이미지 파일이 너무 큽니다. ${MAX_FILE_SIZE / 1024 / 1024}MB 이하로 업로드해 주세요.` },
      { status: 400 },
    );
  }

  // ── 4. OpenAI API 호출 ───────────────────────────────────────────
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt,
      n: 2,
      size: '1024x1024',
    });

    // gpt-image-1은 항상 b64_json 반환
    const images = (response.data ?? [])
      .map((d) => {
        if (d.b64_json) return `data:image/png;base64,${d.b64_json}`;
        if (d.url) return d.url;
        return null;
      })
      .filter((url): url is string => url !== null);

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
        return NextResponse.json(
          { error: 'API 키가 올바르지 않습니다.' },
          { status: 500 },
        );
      }
      if (err.status === 429) {
        return NextResponse.json(
          { error: 'API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.' },
          { status: 429 },
        );
      }
      if (err.status === 400) {
        return NextResponse.json(
          { error: '이미지 형식이 올바르지 않습니다. JPG·PNG·WEBP 파일을 사용해 주세요.' },
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
