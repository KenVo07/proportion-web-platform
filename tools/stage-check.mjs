// Walks every story frame at four widths and fails if any product-UI element sticks out of its card
// (text or chips pushed out by a long label, for example).
import { chromium } from "playwright";
import { start } from "./serve.mjs";
const server = await start(4405);
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [1024, 768], [390, 844], [320, 568]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce", isMobile: w < 800 });
  await p.goto("http://127.0.0.1:4405/", { waitUntil: "load" });
  const found = new Set();
  for (let n = 0; n <= 7; n++) {
    let g = 0; while ((await p.evaluate(() => +document.querySelector(".stage").dataset.state)) < n && g++ < 800) { await p.evaluate(() => scrollBy(0, 40)); await p.waitForTimeout(8); }
    await p.waitForTimeout(250);
    const bad = await p.evaluate(() => {
      const out = [];
      for (const card of document.querySelectorAll(".stage .c")) {
        if (parseFloat(getComputedStyle(card).opacity) < 0.5) continue;
        const cr = card.getBoundingClientRect();
        for (const el of card.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (!r.width || parseFloat(getComputedStyle(el).opacity) === 0) continue;
          if (r.right > cr.right + 2 || r.left < cr.left - 2) out.push(`${card.className.split(" ")[1]} > ${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} (+${Math.round(r.right - cr.right)}px)`);
        }
      }
      return out;
    });
    bad.forEach((x) => found.add(`state ${n}: ${x}`));
  }
  console.log(`${w}x${h}: ${found.size ? [...found].slice(0, 8).join("\n   ") : "no element overflows its card"}`);
  if (found.size) process.exitCode = 1;
  await p.close();
}
await b.close();
server.close();
