// Writes docs/COPY.md: the exact visible copy of the built page, section by section.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { start } from "./serve.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const server = await start(4403);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:4403/", { waitUntil: "load" });
const sections = await page.evaluate(() => {
  const blocks = [];
  const meta = { title: document.title, description: document.querySelector('meta[name="description"]').content };
  blocks.push({ name: "Document", text: `Title: ${meta.title}\nMeta description: ${meta.description}` });
  for (const el of document.querySelectorAll("header, main > section, footer")) {
    const heading = el.querySelector("h1, h2");
    const name = el.tagName === "HEADER" ? "Header" : el.tagName === "FOOTER" ? "Footer" : `Section: ${heading ? heading.textContent.trim() : el.id}`;
    const visuals = [...el.querySelectorAll("[role=img]")].map((v) => `[Visual] ${v.getAttribute("aria-label")}`);
    const clone = el.cloneNode(true);
    clone.querySelectorAll("[role=img]").forEach((v) => v.remove());
    document.body.appendChild(clone);
    const text = clone.innerText.replace(/\n{3,}/g, "\n\n").trim();
    clone.remove();
    blocks.push({ name, text: [text, ...visuals].join("\n\n") });
  }
  return blocks;
});
await browser.close();
server.close();
const md = ["# AFO landing page — exact copy", "", "Generated from the built page by `npm run copy`. Edit `src/index.html` and `build.mjs`, not this file.", ""];
for (const s of sections) md.push(`## ${s.name}`, "", s.text, "");
writeFileSync(join(root, "docs", "COPY.md"), md.join("\n"));
console.log("docs/COPY.md written");
