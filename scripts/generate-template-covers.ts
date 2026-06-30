/**
 * 16개 템플릿 커버 이미지 일괄 생성
 *
 * 실행: npx ts-node scripts/generate-template-covers.ts
 * 결과: public/template-covers/[template-id].png (1024×1024)
 *
 * 호출: OpenAI images.generate (gpt-image-1) × 16회 순차 실행
 * API 키: .env.local의 OPENAI_API_KEY 사용 (값 출력 금지)
 */
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { photoTemplates } from '../lib/photoTemplates';

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

async function main() {
  loadEnvLocal();
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY 미설정');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const outDir = path.join(__dirname, '..', 'public', 'template-covers');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const targets = photoTemplates.filter(t => t.thumbnailPrompt);
  console.log(`총 ${targets.length}개 커버 생성 시작\n`);

  let success = 0;
  let fail = 0;

  for (const template of targets) {
    const outPath = path.join(outDir, `${template.id}.png`);
    console.log(`▶ [${template.id}] 생성 중... (${template.thumbnailPrompt!.length}자)`);

    try {
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: template.thumbnailPrompt!,
        size: '1024x1024',
        quality: 'high',
        n: 1,
      });

      const imageData = response.data[0];

      if (imageData.b64_json) {
        fs.writeFileSync(outPath, Buffer.from(imageData.b64_json, 'base64'));
      } else if (imageData.url) {
        const r = await fetch(imageData.url);
        fs.writeFileSync(outPath, Buffer.from(await r.arrayBuffer()));
      } else {
        throw new Error('응답에 이미지 데이터 없음');
      }

      const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`  저장: public/template-covers/${template.id}.png (${sizeKb}KB)\n`);
      success++;
    } catch (e) {
      console.error(`  실패: ${template.id} —`, (e as Error).message, '\n');
      fail++;
    }
  }

  console.log(`완료 — 성공 ${success}개 / 실패 ${fail}개`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
