import { photoTemplates } from '../lib/photoTemplates';
import { buildGenerationPrompt } from '../lib/buildPrompt';

console.log(`템플릿 수: ${photoTemplates.length}`);
console.log(`ID 목록: ${photoTemplates.map(t => t.id).join(', ')}\n`);

// 중복 ID 검사
const ids = new Set(photoTemplates.map(t => t.id));
if (ids.size !== photoTemplates.length) throw new Error('중복 ID 존재!');

// 전 템플릿 A/B 프롬프트 조립 검증 + 길이 출력
console.log('템플릿별 A/B 프롬프트 길이:');
for (const t of photoTemplates) {
  const a = buildGenerationPrompt({ category: null, template: t, preservation: 'strict', variantIndex: 0 });
  const b = buildGenerationPrompt({ category: null, template: t, preservation: 'strict', variantIndex: 1 });
  console.log(`  ${t.id.padEnd(24)} [${t.preferredModel.toUpperCase().padEnd(4)}] A: ${a.length}자 / B: ${b.length}자  비율 A ${t.foodRatioA.join('–')}% B ${t.foodRatioB.join('–')}%  scene소품 ${t.sceneProps.length}개`);
}

// 신규 템플릿 1개 샘플 출력 (hot-soup B)
const hotSoup = photoTemplates.find(t => t.id === 'hot-soup')!;
const sample = buildGenerationPrompt({ category: null, template: hotSoup, preservation: 'strict', variantIndex: 1 });
console.log(`\n──── hot-soup 시안 B 샘플 ────\n${sample.split('OUTPUT SPEC')[1]?.split('CAMERA DEPTH')[0]}`);
