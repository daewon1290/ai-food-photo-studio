/**
 * Photoroom 합성 테스트 route
 *
 * 배경 프리셋:
 *   bright-cream — 스튜디오 크림 배경 (배달앱용)
 *   warm-table   — 밝은 메이플/오크 나무 테이블 질감
 *   dark-wood    — 다크 월넛 테이블 질감 (프리미엄)
 *
 * 합성 방식:
 *   1. Photoroom 배경 제거 PNG 획득
 *   2. SVG로 배경 캔버스 생성 (feTurbulence 나무결 + 조명 + 비네트)
 *   3. 2단계 그림자 (contact shadow + cast shadow) 합성
 *   4. 음식 PNG를 1024×1024 캔버스 76% 박스에 맞춰 중앙(52% 수직) 배치
 *   5. 최종 PNG → base64 data URL 반환
 *
 * 반환값: { removedBg: string; composed: string } | { error: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const PHOTOROOM_ENDPOINT = 'https://sdk.photoroom.com/v1/segment';
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const S = 1024;

type BgPreset = 'bright-cream' | 'warm-table' | 'dark-wood';
const VALID_PRESETS: BgPreset[] = ['bright-cream', 'warm-table', 'dark-wood'];

// ── 배경 생성 함수들 ─────────────────────────────────────────────────

/**
 * 스튜디오 크림 배경
 * - 단색(#FAF6EE) + 상단 중심에서 퍼지는 흰 스튜디오 조명 + 미세 엣지 웜톤
 * - 나무결 없음 (배달앱 대표사진용 클린 배경)
 */
function bgBrightCream(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs>
      <radialGradient id="l" cx="50%" cy="30%" r="64%">
        <stop offset="0%"   stop-color="#FFFFFF" stop-opacity="0.65"/>
        <stop offset="70%"  stop-color="#FAF6EE" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="#FAF6EE" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="e" cx="50%" cy="58%" r="76%">
        <stop offset="50%" stop-color="#FAF6EE"  stop-opacity="0"/>
        <stop offset="100%" stop-color="#D8C09A" stop-opacity="0.18"/>
      </radialGradient>
    </defs>
    <rect width="${S}" height="${S}" fill="#FAF6EE"/>
    <rect width="${S}" height="${S}" fill="url(#l)"/>
    <rect width="${S}" height="${S}" fill="url(#e)"/>
  </svg>`;
  return Buffer.from(svg);
}

/**
 * 밝은 메이플/오크 나무 테이블
 * - feTurbulence fractalNoise + feBlend overlay = 나무결 시뮬레이션
 * - 수평 플랭크 라인으로 테이블 보드 질감 암시
 * - 따뜻한 상단 조명 + 미세 엣지 어두운 비네트
 */
function bgWarmTable(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs>
      <!-- 나무결: 가로 방향 fractalNoise (낮은 X 주파수, 높은 Y 주파수) -->
      <filter id="grain" x="0%" y="0%" width="100%" height="100%"
              color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.016 0.32"
                      numOctaves="4" seed="3" result="t"/>
        <feBlend in="SourceGraphic" in2="t" mode="overlay"/>
      </filter>
      <!-- 따뜻한 상단 조명 -->
      <radialGradient id="light" cx="50%" cy="28%" r="56%">
        <stop offset="0%"   stop-color="#E8C080" stop-opacity="0.50"/>
        <stop offset="100%" stop-color="#C09060" stop-opacity="0"/>
      </radialGradient>
      <!-- 엣지 비네트 -->
      <radialGradient id="vig" cx="50%" cy="55%" r="72%">
        <stop offset="48%" stop-color="#C09060" stop-opacity="0"/>
        <stop offset="100%" stop-color="#5E3A18" stop-opacity="0.28"/>
      </radialGradient>
    </defs>
    <!-- 베이스: 웜 메이플 색 -->
    <rect width="${S}" height="${S}" fill="#C09060"/>
    <!-- 플랭크 경계선: 단일 어두운 선 -->
    <rect y="162" width="${S}" height="1.5" fill="#8A5830" opacity="0.32"/>
    <rect y="386" width="${S}" height="1.5" fill="#8A5830" opacity="0.26"/>
    <rect y="594" width="${S}" height="2"   fill="#8A5830" opacity="0.30"/>
    <rect y="820" width="${S}" height="1.5" fill="#8A5830" opacity="0.26"/>
    <!-- 나무결 오버레이 (동일 색 rect에 필터 적용하여 곱하기 효과) -->
    <rect width="${S}" height="${S}" fill="#C09060" filter="url(#grain)" opacity="0.44"/>
    <!-- 조명 -->
    <rect width="${S}" height="${S}" fill="url(#light)"/>
    <!-- 비네트 -->
    <rect width="${S}" height="${S}" fill="url(#vig)"/>
  </svg>`;
  return Buffer.from(svg);
}

