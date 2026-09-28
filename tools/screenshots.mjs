// Full-page screenshots of dist/ at the review viewports. Requires the playwright devDependency.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { start } from "./serve.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.env.SHOTS_DIR || join(root, "docs", "screenshots");
mkdirSync(out, { recursive: true });
const viewports = [
  { name: "mobile-320", width: 320, height: 568 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
];
const server = await start(4401);
const browser = await chromium.launch();
for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:4401/", { waitUntil: "load" });
  await page.screenshot({ path: join(out, `${vp.name}-fold.png`) });
  await page.screenshot({ path: join(out, `${vp.name}-full.png`), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`${vp.name}: horizontal overflow ${overflow}px`);
  await page.close();
}
await browser.close();
server.close();
console.log(`screenshots written to ${out}`);
