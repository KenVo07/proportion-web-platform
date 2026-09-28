// Runs axe-core against dist/ at a phone and a desktop viewport. Exits non-zero on any violation.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { start } from "./serve.mjs";

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const server = await start(4402);
const browser = await chromium.launch();
let failed = false;
for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const page = await browser.newPage({ viewport: vp, reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:4402/", { waitUntil: "load" });
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }));
  console.log(`${vp.width}px: ${results.passes.length} rules passed, ${results.violations.length} violations, ${results.incomplete.length} needing manual review`);
  for (const v of results.violations) {
    failed = true;
    console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 5)) console.log(`     ${n.target.join(" ")}`);
  }
  for (const v of results.incomplete) console.log(`  (manual) ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  // Keyboard pass: every link and button must be reachable by Tab and show a visible focus outline.
  const focusable = await page.$$eval("a[href], button", (els) => els.filter((el) => el.getClientRects().length > 0 || el.classList.contains("skip-link")).length);
  let visibleOutlines = 0;
  for (let i = 0; i < focusable; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 };
    });
    if (info.outline) visibleOutlines++;
  }
  console.log(`  keyboard: ${focusable} focusable elements, ${visibleOutlines} showed a focus outline`);
  if (visibleOutlines < focusable) failed = true;
  await page.close();
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
