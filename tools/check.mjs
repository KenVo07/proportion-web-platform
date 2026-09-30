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
// Fictional-business disclosure: the re-created story is labelled at every width, and the real capture has its own label.
for (const label of ["Re-created from the AFO Showcase · fictional demo business", "Re-created from the Showcase · fictional business", "Re-created · fictional demo business", "AFO Showcase workspace · fictional demo business"]) {
  if (!html.includes(label)) problems.push(`missing disclosure label: "${label}"`);
}
// The Showcase link exists only when the Showcase is live, and then always opens in a new tab safely.
const showcaseHost = new URL(config.showcase.url).host;
// The state that was actually built (build.mjs stamps it on <html>), so env overrides are checked correctly.
const liveState = /<html[^>]*\sdata-showcase="live"/.test(html);
const showcaseLinks = [...html.matchAll(/<a\b[^>]*href="https?:\/\/([^"/]+)[^"]*"[^>]*>/g)].filter((m) => m[1] === showcaseHost);
if (!liveState && html.includes(showcaseHost)) problems.push(`showcase is pending but the page mentions ${showcaseHost} (no dead or premature demo link)`);
// Pending: no availability is implied anywhere, not even without a link.
if (!liveState && /Try AFO live|Open now/.test(text)) problems.push("showcase is pending but the page offers it as available (Try AFO live / Open now)");
if (liveState && showcaseLinks.length === 0) problems.push("showcase is live but there is no link to it");
// Live: every Showcase link is exactly the configured production URL (no deep links, no preview routes) and
// opens in a new tab safely; the one strong action is there.
for (const m of showcaseLinks) {
  const href = m[0].match(/href="([^"]+)"/)[1].replace(/&amp;/g, "&");
  if (href !== config.showcase.url) problems.push(`showcase link is not the configured production URL: ${href}`);
  if (!/target="_blank"/.test(m[0]) || !/rel="[^"]*noopener/.test(m[0])) problems.push(`showcase link without target=_blank rel=noopener: ${m[0].slice(0, 90)}`);
}
if (liveState && !/<a\b[^>]*href="[^"]*"[^>]*>Try AFO live</.test(html)) problems.push("showcase is live but there is no Try AFO live action");
for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) problems.push(`new-tab link without rel=noopener: ${m[0].slice(0, 80)}`);

// Public-safety: nothing internal reaches any shipped text file (page, script, styles).
// Internal defect IDs, engineering state labels, local paths, development hosts and the founder's local
// interactive preview never ship; neither do credentials or debug/engineering language in the visible text.
const shipped = { "index.html": html, "js/site.js": readdirSync(join(dist, "js")).map((f) => readFileSync(join(dist, "js", f), "utf8")).join("\n"), "styles.css": readFileSync(join(dist, "styles.css"), "utf8") };
const internal = [
  /\bLPH-\d+/, /\b(?:PILOT|DEMO)_BLOCKER\b/, /\bCP\d{1,2}\b/, /\bEXECUTION_STATE\b/, /\bCLOUD_HANDOFF\b/,
  /\/home\/[a-z]/i, /\/Users\/[A-Za-z]/, /~\/Projects/, /\b[A-Z]:\\/, /file:\/\//,
  /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)\b/, /https?:\/\/[^"'\s/]*\.local\b/, /https?:\/\/(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d/,
  /founder[\s_-]*(?:interactive[\s_-]*)?preview/i, /interactive[\s_-]*preview/i,
  /\bsk-[A-Za-z0-9_-]{12,}/, /\bapi[_-]?key\b/i, /\bBearer\s+[A-Za-z0-9._-]{8,}/,
];
for (const [file, body] of Object.entries(shipped)) for (const re of internal) if (re.test(body)) problems.push(`internal or local reference in ${file}: ${re}`);
for (const m of html.matchAll(/href="([^"#][^"]*)"/g)) if (/(?:^|\/)(?:preview|dev|debug|staging)(?:[/?.#]|$)/i.test(m[1])) problems.push(`link to a preview/dev route: ${m[1]}`);
for (const re of [/\bdebug\b/i, /\bTODO\b/, /\bFIXME\b/, /\bstaging\b/i, /\bpassword\b/i]) if (re.test(text)) problems.push(`engineering or credential language in visible text: ${re}`);
// The real workspace capture is large and must never load on a first visit: the stage copy is JS-loaded
// (data-src), the final-section copy is native lazy.
for (const m of html.matchAll(/<img\b[^>]*showcase-workspace\.webp[^>]*>/g)) {
  if (/\ssrc="/.test(m[0]) && !/loading="lazy"/.test(m[0])) problems.push(`workspace capture loads eagerly: ${m[0].slice(0, 90)}`);
}

// Size budget (bytes). Fonts and the backdrop image are the bulk; everything else stays small.
const size = (p) => statSync(join(dist, p)).size;
const gz = (p) => gzipSync(readFileSync(join(dist, p))).length;
const files = ["index.html", "styles.css", ...readdirSync(join(dist, "js")).map((f) => `js/${f}`), ...readdirSync(join(dist, "fonts")).map((f) => `fonts/${f}`), ...readdirSync(join(dist, "assets")).map((f) => `assets/${f}`)];
// assets: sample photo (3 KB, eager) + the real workspace capture (lossless, lazy only; see above).
const budget = { "index.html": 72_000, "styles.css": 72_000, js: 32_000, fonts: 90_000, assets: 140_000, total: 380_000 };
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
// First visit: everything except the lazily loaded workspace capture.
const firstVisit = files.filter((f) => !/showcase-workspace\.webp$/.test(f)).reduce((a, f) => a + (/\.(woff2|webp|png|jpg)$/.test(f) ? size(f) : gz(f)), 0);
const report = Object.entries(measured).map(([k, v]) => `${k} ${(v / 1024).toFixed(1)} KB`).join(", ");
if (problems.length) {
  console.error("check: FAILED");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check: OK (template, phrasing, claims, anchors, headings, hosts, handlers, size)`);
console.log(`  raw: ${report}; all files with gzip ≈ ${(gzTotal / 1024).toFixed(1)} KB; first visit ≈ ${(firstVisit / 1024).toFixed(1)} KB (workspace capture is lazy)`);
