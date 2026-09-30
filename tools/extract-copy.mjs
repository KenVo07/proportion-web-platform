// Writes docs/COPY.md: the exact copy of the built page, in reading order, plus the product-UI strings shown
// inside the illustration (which is aria-hidden, so it is listed separately). Run after `npm run build`.
// COPY_STATE=live writes the live-Showcase variant to docs/COPY-live.md.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { start } from "./serve.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const state = process.env.COPY_STATE || "pending";
const server = await start(4403);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:4403/", { waitUntil: "load" });
const data = await page.evaluate(() => {
  const clean = (t) => t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const text = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll("[aria-hidden='true'], .visually-hidden, svg").forEach((n) => n.remove());
    document.body.appendChild(c);
    c.style.cssText = "position:absolute;left:-99999px;top:0;width:1000px;opacity:1";
    c.querySelectorAll("*").forEach((n) => { n.style.opacity = "1"; n.style.visibility = "visible"; });
    const t = c.innerText;
    c.remove();
    return clean(t);
  };
  const out = [];
  out.push({ name: "Document", text: `Title: ${document.title}\nMeta description: ${document.querySelector('meta[name="description"]').content}` });
  out.push({ name: "Header", text: text(document.querySelector(".nav")) });
  out.push({ name: "Hero", text: text(document.querySelector(".hero-block")) });
  const hidden = [...document.querySelectorAll(".hero-block .visually-hidden")].map((e) => e.textContent.trim());
  if (hidden.length) out.push({ name: "Hero (screen-reader only)", text: hidden.join("\n") });
  out.push({ name: "Story steps", text: [...document.querySelectorAll(".step")].map((s) => text(s)).join("\n\n") });
  out.push({ name: "Story dock", text: [...document.querySelectorAll(".dock a")].map((a) => a.textContent.trim().replace(/\s+/g, " ")).join(" · ") });
  for (const sel of ["#rules", "#channels", "#showcase", "#contact", "#get-started"]) {
    const el = document.querySelector(sel);
    let t = text(el);
    const fig = el.querySelector("[role=img]");
    if (fig) t += `\n\n[Diagram, described to screen readers as] ${fig.getAttribute("aria-label")}`;
    out.push({ name: `Section ${sel}`, text: t });
  }
  out.push({ name: "Footer", text: text(document.querySelector("footer")) });
  // Illustration strings: every text node inside the stage, grouped by surface.
  const groups = [];
  document.querySelectorAll(".stage-caption").forEach((c) => groups.push({ name: "Caption", items: [c.textContent.trim()] }));
  for (const c of document.querySelectorAll(".stage .c")) {
    const name = [...c.classList].find((k) => k.startsWith("c-")).slice(2);
    const items = [];
    const walker = document.createTreeWalker(c, NodeFilter.SHOW_ELEMENT);
    const seen = new Set();
    for (const el of c.querySelectorAll(".msg, .sys, .fact, .chip, .pill, .ui-label, .ui-btn, .log-list li, .offer, .row-head b, .row-job, .sheet-total, .sheet-sub, .sheet-line, .sheet-cols li, .sheet-foot, .sheet-result, .sheet-meta, .cap-text, .case-id b, .case-sub > *, .chat-id b, .chat-id .swap > *, .chat-channel, .biz-top b, .biz-tabs span, .biz-activity li, .lane-name, .cal-head b, .booked-tag, .blk.is-booked, .lg, .appt, .kicker, .c-note b, .chat-compose > span:first-child, .chat-tabs span, .detail-head b, .detail-sub, .biz-log li, .real-title")) {
      const t = el.textContent.replace(/\s+/g, " ").trim();
      if (t && !seen.has(t)) { seen.add(t); items.push(t); }
    }
    if (c.classList.contains("c-note")) { const t = c.textContent.replace(/\s+/g, " ").trim(); if (!seen.has(t)) items.push(t); }
    groups.push({ name, items });
  }
  return { out, groups };
});
await browser.close();
server.close();
const md = [
  `# AFO landing page — exact copy (${state === "live" ? "Showcase live" : "Showcase pending, default"})`, "",
  "Generated from the built page by `npm run copy`. Edit `src/index.html` and `build.mjs`, not this file.", "",
];
for (const s of data.out) md.push(`## ${s.name}`, "", s.text, "");
md.push("## Illustration strings (product UI, aria-hidden)", "", "Every string below is the AFO Showcase's own wording, shown with the fictional Riverbend Plumbing demo data.", "");
for (const g of data.groups) { md.push(`### ${g.name}`, ""); for (const i of g.items) md.push(`- ${i}`); md.push(""); }
const file = state === "live" ? "COPY-live.md" : "COPY.md";
writeFileSync(join(root, "docs", file), md.join("\n"));
console.log(`docs/${file} written`);