/**
 * 다크 월넛 나무 테이블 (프리미엄)
 * - 더 낮은 베이스 주파수로 굵은 나무결
 * - 밝은 선 + 어두운 선 쌍으로 플랭크 3D 엣지 효과
 * - 따뜻한 중앙 스팟 조명 + 강한 엣지 비네트
 */
function bgDarkWood(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs>
      <!-- 굵고 깊은 나무결 -->
      <filter id="grain" x="0%" y="0%" width="100%" height="100%"
              color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.013 0.36"
                      numOctaves="5" seed="11" result="t"/>
        <feBlend in="SourceGraphic" in2="t" mode="overlay"/>
      </filter>
      <!-- 따뜻한 오버헤드 스팟 (좁고 집중적) -->
      <radialGradient id="light" cx="50%" cy="32%" r="44%">
        <stop offset="0%"   stop-color="#7A4020" stop-opacity="0.60"/>
        <stop offset="100%" stop-color="#1E1009" stop-opacity="0"/>
      </radialGradient>
      <!-- 강한 엣지 비네트 -->
      <radialGradient id="vig" cx="50%" cy="50%" r="66%">
        <stop offset="42%" stop-color="#1E1009" stop-opacity="0"/>
        <stop offset="100%" stop-color="#050201" stop-opacity="0.68"/>
      </radialGradient>
    </defs>
    <!-- 베이스: 딥 월넛 -->
    <rect width="${S}" height="${S}" fill="#1E1009"/>
    <!-- 플랭크 경계선: 밝은 선 + 어두운 선으로 3D 엣지 표현 -->
    <rect y="116" width="${S}" height="2"   fill="#3E200A" opacity="0.55"/>
    <rect y="118" width="${S}" height="1"   fill="#060302" opacity="0.48"/>
    <rect y="276" width="${S}" height="2"   fill="#3E200A" opacity="0.50"/>
    <rect y="278" width="${S}" height="1"   fill="#060302" opacity="0.40"/>
    <rect y="448" width="${S}" height="2"   fill="#3E200A" opacity="0.55"/>
    <rect y="450" width="${S}" height="1"   fill="#060302" opacity="0.48"/>
    <rect y="628" width="${S}" height="2"   fill="#3E200A" opacity="0.48"/>
    <rect y="630" width="${S}" height="1"   fill="#060302" opacity="0.38"/>
    <rect y="798" width="${S}" height="2"   fill="#3E200A" opacity="0.52"/>
    <rect y="800" width="${S}" height="1"   fill="#060302" opacity="0.44"/>
    <rect y="938" width="${S}" height="1.5" fill="#3E200A" opacity="0.38"/>
    <!-- 나무결 오버레이 -->
    <rect width="${S}" height="${S}" fill="#2C1510" filter="url(#grain)" opacity="0.58"/>
    <!-- 따뜻한 스팟 조명 -->
    <rect width="${S}" height="${S}" fill="url(#light)"/>
    <!-- 강한 엣지 비네트 -->
    <rect width="${S}" height="${S}" fill="url(#vig)"/>
  </svg>`;
  return Buffer.from(svg);
}

function buildBackground(preset: BgPreset): Buffer {
  switch (preset) {
    case 'bright-cream': return bgBrightCream();
    case 'warm-table':   return bgWarmTable();
    case 'dark-wood':    return bgDarkWood();
  }
}

// ── 2단계 그림자 ─────────────────────────────────────────────────────

/**
 * contact shadow: 음식 바닥 바로 아래, 타이트하고 어두운 접촉 그림자
 * cast shadow:    음식 아래로 퍼지는 넓고 부드러운 투영 그림자
 *
 * 두 레이어를 겹쳐 "테이블 위에 놓인 물체" 느낌을 만든다.
 */
function buildShadowSvg(
  fLeft: number,
  fTop: number,
  fW: number,
  fH: number,
  preset: BgPreset,
): Buffer {
  const cx = fLeft + fW / 2;
  const baseY = fTop + fH; // 음식 하단 엣지

  // 배경 타입에 따라 그림자 색 조정
  // - 크림: 살짝 웜 그레이 (순수 검정보다 자연스러움)
  // - 나무: 거의 검정에 가까운 진한 웜 다크
  const sc = preset === 'bright-cream' ? '45,35,25' : '6,3,1';

  // contact shadow (접촉면): 음식 하단에 딱 붙어있는 좁은 타원
  const cRx = fW * 0.28;
  const cRy = Math.max(7, fH * 0.020);
  const cCy = baseY - cRy * 0.4; // 음식 경계 약간 안쪽

  // cast shadow (투영): 아래로 퍼지는 넓은 타원
  const sRx = fW * 0.38;
  const sRy = Math.max(12, fH * 0.048);
  const sCy = baseY + sRy * 0.12; // 음식 경계 약간 아래

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs>
      <filter id="sf"><feGaussianBlur stdDeviation="25"/></filter>
      <filter id="cf"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <!-- cast shadow: 넓고 부드럽게 -->
    <ellipse cx="${cx}" cy="${sCy}" rx="${sRx}" ry="${sRy}"
      fill="rgba(${sc},0.22)" filter="url(#sf)"/>
    <!-- contact shadow: 좁고 어둡게 -->
    <ellipse cx="${cx}" cy="${cCy}" rx="${cRx}" ry="${cRy}"
      fill="rgba(${sc},0.52)" filter="url(#cf)"/>
  </svg>`;
  return Buffer.from(svg);
}

