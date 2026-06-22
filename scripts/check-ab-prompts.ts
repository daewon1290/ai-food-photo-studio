import { buildGenerationPrompt } from '../lib/buildPrompt';
import { photoTemplates } from '../lib/photoTemplates';

const template = photoTemplates.find(t => t.id === 'dark-premium')!;

for (const variantIndex of [0, 1] as const) {
  const p = buildGenerationPrompt({
    category: '후라이드 치킨',
    template,
    preservation: 'strict',
    variantIndex,
  });
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`시안 ${variantIndex === 0 ? 'A (기본 스튜디오형)' : 'B (프리미엄 소품형)'} — ${p.length}자`);
  console.log('═'.repeat(70));
  console.log(p);
}
