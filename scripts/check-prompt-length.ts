import { buildGenerationPrompt } from '../lib/buildPrompt';
import { photoTemplates } from '../lib/photoTemplates';

const template = photoTemplates.find(t => t.id === 'hand-action')!;
const promptB = buildGenerationPrompt({
  category: '후라이드 치킨',
  template,
  preservation: 'strict',
  variantIndex: 1,
});

console.log('chars:', promptB.length);
console.log('─'.repeat(60));
console.log(promptB);
