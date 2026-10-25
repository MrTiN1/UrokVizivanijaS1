// node scripts/render/bench.mjs which1,which2,...  → warm per-frame render time
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {execSync} from 'node:child_process';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const browserExecutable = execSync("ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64 | head -1").toString().trim() + '/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'assets')});
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions: {gl: 'angle'}});
for (const which of process.argv[2].split(',')) {
  const composition = await selectComposition({serveUrl, id: 'Bench', inputProps: {which}, puppeteerInstance: browser});
  const ts = [];
  for (const frame of [10, 40, 70, 100]) {
    const t0 = Date.now();
    await renderStill({serveUrl, composition, frame, output: `/tmp/claude-0/bench_${which}.jpg`, imageFormat: 'jpeg', inputProps: {which}, puppeteerInstance: browser});
    ts.push(Date.now() - t0);
  }
  console.log(which.padEnd(12), ts.slice(1).map((x) => String(x).padStart(5)).join(' '), 'ms');
}
await browser.close({silent: true});