// ── Route handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.PHOTOROOM_API_KEY) {
    return NextResponse.json(
      { error: 'PHOTOROOM_API_KEY가 설정되지 않았습니다.' },
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
  const bgPresetRaw = (formData.get('bgPreset') as string | null) ?? 'dark-wood';
  const bgPreset: BgPreset = VALID_PRESETS.includes(bgPresetRaw as BgPreset)
    ? (bgPresetRaw as BgPreset)
    : 'dark-wood';

  if (!imageFile) {
    return NextResponse.json({ error: '이미지가 없습니다.' }, { status: 400 });
  }
  if (imageFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `이미지가 너무 큽니다. ${MAX_FILE_SIZE / 1024 / 1024}MB 이하로 업로드해 주세요.` },
      { status: 400 },
    );
  }

  // ── Step 1: Photoroom 배경 제거 ──────────────────────────────────
  let removedBgBuffer: Buffer;
  try {
    const photoroomForm = new FormData();
    photoroomForm.append('image_file', imageFile);

    const prRes = await fetch(PHOTOROOM_ENDPOINT, {
      method: 'POST',
      headers: { 'x-api-key': process.env.PHOTOROOM_API_KEY },
      body: photoroomForm,
    });

    if (!prRes.ok) {
      const st = prRes.status;
      if (st === 401 || st === 403)
        return NextResponse.json({ error: 'Photoroom API 인증 실패입니다.' }, { status: 500 });
      if (st === 402)
        return NextResponse.json({ error: 'Photoroom 크레딧이 부족합니다.' }, { status: 402 });
      if (st === 429)
        return NextResponse.json({ error: 'Photoroom API 요청 한도를 초과했습니다.' }, { status: 429 });
      return NextResponse.json({ error: `Photoroom API 오류 (${st}).` }, { status: 500 });
    }

    removedBgBuffer = Buffer.from(await prRes.arrayBuffer());
  } catch (err: unknown) {
    console.error('[compose-test] photoroom error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: '배경 제거 요청에 실패했습니다.' }, { status: 500 });
  }

  // ── Step 2~5: sharp 합성 ─────────────────────────────────────────
  try {
    const removedBgDataUrl = `data:image/png;base64,${removedBgBuffer.toString('base64')}`;

    // 원본 PNG 크기 파악
    const fgMeta = await sharp(removedBgBuffer).metadata();
    const fgW = fgMeta.width ?? S;
    const fgH = fgMeta.height ?? S;

    // object-contain: 캔버스 76% 박스 안에 맞추기 (82%→76% 여백 확보)
    const maxDim = Math.floor(S * 0.76);
    const scale = Math.min(maxDim / fgW, maxDim / fgH, 1);
    const placedW = Math.round(fgW * scale);
    const placedH = Math.round(fgH * scale);

    // 수평: 정중앙
    const left = Math.round((S - placedW) / 2);
    // 수직: 캔버스 52% 중심 (중앙보다 살짝 아래 → 테이블 위에 놓인 느낌)
    const idealTop = Math.round(S * 0.52 - placedH / 2);
    const top = Math.max(40, Math.min(S - placedH - 55, idealTop));

    // 음식 PNG 리사이즈
    const resizedFg = await sharp(removedBgBuffer)
      .resize(placedW, placedH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // 배경 캔버스 렌더링
    const bgBuffer = await sharp(buildBackground(bgPreset)).png().toBuffer();

    // 2단계 그림자 렌더링
    const shadowBuffer = await sharp(
      buildShadowSvg(left, top, placedW, placedH, bgPreset),
    ).png().toBuffer();

    // 합성: 배경 → 그림자 → 음식
    const composedBuffer = await sharp(bgBuffer)
      .composite([
        { input: shadowBuffer, top: 0, left: 0 },
        { input: resizedFg,    top,    left     },
      ])
      .png()
      .toBuffer();

    return NextResponse.json({
      removedBg: removedBgDataUrl,
      composed:  `data:image/png;base64,${composedBuffer.toString('base64')}`,
    });
  } catch (err: unknown) {
    console.error('[compose-test] sharp error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: '이미지 합성에 실패했습니다.' }, { status: 500 });
  }
}
