#!/usr/bin/env node
// Capture screens that only appear after interaction (the empty-day card, the planner, the canvas) for the process log.
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

try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 2, mobile: false });

  // A day with nothing planned asks for an outfit.
  await open('/?demo');
  await click('Clear plan');
  await sleep(3200); // let the toast fade
  await shoot('today-empty.png', '.week-strip');

  // Planning a day piece by piece, with a piece selected on the canvas.
  await open('/?demo');
  await click('Next week');
  await sleep(300);
  await click('plan an outfit');
  await sleep(300);
  await click('Surprise me');
  await sleep(300);
  await press('.day-planner .canvas-piece');
  await shoot('planner.png', '.day-planner');
} finally {
  ws.close();
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
