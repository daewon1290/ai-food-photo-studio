# AI 음식사진 스튜디오

자영업자를 위한 AI 메뉴 사진 제작 도구. 스마트폰으로 찍은 음식 사진 1장을 올리면 배달앱·SNS·광고용 이미지로 변환한다.

## 작동 방식

1. **사진 업로드** — JPG·PNG·WEBP, 20MB 이하
2. **스타일 선택** — 16개 템플릿 중 하나를 고른다. 각 템플릿은 대표 이미지로 분위기를 설명한다.
3. **AI 생성** — A(기본 스튜디오형)·B(프리미엄 소품형) 2장이 동시에 생성된다.
4. **다운로드** — 마음에 드는 시안을 PNG로 저장한다.

템플릿은 "어떤 음식"이 아니라 "어떤 분위기"를 정의한다. 사용자가 어떤 음식을 올려도 선택한 템플릿 규칙이 그 음식에 적용된다.

## 빠른 시작

```bash
npm install
# .env.local에 OPENAI_API_KEY=sk-... 추가
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

### 환경 변수

| 키 | 용도 |
|---|---|
| `OPENAI_API_KEY` | gpt-image-1 이미지 생성 (필수) |
| `FAL_KEY` | Flux Kontext Pro 이미지 생성 (Flux 템플릿용) |
| `PHOTOROOM_API_KEY` | 배경 제거·합성 (개발 전용 테스트) |

## 핵심 파일

```
lib/
  photoTemplates.ts   — 16개 템플릿 정의 (촬영 규칙, 소품 목록, 모델 지정)
  buildPrompt.ts      — 템플릿 규칙 → GPT/Flux 프롬프트 조립
  preservationModes.ts — 음식 보존 강도 3단계 (strict / natural / abundant)

app/api/
  generate-photo/     — GPT(gpt-image-1) 라우트 — A/B 2회 병렬 호출
  generate-flux/      — Flux(fal-ai/flux-pro/kontext) 라우트 — A/B 2회 병렬 호출

components/
  TemplateSelect.tsx  — 템플릿 선택 UI
  PhotoComparison.tsx — A/B 결과 비교 UI
  PhotoResult.tsx     — 선택 결과 표시 + 다운로드
```

## 문서

| 파일 | 내용 |
|---|---|
| [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) | 프로젝트 목적, 아키텍처, 3단계 흐름 |
| [docs/TEMPLATE_STRATEGY.md](docs/TEMPLATE_STRATEGY.md) | 16개 템플릿 전략, A/B 설계 원칙 |
| [docs/MODEL_ROUTING.md](docs/MODEL_ROUTING.md) | GPT vs Flux 라우팅 기준 |
| [docs/COST_NOTES.md](docs/COST_NOTES.md) | API 비용 관리 원칙 |
| [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) | 개발 히스토리, 주요 결정 사항 |
| [docs/template-specs.md](docs/template-specs.md) | 초기 8개 템플릿 상세 규격 (참고용) |
