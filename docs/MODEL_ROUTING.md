# 모델 라우팅

## 두 모델 비교

| | GPT (`gpt-image-1`) | Flux (`fal-ai/flux-pro/kontext`) |
|---|---|---|
| API | OpenAI `images.edit` | fal.ai subscribe |
| 강점 | 긴 구조화 프롬프트 준수, 텍스트 금지 신뢰도 높음 | 질감·색감 표현, 어두운 배경 연출 |
| 약점 | 질감 과도한 매끄러움, 어두운 배경에서 음식이 묻힘 | 유효 프롬프트 길이 짧음 — 긴 프롬프트 후반부 무시 |
| 프롬프트 전략 | 전체 구조화 프롬프트 (~3,000~4,000자) | 압축 프롬프트 (~1,200자 이내, 핵심을 앞에) |

## 템플릿별 preferredModel

### GPT 우세 템플릿

| 템플릿 | 이유 |
|---|---|
| `delivery-hero` | 밝은 단색 배경, 텍스트 금지 신뢰도 필요 |
| `spicy-action` | 빨간 소스 색 재현, 스팀 표현 |
| `hot-soup` | 스팀 글로우, 복잡한 소품 배치 준수 |
| `korean-table-spread` | 복잡한 구성물 프롬프트 준수 |
| `natural-light-healthy` | 밝고 에어리한 색온도 표현 |
| `cafe-drink` | 투명 글라스 레이어 보존 |
| `white-dessert` | 깔끔한 화이트 배경 |
| `hand-action` | 손 동작 자연스러움 |
| `cutout-solid` | 완전 균일 배경 표현 |
| `package-delivery` | 포장 용기 인식, 텍스트 금지 |

### Flux 우세 템플릿

| 템플릿 | 이유 |
|---|---|
| `dark-premium` | 어두운 배경에서 음식 질감(황금 바삭함) 유지 탁월 |
| `fine-dining` | 딥 다크 배경 + 정제된 그림자 |
| `cocktail-bar` | 어두운 바 + 보케 표현 |
| `bbq-grill` | 숯불 글로우, 연기, 불맛 텍스처 |
| `season-gift` | 어두운 페스티브 + 보케 조명 |
| `raw-ingredient` | 쿨톤 크리스프 질감, 신선함 강조 |

## 모델 결정 순서

```
modelOverride (개발 UI)
  → 'auto' → template.preferredModel
              → 없으면 'gpt' (폴백)
```

실제 API 엔드포인트는 `app/page.tsx`의 `handleGenerate`에서 결정:

```typescript
endpoint = effectiveModel === 'flux' ? '/api/generate-flux' : '/api/generate-photo';
```

## Flux 압축 프롬프트 설계 원칙

Flux Kontext Pro는 수백 토큰 수준의 유효 프롬프트만 처리하는 것으로 실측 확인됨. 긴 구조화 프롬프트를 그대로 주면 템플릿이 달라도 거의 동일한 이미지로 수렴했다.

압축 프롬프트 규칙:
1. 스타일 방향(배경·조명·색온도·무드)을 가장 앞에 배치
2. 소품 목록은 핵심만 — sceneProps 최대 5개
3. 음식 보존 지시는 한 줄로 압축
4. 전체 길이 1,200자 이내 목표

Flux 프롬프트 전용 음식 보존 한 줄 매핑 (`FLUX_FIDELITY`):

| 모드 | 압축 지시 |
|---|---|
| strict | Reproduce the food exactly as photographed; only lighting and color cleanup on the food itself. |
| natural | Gentle enhancement of the food's color and gloss is allowed; shape, amount, and arrangement unchanged. |
| abundant | Ad-level gloss and vivid color on the food are allowed; same dish, same piece count, nothing added. |

## 강제 오버라이드 (개발 전용)

`app/page.tsx` UI에서 모델을 강제 지정할 수 있다:
- `auto` — 템플릿의 `preferredModel` 사용
- `gpt` — GPT 강제
- `flux` — Flux 강제

오버라이드 시 프롬프트 빌더도 해당 모델에 맞는 경로(압축 vs 전체)를 사용한다.
