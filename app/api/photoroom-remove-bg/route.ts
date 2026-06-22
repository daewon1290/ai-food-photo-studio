/**
 * Photoroom Remove Background API 테스트 route
 *
 * 목적: 업로드된 음식 사진에서 음식/접시 피사체가 잘 분리되는지 확인
 * 기존 generate-* route와 독립적으로 동작합니다.
 *
 * Photoroom API spec:
 *   endpoint: https://sdk.photoroom.com/v1/segment
 *   method:   POST multipart/form-data
 *   auth:     x-api-key header
 *   field:    image_file
 *   response: binary PNG (배경 제거된 PNG)
 */
import { NextRequest, NextResponse } from 'next/server';

const PHOTOROOM_ENDPOINT = 'https://sdk.photoroom.com/v1/segment';
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
  // ── 1. API 키 확인 ───────────────────────────────────────────────
  if (!process.env.PHOTOROOM_API_KEY) {
    return NextResponse.json(
      { error: 'PHOTOROOM_API_KEY가 설정되지 않았습니다.' },
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

  if (!imageFile) {
    return NextResponse.json({ error: '이미지가 없습니다.' }, { status: 400 });
  }

  if (imageFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `이미지가 너무 큽니다. ${MAX_FILE_SIZE / 1024 / 1024}MB 이하로 업로드해 주세요.` },
      { status: 400 },
    );
  }

  // ── 3. Photoroom API 호출 ────────────────────────────────────────
  try {
    const photoroomForm = new FormData();
    photoroomForm.append('image_file', imageFile);

    const response = await fetch(PHOTOROOM_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.PHOTOROOM_API_KEY,
      },
      body: photoroomForm,
    });

    if (!response.ok) {
      // 키 노출 없이 상태 코드와 안전한 메시지만 반환
      const status = response.status;
      if (status === 401 || status === 403) {
        return NextResponse.json(
          { error: 'Photoroom API 인증 실패입니다. API 키를 확인해 주세요.' },
          { status: 500 },
        );
      }
      if (status === 402) {
        return NextResponse.json(
          { error: 'Photoroom 크레딧이 부족합니다.' },
          { status: 402 },
        );
      }
      if (status === 429) {
        return NextResponse.json(
          { error: 'Photoroom API 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.' },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: `Photoroom API 오류 (${status}). 잠시 후 다시 시도해 주세요.` },
        { status: 500 },
      );
    }

    // ── 4. 결과 PNG → base64 data URL 변환 ──────────────────────────
    const pngBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(pngBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ image: dataUrl });
  } catch (err: unknown) {
    console.error('[photoroom-remove-bg] fetch error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json(
      { error: '배경 제거 요청에 실패했습니다. 네트워크 상태를 확인해 주세요.' },
      { status: 500 },
    );
  }
}
