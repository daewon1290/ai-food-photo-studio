# Template Specs — AI 음식사진 스튜디오

8개 스타일 템플릿 규격서. 코드 수정 기준 문서로 사용한다.

> **변경 원칙**: 프롬프트는 이 문서를 유일한 기준으로 삼는다. 기존 코드와 충돌 시 이 문서가 우선한다.
> 버전 이력은 하단 [Changelog](#changelog)에 요약만 남긴다.

---

## 템플릿 테스트 현황 (2026-06-06 기준)

| # | 템플릿 | MVP 상태 | 메뉴 중심형 | 프리미엄 연출형 | 남은 이슈 |
|---|---|---|---|---|---|
| 1 | 배달앱 대표사진형 | 🟡 수용 가능 | strict·natural·abundant 각 모드 정상 동작 | 모드별 2시안 생성 확인. B시안 차이는 모드별 편차 | strict·abundant B시안 차이 약함 — 모델 한계로 수용 |
| 2 | 다크 프리미엄 메인디쉬형 | ✅ 완료 | 어두운 배경·집중 조명 선명 | 원목 트레이·소품·측면광 차이 명확 | 없음 |
| 3 | 치킨/튀김 크리스피 강조형 | ✅ 완료 | 황금빛 바삭 질감 강조 | 소스컵·소품·광각 구도 차이 명확 | 없음 |
| 4 | 매운 음식 액션형 | ⚠️ 조건부 | 붉은 소스 윤기·드라마틱 조명 양호 | 소품 연출, 분위기 있음 | 원본 그릇 교체 현상 관찰 중 — 업주 거부감 가능성 |
| 5 | 한상차림 풍성형 | ⚠️ 조건부 | 조명·배경 개선, 음식 정체성 유지 | 수저·냅킨 정돈 시도 | 단품 원본에 반찬 자동 추가 — 반찬 있는 사진 권장 안내 필요 |
| 6 | 자연광 건강식형 | ✅ 완료 | 밝은 자연광·깔끔 배경 | 식물·린넨·카페 분위기 차이 명확 | 없음 |
| 7 | 브랜드 컬러 포스터형 | 🟡 수용 가능 | 단색 배경·메뉴판 느낌 양호 | 소품+분위기 연출 개선 (목표 재정의) | 구도 비대칭화 모델 한계 — 목표를 "스타일드 씬"으로 재정의 |
| 8 | 손동작 라이브형 | 🧪 실험적 | 손 동작 자연스러움 (원본 손 無에도 생성) | 배경·소품 분위기 차이 있음 | AI 손 생성 왜곡 편차 큼 — ⚠️ 경고 UI 적용됨 |

**상태 기준:** ✅ 완료 = 품질·차이 모두 안정 | 🟡 수용 가능 = 모델 한계 내 수용 | ⚠️ 조건부 = 사용자 안내 필요 | 🧪 실험적 = 결과 편차 큼

---

## 앱 UX 구조 요약

### 1. 배달앱 대표사진형
사용자가 **메뉴 유지 강도**를 직접 선택한다. 선택지 3개:
- **A. 실제 메뉴 그대로** — 원본 음식·소품 변경 없음. 배경·조명만 정리.
- **B. 자연스럽게 보정** — 배경·조명·구도 개선. 소품 최소 추가 허용.
- **C. 광고처럼 풍성하게** — 비음식 소품·테이블 세팅 적극 허용. 음식 자체는 변경 금지.

### 2. 나머지 7개 템플릿
스타일 선택 시 **자동으로 2가지 시안**이 생성된다:
- **시안 1: 메뉴 중심형** — 원본 메뉴가 잘 보이도록 스타일 적용. 배경·조명·구도 개선 중심. 메뉴 자체와 큰 차이 없이 보존.
- **시안 2: 프리미엄 연출형** — 원본 메뉴 정체성 유지. 새 음식·새 반찬·메뉴 구성 변경 금지. 비음식 소품(나무 테이블, 수저, 냅킨, 컵, 트레이, 소스 그릇 등), 배경, 조명, 여백 구성은 템플릿 분위기에 맞게 적극 허용.

### 공통 금지 규칙 (모든 템플릿)
| 항목 | 규칙 |
|---|---|
| 텍스트 | 이미지 내 모든 문자·숫자·로고·워터마크 완전 금지 |
| 음식 재창조 | 원본 음식의 형태·양·색·질감·메뉴 정체성 변경 금지 |
| 새 음식 추가 | 원본에 없는 음식·반찬·재료 추가 금지 (모든 시안·모드에서) |
| 카메라 기본값 | 전체 접시 또는 대부분 보이게. 극단적 클로즈업 금지 |
| 네거티브 공통 | 손가락 왜곡, 음식 형태 붕괴, 플라스틱 질감, 비현실적 색감 |

---

## 1. 배달앱 대표사진형 (`delivery-hero`)

**한 줄 설명**: 밝은 단색 배경에 음식 중앙 배치, 텍스트 여백 확보
**사용 케이스**: 배달의민족·쿠팡이츠 대표사진, 메뉴 등록

**배경**: 순백색 또는 밝은 단색. 그라디언트·패턴·텍스처 금지.
**조명**: 정면 소프트박스. 균일한 밝기. 그림자 최소화.
**구도**: 45도 하이앵글 또는 정면. 접시 전체 프레임 안에 담기.
**색감**: 밝고 선명. 높은 채도. 먹음직스러운 자연색.

---

### 메뉴 유지 강도 A — 실제 메뉴 그대로

**설명**: 원본 음식과 소품을 그대로 유지한다. 배경과 조명만 깔끔하게 정리한다.

**변경 허용**: 배경을 밝은 단색으로 교체, 조명 균일화, 그림자 제거
**변경 금지**: 소품 추가·제거, 접시 교체, 카메라 각도 변경, 음식 배치 변경

**GPT 프롬프트**:
```
Re-style this food photo for a delivery app menu listing — strict preservation mode.
Replace the background with a pure white or bright solid color. Apply even front softbox lighting with minimal shadows. Keep the food, plate, props, and composition exactly as in the original — do not move, add, or remove anything except the background and lighting. The food must occupy approximately 60–70% of the frame. Sharp focus. Vivid and appetizing color. No text anywhere.
```

---

### 메뉴 유지 강도 B — 자연스럽게 보정

**설명**: 배경·조명·구도를 개선하고, 최소한의 소품(접시 테두리, 냅킨)이 자연스럽게 등장할 수 있다. 음식 자체는 변경하지 않는다.

**변경 허용**: 배경 교체, 조명 개선, 카메라 각도 미세 조정, 접시 테두리·냅킨 등 최소 소품 자연 노출
**변경 금지**: 음식 재배치, 새 음식 추가, 소스·재료 추가

**GPT 프롬프트**:
```
Re-style this food photo for a delivery app menu listing — natural enhancement mode.
Replace the background with a bright white or clean solid color. Apply warm and even front lighting. The food should occupy approximately 55–65% of the frame. A simple plate rim or clean linen napkin edge may appear naturally at the frame border — keep it minimal. Do not add any food items not in the original. Keep the food's shape, color, and arrangement true to the original. Slightly warmer color tone than mode A. No text anywhere.
```

---

### 메뉴 유지 강도 C — 광고처럼 풍성하게

**설명**: 비음식 소품과 테이블 세팅을 적극적으로 추가해 광고 느낌을 낸다. 음식 자체는 변경하지 않는다. 시안 A보다 카메라를 더 멀리 빼서 테이블 구성을 보여준다.

**변경 허용**: 배경 교체, 조명 개선, 나무 트레이·냅킨·소스 그릇·수저·컵 등 비음식 소품 추가, 카메라 후퇴
**변경 금지**: 원본에 없는 음식·재료·반찬 추가, 음식 형태 변경

**GPT 프롬프트**:
```
Re-style this food photo for a delivery app menu listing — abundant advertisement mode.
Replace the background with a bright clean solid color. Apply warm even studio lighting. Pull the camera back so the food occupies approximately 45–55% of the frame — show more table surface. Add tasteful non-food props around (not on) the food: a clean linen napkin, small sauce dish, simple chopsticks or cutlery, a small side bowl, or complementary tableware. Do not add any food items, ingredients, or garnishes not visible in the original. The food must remain clearly visible and appetizing at the center. No text anywhere.
```

---

### 결과 평가 기준
- [ ] 배달앱 썸네일(120px)에서 음식 즉시 식별 가능
- [ ] 배경이 밝은 단색이고 음식과 분리됨
- [ ] 텍스트 여백 상하좌우 확보
- [ ] A/B/C 간 시각적 차이 명확 (A: 클린 → C: 풍성)
- [ ] 원본에 없는 음식이 추가되지 않음 (C 포함)

---

## 2. 다크 프리미엄 메인디쉬 (`dark-premium`)

**한 줄 설명**: 검은 배경과 따뜻한 측면 조명, 고급 식당 메뉴판 느낌
**사용 케이스**: 고기류, 전골, 치킨, 술안주, 프리미엄 한식 메인 요리

**배경**: 딥 블랙 또는 짙은 원목. 밝은 배경 금지.
**조명**: 따뜻한 측면 스포트라이트(2700-3200K). 은은한 림라이트로 윤곽 살리기. 차가운 조명 금지.
**구도**: 30-45도 하이앵글. 접시 전체 또는 대부분이 보여야 한다.
**색감**: 어둡고 드라마틱. 따뜻한 황금빛 하이라이트. 튀김류는 어둠 속에서도 황금빛 유지 필수.
**적합하지 않은 음식**: 샐러드, 밝은 색감 디저트, 음료. 어두운 배경에서 색이 죽는 음식.

---

### 시안 1: 메뉴 중심형

**방향**: 다크 프리미엄 스타일은 배경·조명·접시에만 적용. 음식이 프레임의 45-55%를 차지. 원본 메뉴가 명확하게 보여야 한다.

**변경 허용**: 배경 교체(딥 블랙/원목), 접시를 검정 도자기로 교체, 측면 조명 적용, 최소 소품(냅킨, 소스 그릇)
**변경 금지**: 음식 재배치, 새 음식 추가, 음식 형태 변경

**GPT 프롬프트**:
```
Re-style this food photo in a dark premium restaurant style — menu-focused variant.
Apply dark premium styling to the background (deep black or dark wood), plate (dark matte ceramic), and lighting only. Use a single warm side spotlight — the food must remain clearly visible and appetizing, not hidden in shadow. The food should occupy approximately 45–55% of the frame. Show the full plate. Minimal props only: a linen napkin or small sauce bowl at most. 30–45 degree overhead angle. High contrast with warm golden highlights. If the food is fried, keep it visibly golden and crispy even in the dark scene. No new food elements. No text.
```

---

### 시안 2: 프리미엄 연출형

**방향**: 시안 1보다 카메라를 더 빼서 테이블 구성을 보여준다. 음식 30-45% 점유. 비음식 소품을 풍성하게 추가해 프리미엄 분위기를 높인다.

**변경 허용**: 시안 1의 모든 항목 + 나무 트레이, 금속 수저, 린넨 냅킨, 소스 그릇, 사이드 그릇, 레몬 웨지 등 비음식 소품 추가. 카메라 후퇴.
**변경 금지**: 원본에 없는 음식·반찬·재료 추가

**GPT 프롬프트**:
```
Re-style this food photo in a dark premium restaurant style — premium styled variant.
Pull the camera back further than variant 1: the food should occupy approximately 30–45% of the frame, showing more table surface. Deep black or dark wood background. Warm side spotlight with dark negative space and soft shadows. Use a richer table setting than variant 1: dark wooden tray or surface, black matte ceramic plate, linen napkin, small sauce bowl, small side dish bowl, subtle cutlery, or a lemon wedge — placed around the food, not on it. Do not add any food items not in the original. The food must remain clearly visible and appetizing — do not let it blend into the dark background. If fried, keep it visibly golden. The visual difference from variant 1 must be immediately obvious: more props, more table visible, richer staging. No text.
```

---

### 결과 평가 기준
- [ ] 어두운 배경에서도 음식 윤곽과 질감 식별 가능
- [ ] 음식이 어두운 배경에 묻히지 않음
- [ ] 시안 1/2 간 소품 밀도·카메라 거리 차이 명확
- [ ] 원본에 없는 음식이 추가되지 않음
- [ ] 튀김류는 어둠 속에서도 황금빛 유지

---

## 3. 치킨/튀김 크리스피 강조형 (`crispy-fried`)

**한 줄 설명**: 황금빛 튀김 질감과 소스 윤기를 극대화한 스타일
**사용 케이스**: 치킨, 닭강정, 돈까스, 튀김류

**배경**: 어두운 단색 또는 브랜드 컬러. 밝은 배경 지양.
**조명**: 강한 링라이트 또는 상단 집중 조명. 튀김옷 요철 질감이 드러나야 함.
**구도**: 로우앵글 측면 또는 45도 드라마틱 구도.
**색감**: 황금빛 갈색. 높은 채도. 바삭함이 느껴지는 질감.
**적합하지 않은 음식**: 국물요리, 샐러드, 찜·조림류.

---

### 시안 1: 메뉴 중심형

**방향**: 어두운 배경과 강한 조명으로 바삭한 질감을 강조. 음식 60-70% 점유. 소품 없이 음식 자체가 주인공.

**GPT 프롬프트**:
```
Re-style this fried food photo to emphasize the crispy texture — menu-focused variant.
Replace the background with a dark solid color. Apply a strong ring light or overhead spotlight that highlights the crunchy surface texture of the fried coating. The food should occupy approximately 60–70% of the frame. Show the food clearly from a low angle or 45-degree angle. No props. The fried coating must look golden, crispy, and visibly textured — never soggy or dull. Preserve the original food's shape, piece count, and arrangement exactly. No text.
```

---

### 시안 2: 프리미엄 연출형

**방향**: 소스컵, 감자튀김, 치킨무 등 브랜드 분위기에 맞는 비음식 소품 추가. 음식 40-55% 점유으로 테이블 구성을 보여줌.

**변경 허용**: 소스컵, 감자튀김(원본에 없어도 가능 — 비음식 소품으로 처리), 치킨무, 냅킨, 브랜드 트레이
**변경 금지**: 원본에 없는 치킨 조각·반찬·재료 추가

> **주의**: 감자튀김은 비음식 소품 성격으로 허용하되, 화면의 보조 역할에 한정한다.

**GPT 프롬프트**:
```
Re-style this fried food photo in a premium fried food advertisement style — premium styled variant.
Pull the camera back slightly: the food should occupy approximately 40–55% of the frame. Dark background. Strong ring light or overhead spotlight creating crispy texture highlights. Add supporting props around (not on) the food: a small sauce cup, a few fries on the side, pickled radish, or a clean napkin — placed naturally to complement the scene. Do not add more fried chicken pieces or any main food items not in the original. Keep the original food's golden crispy appearance the priority. Low angle or 45-degree dramatic composition. No text.
```

---

### 결과 평가 기준
- [ ] 튀김옷의 바삭한 요철 질감이 느껴짐
- [ ] 황금빛 컬러 유지 (어두운 배경에서도)
- [ ] 시안 1/2 간 소품 구성·카메라 거리 차이 명확
- [ ] 원본에 없는 닭 조각·주요 식재료가 추가되지 않음

---

## 4. 매운 음식 액션형 (`spicy-action`)

**한 줄 설명**: 붉은 소스 윤기와 뜨거운 김을 드라마틱하게 강조한 스타일
**사용 케이스**: 떡볶이, 마라탕, 볶음면, 닭볶음탕

**배경**: 어두운 배경 또는 붉은 계열.
**조명**: 측면 드라마틱 조명. 붉은 소스 윤기를 살리는 방향. 차가운 조명 금지.
**구도**: 측면 또는 약간 낮은 앵글. 소스와 김이 잘 드러나는 각도.
**색감**: 강렬한 붉은 계열. 윤기 있는 소스. 뜨거운 느낌. 소스를 과도하게 어둡게 하거나 탁하게 만들지 않는다.
**적합하지 않은 음식**: 건식 음식, 샐러드, 디저트.

---

### 시안 1: 메뉴 중심형

**방향**: 배경·조명·구도 개선으로 소스 윤기와 뜨거운 김을 강조. 음식 60-70% 점유. 원본에 있는 소품만 유지.

**GPT 프롬프트**:
```
Re-style this spicy food photo with dramatic lighting and composition — menu-focused variant.
Replace the background with a dark or deep red-toned color. Apply strong side lighting that creates a vivid hot sheen on the red sauce — the sauce must look glossy, intensely red, and appetizing. If steam is visible in the original, enhance it naturally. The food should occupy approximately 60–70% of the frame. Compose from a side angle or slightly low angle. Do not add any new props or food elements. The composition should feel energetic through lighting and angle alone. No text.
```

---

### 시안 2: 프리미엄 연출형

**방향**: 비음식 소품(냄비, 수저, 고추 가니쉬, 냅킨)과 배경 연출을 추가해 더 드라마틱하게. 음식 40-55% 점유.

**변경 허용**: 한국식 냄비·뚝배기(원본 그릇 유지 또는 업그레이드), 젓가락·수저, 고추 가니쉬, 냅킨
**변경 금지**: 원본에 없는 음식 재료·반찬 추가

**GPT 프롬프트**:
```
Re-style this spicy food photo in a dramatic premium style — premium styled variant.
Pull the camera back slightly: the food should occupy approximately 40–55% of the frame. Dark or deep red-toned background. Strong dramatic side lighting with hot sheen on the glossy red sauce. Add tasteful non-food props around the dish: chopsticks or a spoon resting on the rim, a small chili pepper garnish on the side, a linen napkin, or a dark table surface visible at the edges. Do not add any food items or ingredients not in the original. The red sauce must remain vivid and deeply appetizing — do not over-darken or desaturate it. No text.
```

---

### 결과 평가 기준
- [ ] 붉은 소스 윤기 표현 (과도하게 어둡거나 탁하지 않음)
- [ ] 생동감 있는 구도
- [ ] 시안 1/2 간 소품 구성·카메라 거리 차이 명확
- [ ] 원본에 없는 음식·재료가 추가되지 않음

---

## 5. 한상차림 풍성형 (`korean-table-spread`)

**한 줄 설명**: 메인 요리와 원본 반찬을 탑뷰로 담는 풍성한 한상 스타일
**사용 케이스**: 한식 정식, 전골, 고기류, 가족·회식 메뉴

**배경**: 한국식 전통 테이블 또는 나무 식탁.
**조명**: 균일한 자연광 또는 전체 조명. 모든 그릇이 고르게 밝아야 한다.
**구도**: 오버헤드 탑뷰 또는 45도 하이앵글. 전체 한상이 한 프레임에.
**색감**: 따뜻하고 풍성. 한국식 자연 색감.
**적합하지 않은 음식**: 단일 메뉴, 음료, 디저트.

---

### 시안 1: 메뉴 중심형

**방향**: 원본에 있는 메인 요리와 반찬을 그대로 유지. 배경·조명·구도만 개선해 더 풍성해 보이게.

**GPT 프롬프트**:
```
Re-style this Korean table spread photo — menu-focused variant.
Keep all original dishes exactly as they are — do not add, remove, or replace any food. Improve the background to a warm wooden Korean dining table. Apply warm, even natural lighting that illuminates all dishes equally. Adjust the camera to an overhead or 45-degree high angle that best captures the full spread. The result should feel warmer and more professionally photographed than the original, without changing the food composition. No text.
```

---

### 시안 2: 프리미엄 연출형

**방향**: 원본 음식 구성은 그대로 유지. 비음식 소품(수저, 냅킨, 테이블 소재)을 추가해 더 풍성한 한상 분위기를 연출. 풍성함은 배치·조명·비음식 소품으로만 표현.

**변경 허용**: 전통 금속 수저, 린넨 냅킨, 테이블 소재 개선, 그릇 간격 및 배치 조정
**변경 금지**: 원본에 없는 반찬·음식·재료 추가. 기존 반찬 교체.

**GPT 프롬프트**:
```
Re-style this Korean table spread photo in a premium style — premium styled variant.
Keep all original food dishes exactly as they are — do not add any new food, banchan, or ingredients not visible in the original. Improve the table setting around the food: warm wooden table surface, traditional Korean metal chopsticks and spoon placed naturally beside the main dish, a clean linen napkin, better spacing between existing dishes. Apply warm, even natural lighting. Shoot from overhead or 45-degree angle. The sense of abundance must come entirely from the lighting, camera angle, and non-food elements — not from adding more food. No text.
```

---

### 결과 평가 기준
- [ ] 원본에 없는 반찬·음식이 추가되지 않음
- [ ] 전체 한상이 한 프레임에 담김
- [ ] 모든 그릇이 그림자 없이 잘 보임
- [ ] 시안 1/2 간 소품 구성 차이 명확

---

## 6. 자연광 건강식형 (`natural-light-healthy`)

**한 줄 설명**: 밝은 자연광과 식물·린넨 소품으로 건강하고 에어리한 무드
**사용 케이스**: 샐러드, 브런치, 카페 메뉴, 디저트

**배경**: 흰색 또는 밝은 원목 테이블. 어두운 배경 금지.
**조명**: 창문 방향 자연광. 밝고 에어리. 인공조명 느낌 없이.
**구도**: 오버헤드 플랫레이 또는 45도 하이앵글.
**색감**: 밝고 청량. 건강하고 자연스러운 느낌. 과포화 없이.
**적합하지 않은 음식**: 야식, 고기류, 기름진 음식.

---

### 시안 1: 메뉴 중심형

**방향**: 배경·조명을 밝고 에어리하게 교체. 음식만 선명하게. 소품 없이 음식이 주인공.

**GPT 프롬프트**:
```
Re-style this food photo in a bright natural light style — menu-focused variant.
Replace the background with a white or light wood table surface. Apply soft window natural lighting — bright, airy, gentle soft shadows. The food should occupy approximately 60–70% of the frame. No additional props. Shoot from an overhead flat lay or 45-degree high angle. Colors should feel fresh, clean, and healthy. No text.
```

---

### 시안 2: 프리미엄 연출형

**방향**: 자연광 배경에 소품을 추가해 에어리한 카페 스타일 연출. 음식 40-55% 점유.

**변경 허용**: 소형 녹색 식물, 린넨 냅킨, 유리컵, 허브 가니쉬, 밝은 도자기 접시
**변경 금지**: 원본에 없는 음식·음료·재료 추가

**GPT 프롬프트**:
```
Re-style this food photo in a bright natural light healthy-food style — premium styled variant.
Replace the background with a white or light wood table surface. Apply soft window natural lighting. Pull the camera back slightly: the food should occupy approximately 40–55% of the frame. Add tasteful non-food props around the dish: a small green plant or herb sprig, a linen napkin, a simple glass of water, or a clean ceramic side plate. Do not add any food items not in the original. The result should feel like a wellness cafe or food blog photo. No text.
```

---

### 결과 평가 기준
- [ ] 밝고 에어리한 느낌 (인공조명 느낌 없음)
- [ ] 원본에 없는 음식이 추가되지 않음
- [ ] 시안 1/2 간 소품 구성 차이 명확

---

## 7. 브랜드 컬러 포스터형 (`brand-poster`)

**한 줄 설명**: 강한 단색 배경과 텍스트 여백으로 SNS 광고처럼 정돈
**사용 케이스**: SNS 광고, 음료·패키지 홍보, 브랜딩 이미지

**배경**: 강한 단색. 그라디언트·패턴·텍스처 금지.
**조명**: 균일하고 깔끔한 스튜디오 조명. 그림자 최소화.
**구도**: 정면 또는 약간의 45도 하이앵글. 음식 중앙.
**색감**: 선명한 단색 대비. 음식과 배경의 명확한 분리.
**적합하지 않은 음식**: 복잡한 한상차림.

---

### 시안 1: 메뉴 중심형

**방향**: 단색 배경으로 교체. 음식을 중앙 배치해 최대한 크게. 소품 없음. 메뉴판·카탈로그 느낌.

**음식 점유율**: 70–85%

**GPT 프롬프트**:
```
Re-style this food photo as a product catalog menu shot — menu-focused variant.
This variant is a clean, maximum-food-visibility shot: the food must occupy 70–85% of the frame.
Bold single solid-color background. No gradient, no pattern, no graphic elements.
Place the food dead-center. Apply perfectly even front studio lighting — no dramatic shadows.
No props whatsoever. The plate or packaging is the only supporting element.
Pull the camera close enough that the food fills most of the frame.
The result must feel like a high-end menu board or product catalog photo: clean, factual, appetite-first. No text.
```

---

### 시안 2: 프리미엄 연출형

**방향**: 같은 단색 배경에 소품·비네트를 더해 분위기 있는 SNS 홍보 이미지로 연출. 구도 비대칭화는 모델 한계로 포기하고, "스타일드 씬 + 분위기 강화"를 목표로 한다.

> **목표 재정의 (2026-06-06)**: gpt-image-1은 원본 음식 구도를 크게 변경하지 못하는 구조적 한계가 있다. 광고 포스터 수준의 비대칭 구도 대신 "소품·조명·비네트를 활용한 스타일드 씬"으로 목표를 조정했다.

**음식 점유율**: 55–65%

**변경 허용**: 소스 그릇, 린넨 냅킨, 참깨 등 소형 소품, 비네트 효과, 방향성 있는 측면 조명
**변경 금지**: 원본에 없는 음식 추가. 음식 형태 변경.

**GPT 프롬프트**:
```
Re-style this food photo as a styled brand scene — premium styled variant.
Pull the camera back so more of the table surface, background, and surroundings are visible —
the food should occupy approximately 55–65% of the frame.
Keep the food in the center but show enough breathing room around it so the scene feels spacious and composed.
BACKGROUND: Use a bold solid brand color. Apply a gentle radial vignette (darker at the corners,
slightly lighter near the food center) to add depth and draw the eye to the food.
LIGHTING: Use warm directional lighting from one side — not flat front.
The food should have a visible soft highlight and a grounding shadow.
ATMOSPHERE: The scene should feel intentionally styled — as if shot for an Instagram promotional post. Rich, warm, and brand-forward.
PROPS: Place 1–2 supporting props around (never on) the food: a small sauce dish,
a folded linen napkin, or scattered sesame seeds. Props complement the mood; the food remains the clear focal point.
RESULT: The image must feel like a polished SNS promotional photo — more atmospheric and styled
than the menu-focused variant, but grounded in the same food and brand color. No text.
```

---

### 결과 평가 기준
- [ ] 시안 1: 음식 70–85% 점유, 단색 배경, 소품 없음
- [ ] 시안 2: 음식 55–65% 점유, 소품 1–2개, 비네트 또는 분위기 연출
- [ ] 배경 단색이 균일함
- [ ] 음식과 배경 간 대비 명확
- [ ] 원본에 없는 음식이 추가되지 않음
- [ ] 시안 1/2 간 소품 밀도·여백 차이 명확

---

## 8. 손동작 라이브형 (`hand-action`)

**한 줄 설명**: 음식을 집거나 소스를 붓는 생동감 있는 손 동작 순간
**사용 케이스**: 릴스·쇼츠 썸네일, 상세페이지, 스토리 콘텐츠

**배경**: 자연스러운 식탁 또는 주방.
**조명**: 자연광 또는 따뜻한 실내 조명.
**구도**: 측면 또는 약간 낮은 앵글. 손 동작이 명확히 보이도록.
**색감**: 자연스럽고 생동감 있는 색감.

> **사용 조건**: 시안 1(메뉴 중심형)은 원본에 손이 없어도 동작한다. 단, 시안 2(프리미엄 연출형)는 새 손을 생성하므로 **실험적 기능**이며 왜곡·기형 등 실패 가능성이 있다. 원본에 손이 이미 있는 경우에 결과 품질이 가장 높다.

---

### 시안 1: 메뉴 중심형

**방향**: 배경·조명·구도를 개선해 음식이 생동감 있어 보이도록. 손이 원본에 있으면 자연스럽게 보정. 없으면 음식 중심 구도로만 처리.

**GPT 프롬프트**:
```
Re-style this food photo for social media content — menu-focused variant.
Apply a natural dining table or kitchen background. Use warm indoor or soft natural lighting. Compose from a side angle or slightly low angle. If a hand or utensil is already present in the original, refine it to look natural and in motion — correct any distortion and improve lighting on the hand. If no hand is present, focus on making the food look dynamic and appetizing through lighting and composition alone. The food must be the main subject. No text.
```

---

### 시안 2: 프리미엄 연출형 ⚠️ 실험적

**방향**: 손과 식사 도구를 추가하거나 강화해 생동감 있는 액션 샷을 연출. 원본에 손이 없는 경우 AI가 새 손을 생성하며, 이 경우 왜곡·기형 위험이 있다.

> **실패 조건**: 원본에 손이 없는 경우 생성된 손이 왜곡·기형일 가능성이 높다. 결과물을 반드시 검토 후 사용할 것.

**변경 허용**: 자연스러운 손 동작, 젓가락·포크·숟가락 등 식사 도구, 동작을 강조하는 구도 변경
**변경 금지**: 손이 음식보다 주인공이 되는 것, 음식 형태 변경, 원본에 없는 음식 추가

**GPT 프롬프트**:
```
Re-style this food photo with a natural hand action element — premium styled variant (experimental).
If a hand is already in the original, enhance its natural appearance and motion. If no hand is present, add a single realistically-shaped hand using chopsticks or a fork to pick up or interact with the food — note this may produce distortion if the original has no hand. Natural dining table or kitchen background. Warm indoor or soft natural lighting. Side or slightly low angle. The food must remain the main subject — the hand adds energy without dominating the frame. Do not add any food items not in the original. No text.
```

---

### 결과 평가 기준
- [ ] 손 모양이 자연스러움 (왜곡·기형 없음) — 시안 2에서 특히 검토 필요
- [ ] 손이 음식보다 주인공이 되지 않음
- [ ] 원본에 없는 음식이 추가되지 않음
- [ ] 음식이 여전히 먹음직스럽게 보임

---

## Changelog

| 날짜 | 변경 내용 |
|---|---|
| 2026-06-04 | 최초 규격서 작성. 기존 코드 기반 12개 항목 정리. Flux/GPT Active Prompt 1벌씩 작성. |
| 2026-06-04 | 앱 UX 구조 반영해 전체 재작성. 배달앱 대표사진형 3단계(A/B/C), 나머지 7개 템플릿 시안 1(메뉴 중심형)/시안 2(프리미엄 연출형) 구조로 개편. 비음식 소품 허용 범위 명시. 손동작 라이브형 시안 2 실험적 기능 경고 추가. |
| 2026-06-06 | 8개 템플릿 전수 생성 테스트 완료. 테스트 현황 표 추가. 브랜드 컬러 포스터형 프리미엄 연출형 목표 재정의 — 광고 포스터에서 스타일드 씬으로 조정 (gpt-image-1 구도 변경 한계). 각 템플릿 variantDescriptionsKo 추가. quality 파라미터 high 적용. |
