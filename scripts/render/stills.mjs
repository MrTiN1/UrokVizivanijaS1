// Fast multi-frame previews: one bundle, one browser.
// node scripts/render/stills.mjs <CompId> <f1,f2,...> [outPrefix]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [comp, framesArg, prefix = `output/tmp/${comp}`] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const browserExecutable = process.env.REMOTION_BROWSER ?? execSync("ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64 | head -1").toString().trim() + '/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'assets'), onProgress: () => {}});
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id: comp, puppeteerInstance: browser});
const frames = framesArg.split(',').map(Number);
const files = [];
for (const frame of frames) {
  const output = `${prefix}_${frame}.jpg`;
  const t0 = Date.now();
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 90, puppeteerInstance: browser});
  console.log(`frame ${frame} -> ${output} (${Date.now() - t0} ms)`);
  files.push(output);
}
await browser.close({silent: true});
const w = composition.width > composition.height ? 640 : 432;
const h = Math.round((w * composition.height) / composition.width);
execSync(`montage ${files.join(' ')} -tile ${files.length}x1 -geometry ${w}x${h}+3+3 ${prefix}_sheet.jpg`);
console.log(`${prefix}_sheet.jpg`);
