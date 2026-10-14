#!/usr/bin/env node
// Capture the app's screens for the process log, in the demo closet: each page, the screens that only appear after
// interaction (the empty-day card, planning a day on the board, the canvas, repeating an outfit), the phone layout and
// dark mode. One browser runs throughout, so the demo's photos are cut out once, up front, and every shot has them.
// Drives headless Chrome over the DevTools protocol, so nothing needs installing.
// Usage: node scripts/screenshots-flows.mjs <milestone-folder-name>
// Expects a production server: (cd web && npm run build && npx next start -p 3100)

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const name = process.argv[2];
if (!name) throw new Error('usage: node scripts/screenshots-flows.mjs <milestone-name>');
const out = join('docs/process/screens', name);
const base = process.env.BASE_URL ?? 'http://localhost:3100';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9333;
mkdirSync(out, { recursive: true });

const profile = mkdtempSync(join(tmpdir(), 'rotation-shots-'));
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  target = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).then((l) => l.find((t) => t.type === 'page')).catch(() => undefined);
}
if (!target) throw new Error('Chrome did not start');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) (pending.get(msg.id))(msg), pending.delete(msg.id);
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
const js = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
/** Clicks the first button whose text or label contains `text`. */
const click = (text) =>
  js(`(() => { const b = [...document.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || b.textContent).includes(${JSON.stringify(text)})); b?.click(); return !!b; })()`);
/** A real mouse click at the centre of the last element matching `selector`, so pointer handlers run. */
async function press(selector) {
  const at = await js(`(() => { const r = [...document.querySelectorAll(${JSON.stringify(selector)})].at(-1).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: at[0], y: at[1], button: 'left', clickCount: 1 });
}
async function shoot(file, scrollTo) {
  if (scrollTo) await js(`window.scrollTo(0, document.querySelector(${JSON.stringify(scrollTo)}).getBoundingClientRect().top + scrollY - 24)`);
  await sleep(400);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, file), Buffer.from(data, 'base64'));
  console.log(`ok   ${join(out, file)}`);
}
async function open(path) {
  await send('Page.navigate', { url: `${base}${path}` });
  await sleep(3500);
}

/** Waits until the demo's photos are cut out and cached, so no shot shows the stand-in drawings. */
async function warmUp() {
  await open('/closet?demo');
  let last = -1;
  let still = 0;
  for (let t = 0; t < 240 && still < 12; t++) {
    await sleep(1000);
    const n = await js(`caches.open('rotation-demo-photos-v1').then((c) => c.keys()).then((k) => k.length).catch(() => 0)`);
    still = n === last ? still + 1 : 0;
    last = n;
  }
  console.log(`warm ${last} demo photos cut out`);
}
/** A whole page at desktop width, `height` CSS pixels tall. */
async function page(file, path, height) {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height, deviceScaleFactor: 2, mobile: false });
  await open(`${path}?demo`);
  await shoot(file);
}

try {
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 2, mobile: false });
  await warmUp();

  for (const [file, path, height] of [
    ['today.png', '/', 1700],
    ['closet.png', '/closet', 1500],
    ['closet-board.png', '/builder', 1500],
    ['fill.png', '/fill', 2700],
    ['report.png', '/insights', 1000],
    ['settings.png', '/settings', 1300],
    ['about.png', '/about', 1100],
  ])
    await page(file, path, height);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 2, mobile: false });

  // A day with nothing planned asks for an outfit.
  await open('/?demo');
  await click('Clear plan');
  await sleep(3200); // let the toast fade
  await shoot('today-empty.png', '.week-strip');

  // Planning a day on Today: your pieces beside the outfit board, with a piece selected on the canvas.
  await open('/?demo');
  await click('Next week');
  await sleep(300);
  await click('plan an outfit');
  await sleep(1000);
  await click('Surprise me');
  await sleep(300);
  await press('.outfit-panel .canvas-piece');
  await shoot('planner.png', '.closet-layout');

  // Repeating an outfit: the planner opens on outfits worn before, and one goes on the board.
  await open('/?demo');
  await click('Clear plan');
  await sleep(300);
  await click('Repeat an outfit');
  await sleep(800);
  await js(`document.querySelector('.piece-tray .saved-card')?.click()`);
  await sleep(3200); // let the toast fade
  await shoot('planner-repeat.png', '.closet-layout');

  // Today in dark mode.
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await open('/?demo');
  await shoot('today-dark.png');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

  // Phones: the tabs along the bottom, and planning with the board as a sheet over your pieces.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await open('/?demo');
  await shoot('phone-today.png');
  await click('Next week');
  await sleep(300);
  await click('plan an outfit');
  await sleep(1000);
  await click('Surprise me');
  await sleep(300);
  await shoot('phone-planner.png', '.piece-tray');
} finally {
  ws.close();
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
