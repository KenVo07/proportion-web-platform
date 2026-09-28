// Founder-review screenshot set in docs/screenshots/:
//   fold-<width>.png            first screen after the hero intro, at 320 / 390 / 768 / 1024 / 1440 / 1920
//   story-<width>-<frame>.jpg   each of the 8 story frames at 1440 and 390 (reduced motion = final frame)
//   page-<width>-NN.jpg         the whole page as consecutive viewport screens at 1440 and 390
//   motion-*.jpg                filmstrips of the hero intro, the fact flights and the booking chain
// SHOTS_DIR overrides the output folder (used for the live-Showcase variant).
import { chromium } from "playwright";
import { mkdirSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { start } from "./serve.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.env.SHOTS_DIR || join(root, "docs", "screenshots");
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (/\.(png|jpg)$/.test(f)) rmSync(join(out, f));
const server = await start(4401);
const URL_ = "http://127.0.0.1:4401/";
const browser = await chromium.launch();
const mobile = (w) => ({ isMobile: w < 800, hasTouch: w < 800 });
const reach = async (page, n) => {
  let g = 0;
  while ((await page.evaluate(() => +document.querySelector(".stage").dataset.state)) < n && g++ < 900) {
    await page.evaluate(() => scrollBy(0, 36)); await page.waitForTimeout(12);
  }
  await page.evaluate(() => scrollBy(0, innerWidth >= 960 ? 60 : 40));
};

for (const [w, h] of [[320, 568], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, ...mobile(w) });
  await page.goto(URL_, { waitUntil: "load" });
  await page.waitForTimeout(3800);
  await page.screenshot({ path: join(out, `fold-${w}.png`) });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`fold ${w}x${h}: horizontal overflow ${overflow}px`);
  await page.close();
}
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce", ...mobile(w) });
  await page.goto(URL_, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(out, `story-${w}-0.jpg`), type: "jpeg", quality: 80 });
  for (let n = 1; n <= 7; n++) { await reach(page, n); await page.waitForTimeout(500); await page.screenshot({ path: join(out, `story-${w}-${n}.jpg`), type: "jpeg", quality: 80 }); }
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  let i = 0;
  for (let y = 0; y < H; y += Math.round(h * 0.92)) {
    await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(450);
    await page.screenshot({ path: join(out, `page-${w}-${String(i++).padStart(2, "0")}.jpg`), type: "jpeg", quality: 74 });
  }
  console.log(`story + page ${w}: ${i} screens`);
  await page.close();
}

// Filmstrips: capture frames of the stage while motion plays, then lay them out on one sheet.
async function filmstrip(name, frames, everyMs, setup) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL_, { waitUntil: "domcontentloaded" });
  if (setup) await setup(page);
  const shots = [];
  for (let i = 0; i < frames; i++) {
    shots.push((await page.locator(".stage-wrap").screenshot({ type: "jpeg", quality: 82 })).toString("base64"));
    await page.waitForTimeout(everyMs);
  }
  const sheet = await browser.newPage({ viewport: { width: 1600, height: 400 } });
  await sheet.setContent(`<body style="margin:0;background:#1a2127;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px;width:1600px;box-sizing:border-box">${shots.map((b, k) => `<figure style="margin:0;position:relative"><img style="width:100%;display:block;border-radius:6px" src="data:image/jpeg;base64,${b}"><figcaption style="position:absolute;left:8px;top:6px;font:600 12px/1 sans-serif;color:#fff;background:#0009;padding:3px 6px;border-radius:4px">${Math.round(k * everyMs)} ms</figcaption></figure>`).join("")}</body>`);
  await sheet.waitForTimeout(300);
  await sheet.screenshot({ path: join(out, `motion-${name}.jpg`), type: "jpeg", quality: 78, fullPage: true });
  await sheet.close(); await page.close();
}
await filmstrip("1-hero-intro", 12, 260);
await filmstrip("2-facts-to-case", 12, 180, async (p) => { await p.waitForTimeout(3500); await reach(p, 1); await p.waitForTimeout(3200); await reach(p, 2); });
await filmstrip("3-booking-chain", 12, 330, async (p) => { await p.waitForTimeout(3500); for (const n of [1, 2, 3]) { await reach(p, n); await p.waitForTimeout(3000); } await reach(p, 4); });
await filmstrip("4-owner-approve", 8, 300, async (p) => { await p.waitForTimeout(3500); for (const n of [1, 2, 3, 4, 5]) { await reach(p, n); await p.waitForTimeout(n === 5 ? 3000 : 1200); } await reach(p, 6); });
await browser.close();
server.close();
console.log(`screenshots written to ${out}`);
