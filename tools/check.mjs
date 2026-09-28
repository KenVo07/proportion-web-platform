// Static checks on dist/: template leftovers, banned marketing phrases, claim wording the product's own copy
// review rejected, dangling anchors, heading order, one h1, alt/aria coverage, allowed external hosts only,
// no inline handlers or third-party scripts, and a size budget (raw and gzip).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const config = JSON.parse(readFileSync(process.env.SITE_CONFIG || join(root, "site.config.json"), "utf8"));
const html = readFileSync(join(dist, "index.html"), "utf8");
const problems = [];
// Visible text, including the aria-hidden illustration (it is on screen, so its wording must pass too).
const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\s+/g, " ");

if (/\{\{|\}\}/.test(html)) problems.push("unresolved template slot");

const banned = [/revolutioni[sz]e/i, /game-?changing/i, /\bleverag/i, /cutting-edge/i, /transform your business/i, /AI-powered/i, /seamless/i, /omnichannel/i, /supercharge/i, /\bunlock\b/i, /\bempower/i, /next-generation/i, /best-in-class/i, /world-class/i, /lorem ipsum/i, /\bagentic\b/i, /\b24\/7\b/, /never miss/i, /\bguarantee/i];
for (const re of banned) if (re.test(text)) problems.push(`banned phrase: ${re}`);

// Claims rejected in the product's own copy review, or not supported by the Showcase today.
const rejected = [/real schedule/i, /your (real )?calendar sync/i, /nothing you type leaves/i, /replies in seconds/i, /approve every price/i, /\bevery (location|job|channel|booking|quote|enquiry|call)\b/i, /\ball your calls\b/i, /replaces? your receptionist/i, /\d+\s?%/, /\bcustomers? (love|trust)\b/i, /trusted by/i, /google calendar/i];
for (const re of rejected) if (re.test(text)) problems.push(`rejected or unsupported claim wording: ${re}`);

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) problems.push(`dangling anchor #${m[1]}`);
const dupes = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((id, i, a) => a.indexOf(id) !== i);
if (dupes.length) problems.push(`duplicate ids: ${[...new Set(dupes)].join(", ")}`);

const h1s = (html.match(/<h1[\s>]/g) || []).length;
if (h1s !== 1) problems.push(`expected 1 h1, found ${h1s}`);
let last = 1;
for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
  const level = Number(m[1]);
  if (level > last + 1) problems.push(`heading level jumps from h${last} to h${level}`);
  last = level;
}
for (const m of html.matchAll(/<img\b[^>]*>/g)) {
  if (!/\balt=/.test(m[0])) problems.push(`img without alt: ${m[0].slice(0, 80)}`);
  if (!/\bwidth=/.test(m[0]) || !/\bheight=/.test(m[0])) problems.push(`img without width/height (layout shift risk): ${m[0].slice(0, 80)}`);
}
for (const m of html.matchAll(/role="img"[^>]*/g)) if (!/aria-label=/.test(m[0])) problems.push("role=img without aria-label");
if (/\son[a-z]+="/i.test(html)) problems.push("inline event handler attribute");
// The production release builder fingerprints every .js/.css file and rewrites references only in HTML/CSS,
// so shipped scripts must not load each other by relative path.
for (const f of readdirSync(join(dist, "js"))) {
  const js = readFileSync(join(dist, "js", f), "utf8");
  if (/^\s*import[\s{*]|\bimport\s*\(|\bnew Worker\(/m.test(js)) problems.push(`js/${f} loads another script by relative path (breaks release fingerprinting)`);
}
for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) if (/^https?:/.test(m[1])) problems.push(`third-party script: ${m[1]}`);
if (/(?:href|src)="http:\/\//.test(html)) problems.push("insecure http:// link");

const allowedHosts = new Set([new URL(config.siteUrl).host, new URL(config.showcase.url).host]);
for (const u of [config.contact?.linkedin, config.contact?.bookingUrl]) if (u) allowedHosts.add(new URL(u).host);
for (const m of html.matchAll(/(?:href|src)="(https?:\/\/[^"/]+)/g)) {
  const host = new URL(m[1]).host;
  if (!allowedHosts.has(host)) problems.push(`unexpected external host: ${host}`);
}
if (!/<html lang="/.test(html)) problems.push("missing lang attribute");
if (!/<meta name="viewport"/.test(html)) problems.push("missing viewport meta");
if (!/class="skip-link"/.test(html)) problems.push("missing skip link");
if (!/Illustration · Riverbend Plumbing is a fictional demo business/.test(html) || !/Illustration · fictional demo business/.test(html)) problems.push("illustration is not labelled as a fictional demo business at every width");

// Size budget (bytes). Fonts and the backdrop image are the bulk; everything else stays small.
const size = (p) => statSync(join(dist, p)).size;
const gz = (p) => gzipSync(readFileSync(join(dist, p))).length;
const files = ["index.html", "styles.css", ...readdirSync(join(dist, "js")).map((f) => `js/${f}`), ...readdirSync(join(dist, "fonts")).map((f) => `fonts/${f}`), ...readdirSync(join(dist, "assets")).map((f) => `assets/${f}`)];
const budget = { "index.html": 72_000, "styles.css": 72_000, js: 32_000, fonts: 90_000, assets: 90_000, total: 330_000 };
const sum = (pred) => files.filter(pred).reduce((a, f) => a + size(f), 0);
const measured = {
  "index.html": size("index.html"),
  "styles.css": size("styles.css"),
  js: sum((f) => f.startsWith("js/")),
  fonts: sum((f) => f.startsWith("fonts/")),
  assets: sum((f) => f.startsWith("assets/")),
};
measured.total = Object.values(measured).reduce((a, b) => a + b, 0);
for (const [k, max] of Object.entries(budget)) if (measured[k] > max) problems.push(`${k} is ${measured[k]} bytes, over the ${max} byte budget`);

const gzTotal = files.reduce((a, f) => a + (/\.(woff2|webp|png|jpg)$/.test(f) ? size(f) : gz(f)), 0);
const report = Object.entries(measured).map(([k, v]) => `${k} ${(v / 1024).toFixed(1)} KB`).join(", ");
if (problems.length) {
  console.error("check: FAILED");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check: OK (template, phrasing, claims, anchors, headings, hosts, handlers, size)`);
console.log(`  raw: ${report}; transferred with gzip ≈ ${(gzTotal / 1024).toFixed(1)} KB (html/css/js gzipped, fonts/images as-is)`);
