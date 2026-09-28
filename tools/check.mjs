// Static checks on dist/index.html: template leftovers, banned marketing phrases, dangling anchors,
// heading order, one h1, alt/aria coverage, no unexpected external hosts, and a size budget.
import { readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
const html = readFileSync(join(root, "dist", "index.html"), "utf8");
const problems = [];
const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

if (/\{\{|\}\}/.test(html)) problems.push("unresolved template slot");

const banned = [/revolutioni[sz]e/i, /game-?changing/i, /leverage/i, /cutting-edge/i, /transform your business/i, /AI-powered/i, /seamless/i, /omnichannel/i, /supercharge/i, /unlock/i, /empower/i, /next-generation/i, /best-in-class/i, /world-class/i, /lorem ipsum/i];
for (const re of banned) if (re.test(text)) problems.push(`banned phrase: ${re}`);

// Claims that were explicitly rejected in the product's own copy review.
const rejected = [/real schedule/i, /nothing you type leaves/i, /replies in seconds/i, /approve every price/i, /\bevery (location|job|channel|booking|quote)\b/i];
for (const re of rejected) if (re.test(text)) problems.push(`rejected claim wording: ${re}`);

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) problems.push(`dangling anchor #${m[1]}`);

const h1s = (html.match(/<h1[\s>]/g) || []).length;
if (h1s !== 1) problems.push(`expected 1 h1, found ${h1s}`);
let last = 1;
for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
  const level = Number(m[1]);
  if (level > last + 1) problems.push(`heading level jumps from h${last} to h${level}`);
  last = level;
}

for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) problems.push(`img without alt: ${m[0].slice(0, 60)}`);
for (const m of html.matchAll(/role="img"[^>]*/g)) if (!/aria-label=/.test(m[0])) problems.push("role=img without aria-label");

const allowedHosts = new Set([new URL(config.siteUrl).host, new URL(config.showcase.url).host]);
if (/^https?:/.test(config.contact.href || "")) allowedHosts.add(new URL(config.contact.href).host);
for (const m of html.matchAll(/(?:href|src)="(https?:\/\/[^"/]+)/g)) {
  const host = new URL(m[1]).host;
  if (!allowedHosts.has(host)) problems.push(`unexpected external host: ${host}`);
}
if (!/<html lang="/.test(html)) problems.push("missing lang attribute");
if (!/<meta name="viewport"/.test(html)) problems.push("missing viewport meta");
if (!/<a class="skip-link"/.test(html)) problems.push("missing skip link");

const budget = { "index.html": 40_000, "styles.css": 32_000, "site.js": 4_000 };
for (const [file, max] of Object.entries(budget)) {
  const size = statSync(join(root, "dist", file)).size;
  if (size > max) problems.push(`${file} is ${size} bytes, over the ${max} byte budget`);
}

if (problems.length) {
  console.error("check: FAILED");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("check: OK (template, phrasing, anchors, headings, hosts, size budget)");
