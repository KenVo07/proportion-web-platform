// Accessibility and rendering-mode checks on dist/:
//  1. axe-core (WCAG 2.1 A/AA + best practice) at phone and desktop widths, in the hero and in the owner
//     chapter of the story, after scrolling once so every reveal is visible.
//  2. Keyboard: every visible link/button is reachable with Tab and shows a focus outline.
//  3. Reduced motion: no running animations, stage surfaces only fade.
//  4. Reduced transparency and increased contrast: glass surfaces lose their blur.
//  5. JavaScript disabled: the story reads as plain text and nothing stays hidden.
// Exits non-zero on any violation.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { start } from "./serve.mjs";

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const URL_ = "http://127.0.0.1:4402/";
const server = await start(4402);
const browser = await chromium.launch();
let failed = false;
const fail = (msg) => { failed = true; console.log(`  FAIL ${msg}`); };

async function scrollThrough(page) {
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y < H; y += Math.round(vh * 0.6)) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(40); }
}
async function reachState(page, n) {
  let g = 0;
  while ((await page.evaluate(() => +document.querySelector(".stage").dataset.state)) < n && g++ < 800) {
    await page.evaluate(() => scrollBy(0, 40)); await page.waitForTimeout(10);
  }
}
async function axe(page, label, context) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(async (ctx) => await window.axe.run(ctx || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }), context);
  console.log(`  axe ${label}: ${r.passes.length} rules passed, ${r.violations.length} violations, ${r.incomplete.length} for manual review`);
  for (const v of r.violations) { fail(`[${v.impact}] ${v.id}: ${v.help}`); for (const n of v.nodes.slice(0, 4)) console.log(`       ${n.target.join(" ")}`); }
  for (const v of r.incomplete) console.log(`    (manual) ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}${v.nodes.length > 3 ? " …" : ""}`);
}

for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  console.log(`\n${vp.width}px`);
  const page = await browser.newPage({ viewport: vp, reducedMotion: "reduce", isMobile: vp.width < 800, hasTouch: vp.width < 800 });
  await page.goto(URL_, { waitUntil: "load" });
  await scrollThrough(page);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  // The story copy sits on a pinned graphite backdrop that only exists where the viewport is, so each step
  // is checked while it is the active step on screen, as a visitor sees it. Everything else is checked whole.
  await axe(page, "page (story steps excluded)", { exclude: [[".steps"]] });
  for (const n of [1, 3, 5, 7, 8]) {
    await reachState(page, n);
    // Read on until the whole step is on screen (on phones the heading arrives first).
    await page.evaluate((k) => {
      const step = document.querySelectorAll(".step")[k - 1];
      const last = step.lastElementChild.getBoundingClientRect();
      if (last.bottom > innerHeight - 16) scrollBy(0, last.bottom - innerHeight + 24);
    }, n);
    await page.waitForTimeout(350);
    const id = await page.evaluate((k) => document.querySelectorAll(".step")[k - 1].id, n);
    await axe(page, `story step ${n} in view`, { include: [["#" + id]] });
  }

  // Keyboard pass from the top. The first stop is the skip link: visible when focused, and it lands on <main>.
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => {
    const el = document.activeElement; const r = el.getBoundingClientRect();
    return { isSkip: el.classList.contains("skip-link"), href: el.getAttribute("href"), text: el.textContent.trim(), onScreen: r.width > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0, target: !!document.querySelector(el.getAttribute("href") || "#none") };
  });
  console.log(`  skip link: first Tab stop ${skip.isSkip ? `"${skip.text}" → ${skip.href}` : "is NOT the skip link"}, ${skip.onScreen ? "visible" : "not visible"} when focused`);
  if (!skip.isSkip || !skip.onScreen || !skip.target) fail("skip link is not the first, visible Tab stop with a valid target");
  await page.evaluate(() => document.activeElement?.blur());
  const focusable = await page.$$eval("a[href], button", (els) => els.filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden").length);
  let outlined = 0; const seen = new Set();
  for (let i = 0; i < focusable + 4; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const all = [...document.querySelectorAll("a[href], button")];
      const cs = getComputedStyle(el);
      return { key: all.indexOf(el), outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 };
    });
    if (info && !seen.has(info.key)) { seen.add(info.key); if (info.outline) outlined++; }
  }
  if (seen.size < focusable) fail(`only ${seen.size} of ${focusable} visible focusable elements reached by Tab`);
  console.log(`  keyboard: ${seen.size} distinct stops reached by Tab, ${outlined} with a visible focus outline (visible focusable: ${focusable})`);
  if (outlined < seen.size) fail("an element receives focus without a visible outline");
  await page.close();
}

// Reduced motion: nothing loops, surfaces fade instead of moving.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await page.goto(URL_, { waitUntil: "load" });
  await reachState(page, 4); await page.waitForTimeout(600);
  const r = await page.evaluate(() => ({
    running: document.getAnimations().filter((a) => a.playState === "running").map((a) => a.animationName || a.constructor.name),
    props: getComputedStyle(document.querySelector(".c-chat")).transitionProperty,
    ghosts: document.querySelectorAll(".fact-ghost").length,
  }));
  console.log(`\nreduced motion: running animations ${r.running.length}${r.running.length ? " (" + r.running.join(", ") + ")" : ""}; stage transition-property "${r.props}"; fact flights ${r.ghosts}`);
  if (r.running.length) fail("animations still running with reduced motion");
  if (!/^opacity$/.test(r.props.trim())) fail("stage surfaces still transition position under reduced motion");
  await page.close();
}

// Reduced transparency (Chrome media-feature emulation) and increased contrast.
for (const feature of [{ name: "prefers-reduced-transparency", value: "reduce" }, { name: "prefers-contrast", value: "more" }]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia", { features: [feature] });
  await page.goto(URL_, { waitUntil: "load" });
  const r = await page.evaluate(() => [...document.querySelectorAll(".glass")].map((el) => getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter));
  const blurred = r.filter((v) => v && v !== "none").length;
  console.log(`${feature.name}: ${r.length} glass surfaces, ${blurred} still blurred`);
  if (blurred) fail(`${feature.name}: glass still uses backdrop blur`);
  await page.close();
}

// JavaScript disabled.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: "load" });
  const r = await page.evaluate(() => {
    const vis = (el) => { const cs = getComputedStyle(el); return cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.5 && el.getClientRects().length > 0; };
    const step = document.querySelector(".step h3");
    return {
      hiddenReveals: [...document.querySelectorAll("[data-reveal]")].filter((el) => !vis(el)).length,
      stepColor: getComputedStyle(step).color,
      heroMsg: vis(document.querySelector('[data-k="m1"]')),
      stageSticky: getComputedStyle(document.querySelector(".stage-wrap")).position,
    };
  });
  console.log(`javascript off: hidden reveal blocks ${r.hiddenReveals}; step heading colour ${r.stepColor}; hero illustration shows first message ${r.heroMsg}; stage position ${r.stageSticky}`);
  if (r.hiddenReveals) fail("content stays hidden without JavaScript");
  if (!r.heroMsg) fail("illustration is empty without JavaScript");
  if (r.stepColor === "rgb(255, 255, 255)") fail("story text is white on the light canvas without JavaScript");
  await ctx.close();
}

await browser.close();
server.close();
console.log(failed ? "\na11y: FAILED" : "\na11y: OK");
process.exit(failed ? 1 : 0);
