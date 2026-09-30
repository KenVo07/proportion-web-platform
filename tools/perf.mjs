// Performance on dist/: transfer size, LCP, CLS (including while the story plays), long tasks, and frame
// timing while scrolling through the whole page at a steady reading speed. Phones run with 4x CPU throttling.
import { chromium } from "playwright";
import { start } from "./serve.mjs";

const server = await start(4404);
const browser = await chromium.launch();
const results = [];
for (const cfg of [
  { name: "desktop 1440", viewport: { width: 1440, height: 900 }, cpu: 1, pxPerFrame: 9 },
  { name: "phone 390 (4x CPU)", viewport: { width: 390, height: 844 }, cpu: 4, pxPerFrame: 6, mobile: true },
]) {
  const ctx = await browser.newContext({ viewport: cfg.viewport, isMobile: !!cfg.mobile, hasTouch: !!cfg.mobile });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (cfg.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cfg.cpu });
  let bytes = 0; const byType = {}; const urls = [];
  page.on("response", async (r) => {
    urls.push(r.url());
    try { const b = (await r.body()).length; bytes += b; const t = (r.headers()["content-type"] || "other").split(";")[0]; byType[t] = (byType[t] || 0) + b; } catch {}
  });
  await page.addInitScript(() => {
    window.__perf = { cls: 0, shifts: [], lcp: 0, long: [] };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__perf.cls += e.value; window.__perf.shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).map((s) => s.node && (s.node.className || s.node.nodeName)).join(",") }); } }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.long.push(Math.round(e.duration)); }).observe({ type: "longtask", buffered: true });
  });
  await page.goto("http://127.0.0.1:4404/", { waitUntil: "load" });
  await page.waitForTimeout(3800); // let the hero intro finish
  const initialBytes = bytes;
  const initialByType = Object.fromEntries(Object.entries(byType).map(([t, b]) => [t, +(b / 1024).toFixed(1)]));
  // The real workspace capture is lazy: it must not be fetched on the first screen, only once the story reaches
  // the owner chapter (or the final section comes near).
  const captureOnFirstVisit = urls.some((u) => /showcase-workspace\.webp/.test(u));
  // Scroll the whole page at a steady pace inside the page, timing every animation frame.
  const frames = await page.evaluate(async (px) => {
    const deltas = [];
    const max = document.documentElement.scrollHeight - innerHeight;
    let last = performance.now();
    await new Promise((resolve) => {
      function step(now) {
        deltas.push(now - last); last = now;
        if (scrollY >= max - 1) return resolve();
        scrollBy(0, px);
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    return deltas.slice(2);
  }, cfg.pxPerFrame);
  await page.waitForTimeout(1200);
  const perf = await page.evaluate(() => window.__perf);
  frames.sort((a, b) => a - b);
  const pct = (q) => frames[Math.min(frames.length - 1, Math.floor(frames.length * q))];
  const slow = frames.filter((d) => d > 20).length;
  results.push({
    name: cfg.name,
    initialKB: +(initialBytes / 1024).toFixed(1),
    initialByTypeKB: initialByType,
    captureOnFirstVisit,
    captureLoadedByEndOfScroll: urls.some((u) => /showcase-workspace\.webp/.test(u)),
    totalKB: +(bytes / 1024).toFixed(1),
    lcpMs: Math.round(perf.lcp),
    cls: +perf.cls.toFixed(4),
    shifts: perf.shifts.slice(0, 5),
    longTasks: perf.long.length,
    longestTaskMs: perf.long.length ? Math.max(...perf.long) : 0,
    frames: frames.length,
    p50: +pct(0.5).toFixed(1),
    p95: +pct(0.95).toFixed(1),
    p99: +pct(0.99).toFixed(1),
    over20ms: `${slow} (${((100 * slow) / frames.length).toFixed(1)}%)`,
  });
  await ctx.close();
}
await browser.close();
server.close();
for (const r of results) console.log(JSON.stringify(r));
