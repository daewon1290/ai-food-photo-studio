# 템플릿 전략

## 설계 원칙

템플릿은 "감성 설명 문장"이 아니라 **구조화된 규칙**으로 정의한다. 규칙은 `photoTemplates.ts`의 `PhotoTemplate` 타입이 강제한다.

- 배경이 다른 게 아니라, **음식 비율·배치·테이블·소품 세트**가 다른 것이 템플릿의 차이다.
- 규칙이 없으면 AI는 항상 비슷한 이미지로 수렴한다 (특히 Flux).
- `buildPrompt.ts`가 이 규칙을 STYLE DIRECTION / OUTPUT SPEC 블록으로 조립한다.

## 템플릿 구조 (`PhotoTemplate`)

```typescript
// 촬영 규칙
foodRatioA: [number, number]   // A 시안 음식 점유율 (%)
foodRatioB: [number, number]   // B 시안 음식 점유율 (%)
foodPlacement: 'center' | 'offset-third' | 'full-spread'
cameraAngleEn: string
backgroundEn: string
tableSurfaceEn: string
lightingEn: string
colorTemperatureEn: string
moodEn: string

// 소품 규칙
requiredFoodProps: string[]    // 필수 표면·용기
optionalFoodProps: string[]    // 음식 관련 소품 (B 최대 2개)
sceneProps: string[]           // 공간 연출 소품 (B 3~5개, 광고 컨셉 핵심)
garnish: string[]
steamLevel: 'none' | 'medium' | 'strong'
actionElements: ActionElement[]

// 모델 지정
preferredModel: 'gpt' | 'flux'
```

## 16개 템플릿 목록

| # | ID | 한국어 이름 | 용도 | 모델 | 비고 |
|---|---|---|---|---|---|
| 1 | `delivery-hero` | 배달앱 대표사진형 | 배민·쿠팡이츠 메뉴 등록 | GPT | 유일하게 preservation 3단계 노출 |
| 2 | `dark-premium` | 다크 프리미엄·술안주형 | 술안주, 고기, 치킨, 야식 | Flux | |
| 3 | `spicy-action` | 매운 불맛형 | 떡볶이, 불닭, 마라, 볶음면 | GPT | 그릇 교체 경고 있음 |
| 4 | `hot-soup` | 뜨거운 국물·스팀형 | 설렁탕, 국밥, 찌개, 라면 | GPT | |
| 5 | `korean-table-spread` | 한상차림형 | 한정식, 백반, 보쌈 | GPT | 반찬 자동 추가 경고 있음 |
| 6 | `natural-light-healthy` | 자연광 밝은형 | 샐러드, 그레인볼, 브런치 | GPT | |
| 7 | `cafe-drink` | 카페 음료형 | 아이스 음료, 라테, 주스 | GPT | |
| 8 | `fine-dining` | 파인다이닝 단품형 | 스테이크, 코스, 오마카세 | Flux | |
| 9 | `cocktail-bar` | 칵테일·하이볼 바형 | 하이볼, 칵테일, 와인 | Flux | |
| 10 | `white-dessert` | 화이트 미니멀 디저트형 | 케이크, 마카롱, 베이커리 | GPT | |
| 11 | `bbq-grill` | 바비큐·그릴형 | 삼겹살, 갈비, 해산물 구이 | Flux | 실험 템플릿 |
| 12 | `hand-action` | 손동작 라이브형 | 릴스·쇼츠 썸네일, 상세페이지 | GPT | B 시안 실험적 |
| 13 | `season-gift` | 시즌·선물세트형 | 명절 선물세트, 시즌 패키지 | Flux | |
| 14 | `cutout-solid` | 누끼·단색 배경형 | 메뉴판, POS, 인쇄물 | GPT | |
| 15 | `package-delivery` | 포장·배달 박스형 | 배달 전문점, 포장 메뉴 | GPT | |
| 16 | `raw-ingredient` | 원물·신선 재료형 | 정육, 수산, 청과 | Flux | |

## A/B 프롬프트 조립 로직

`buildPrompt.ts`의 `buildGenerationPrompt(params)` → 모델과 variant에 따라 4가지 경로 분기:

```
buildGenerationPrompt
├── model === 'flux'
│   ├── variantIndex 0 → buildFluxStudioPrompt  (~1,200자 압축)
│   └── variantIndex 1 → buildFluxPremiumPrompt (~1,200자 압축)
└── model === 'gpt'
    ├── variantIndex 0 → buildStudioPrompt      (전체 구조화 프롬프트)
    └── variantIndex 1 → buildPremiumPrompt     (전체 구조화 프롬프트)
```

Flux는 유효 프롬프트 길이가 짧아 긴 구조화 프롬프트의 후반부를 무시한다. 압축 프롬프트에서는 차별화 핵심(스타일·소품)을 앞에 배치한다.

## 음식 보존 레이어

모든 프롬프트는 음식 정체성 보호를 최우선에 둔다:

1. **CORE FOOD PRESERVATION** — 음식 자체를 재창조하지 말 것 (A 시안)
2. **FOOD-ONLY PRESERVATION** — 음식은 원본 그대로, 주변은 적극 연출 (B 시안)
3. **FOOD IDENTITY GUARDS** — 먹태·음료 등 특정 음식의 변형 사고 방지
4. **카테고리별 질감 보존** — 튀김(바삭함), 떡볶이(소스 윤기), 음료(레이어) 등

## 공통 네거티브 프롬프트

모든 템플릿에 적용되는 금지 항목 (`COMMON_NEGATIVE_EN`):

- 텍스트·숫자·로고·워터마크·한자·메뉴판 문구 일체 금지
- 손가락 왜곡, 음식 형태 붕괴, 플라스틱 질감, 비현실적 색감

## 실험·조건부 템플릿

| 템플릿 | 상태 | 이유 |
|---|---|---|
| `bbq-grill` | 실험 (`isExperimental: true`) | 그릴 컨텍스트가 강해 닭 → 구운 닭 변형 위험 |
| `hand-action` B 시안 | 조건부 | AI가 새 손을 생성하므로 왜곡 편차 큼 |
| `spicy-action` B 시안 | 경고 | 원본 그릇이 어두운 냄비로 교체될 수 있음 |
| `korean-table-spread` | 경고 | 단품 사진에 반찬이 자동 추가될 수 있음 |

## 커버 이미지 전략

각 템플릿은 세 가지 이미지 관련 필드를 가진다.

| 필드 | 경로 | 역할 | UI 사용 여부 |
|------|------|------|------------|
| `previewImage` | `public/style-examples/*.png` | GPT 프롬프트로 생성한 스타일 대표 이미지. **현재 `TemplateSelect.tsx`의 기준 이미지.** | ✅ 현재 사용 중 |
| `coverImage` | `public/template-covers/*.png` | `scripts/generate-template-covers.ts`로 gpt-image-1을 통해 생성한 AI 이미지. 후보·비교·보관용 자산. | ❌ 현재 미사용 |
| `thumbnailPrompt` | — | `coverImage` 재생성용 프롬프트 텍스트. `generate-template-covers.ts`가 이 값을 읽어 이미지를 생성한다. | — |

### 주의사항

- `previewImage`는 현재 템플릿 선택 UI의 기준 이미지로 유지한다. 임의로 교체하지 않는다.
- `public/template-covers/*.png`는 현재 메인 UI 교체용이 아니다. 후보·비교·보관 목적으로만 관리한다.
- **`TemplateSelect.tsx`에서 `tpl.previewImage`를 `tpl.coverImage`로 교체하는 작업은 사용자의 명시적 승인 없이 진행하지 않는다.**
