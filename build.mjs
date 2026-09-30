// Build: applies site.config.json to src/index.html and writes a static site to dist/.
// No framework and no bundler. CSS modules in src/styles are concatenated in file-name order; ES modules in
// src/js are copied as-is. Only the {{SLOTS}} depend on configuration.
//
// Environment overrides (preview only, never written back):
//   SITE_CONFIG=path/to/other.json   use another config file
//   SHOWCASE_STATE=live|pending      override showcase.state
//   PHONE_LINE=live|pending          override showcase.phoneLine
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(process.env.SITE_CONFIG || join(root, "site.config.json"), "utf8"));
if (process.env.SHOWCASE_STATE) config.showcase.state = process.env.SHOWCASE_STATE;
if (process.env.PHONE_LINE) config.showcase.phoneLine = process.env.PHONE_LINE;

// ---------- Validation ----------
const fail = (msg) => { throw new Error(`site.config.json: ${msg}`); };
if (!["live", "pending"].includes(config.showcase.state)) fail(`showcase.state must be "live" or "pending"`);
if (!["live", "pending"].includes(config.showcase.phoneLine)) fail(`showcase.phoneLine must be "live" or "pending"`);
const isHttps = (u) => /^https:\/\/[^\s"'<>]+$/.test(u);
const { founder, contact } = config;
if (contact.linkedin && !/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s"'<>/]+\/?$/.test(contact.linkedin)) fail("contact.linkedin must be a https://www.linkedin.com/in/<name> URL");
if (contact.email && !/^[^\s@"'<>]+@[^\s@"'<>]+\.[a-z]{2,}$/i.test(contact.email)) fail("contact.email is not a valid address");
if (contact.bookingUrl && !isHttps(contact.bookingUrl)) fail("contact.bookingUrl must be an https:// URL");
if (!isHttps(config.showcase.url)) fail("showcase.url must be an https:// URL");
// The prospect-facing Showcase only. The founder's interactive preview is local/dev only and must never be linked:
// refuse local, private-network and preview/dev URLs outright.
{
  const u = new URL(config.showcase.url);
  if (/^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[)|\.local$|\.localhost$/i.test(u.hostname)) fail("showcase.url must be the production Showcase, not a local or private-network address");
  if (/(^|[/._=?&-])(preview|founder|dev|debug|staging|local)([/._=&-]|$)/i.test(u.pathname + u.search) || /(^|[.-])(preview|founder|dev|staging)[.-]/i.test(u.hostname)) fail("showcase.url must be the production Showcase, not a preview or dev route");
}
if (founder.photo && !existsSync(join(root, founder.photo))) fail(`founder.photo file not found: ${founder.photo}`);
if (founder.photo && ![".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(extname(founder.photo).toLowerCase())) fail("founder.photo must be .jpg, .png, .webp or .avif");

const live = config.showcase.state === "live";
const phoneLive = live && config.showcase.phoneLine === "live";
const contacts = [
  contact.linkedin && { kind: "linkedin", href: contact.linkedin, label: "LinkedIn", detail: `Message ${founder.shortName}`, external: true },
  contact.email && { kind: "email", href: `mailto:${contact.email}`, label: "Email", detail: contact.email, external: false },
  contact.bookingUrl && { kind: "booking", href: contact.bookingUrl, label: contact.bookingLabel || "Book a short call", detail: "Pick a time", external: true },
].filter(Boolean);
const hasContact = contacts.length > 0;
const talk = `Talk to ${founder.shortName}`;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const arrow = '<span class="btn-arrow" aria-hidden="true">↗</span>';
// External destinations (the Showcase, LinkedIn, a booking page) open in a new tab so the visitor keeps this page;
// the arrow shows it and screen readers are told.
const newTab = '<span class="visually-hidden"> (opens in a new tab)</span>';
const extAttrs = ' target="_blank" rel="noopener"';
const btn = (kind, href, label, { external = false, extraClass = "" } = {}) =>
  `<a class="btn btn-${kind}${extraClass ? " " + extraClass : ""}" href="${esc(href)}"${external ? extAttrs : ""}>${esc(label)}${external ? arrow + newTab : ""}</a>`;

const tryLive = (kind = "primary", extraClass = "") => btn(kind, config.showcase.url, "Try AFO live", { external: true, extraClass });
const talkBtn = (kind) => btn(kind, "#contact", talk);
const howBtn = (kind) => btn(kind, "#how-it-works", "See how it works");

// CTA ladder (one primary action per screen). The Showcase is the strongest proof, so once it is live it leads
// everywhere; while it is pending nothing links to it.
//                 Nav             Hero                              Final panel
//   live          Try AFO live    Try AFO live · See how it works   Try AFO live · Talk to Khoa (if contact)
//   pending       Talk to Khoa    See how it works · Talk to Khoa   Talk to Khoa · See how it works
//                 (or See how it works when no contact is configured; Talk to Khoa is omitted without contact)
const navCta = live ? tryLive("primary") : hasContact ? talkBtn("primary") : howBtn("primary");
const heroCtas = live ? tryLive("primary") + howBtn("secondary") : howBtn("primary") + (hasContact ? talkBtn("secondary") : "");
const finalCtas = live ? tryLive("primary") + (hasContact ? talkBtn("glass") : "") : hasContact ? talkBtn("primary") + howBtn("glass") : howBtn("primary");

const ICONS = {
  linkedin: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.55 4.77 5.87v5.58h-4v-4.95c0-1.18-.02-2.7-1.65-2.7-1.65 0-1.9 1.29-1.9 2.62v5.03h-4v-11Z"/></svg>',
  email: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="1.7" d="M3.75 6.75h16.5v10.5H3.75z M4 7l8 6 8-6"/></svg>',
  booking: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="1.7" d="M4.75 6.25h14.5v13H4.75zM4.75 10h14.5M8.5 3.75v4M15.5 3.75v4"/></svg>',
};

const contactList = contacts.map((c) => `
          <li><a class="contact-link contact-${c.kind}" href="${esc(c.href)}"${c.external ? extAttrs : ""}>
            <span class="contact-icon" aria-hidden="true">${ICONS[c.kind]}</span>
            <span class="contact-text"><span class="contact-label">${esc(c.label)}${c.external ? arrow + newTab : ""}</span><span class="contact-detail">${esc(c.detail)}</span></span>
          </a></li>`).join("");


// Founder photo: copied to dist/assets/ under a content-independent name.
const photoOut = founder.photo ? `assets/founder${extname(founder.photo).toLowerCase()}` : "";
const founderPhoto = photoOut
  ? `<figure class="founder-photo"><img src="${photoOut}" alt="${esc(founder.photoAlt)}" width="640" height="800" loading="lazy" decoding="async"></figure>`
  : "";

const slots = {
  SITE_URL: esc(config.siteUrl),
  FOUNDER_NAME: esc(founder.name),
  FOUNDER_ROLE: esc(founder.role),
  FOUNDER_LOCATION: esc(founder.location),
  FOUNDER_SHORT: esc(founder.shortName),
  FOUNDER_PHOTO: founderPhoto,
  FOUNDER_CLASS: photoOut ? "has-photo" : "no-photo",
  SHOWCASE_URL: esc(config.showcase.url),
  SHOWCASE_STATE: live ? "live" : "pending",

  NAV_CTA: navCta,
  HERO_CTAS: heroCtas,
  HERO_NOTE: live
    ? "Fictional businesses, real conversations. Nothing to install."
    : 'The <a href="#showcase">Live Showcase</a> is coming online.',

  // Live Showcase section. Pending: the same section, with a status instead of a link (no dead action).
  SHOWCASE_HEADING: live ? "Try the real product." : "Try the real product, soon.",
  SHOWCASE_STATUS: live ? '<span class="status-pill is-live"><span class="live-dot" aria-hidden="true"></span>Open now</span>' : "",
  SHOWCASE_LEAD: live
    ? "The Live Showcase is the AFO product itself, running with fictional businesses. It opens in your browser."
    : "The Live Showcase is the AFO product itself, running with fictional businesses. It opens to visitors once final validation is complete.",
  SHOWCASE_ACTION: live
    ? `${tryLive("primary", "btn-lg")}<p class="showcase-dest">${esc(new URL(config.showcase.url).host)} · opens in a new tab</p>`
    : '<p class="showcase-pending"><span class="pending-dot" aria-hidden="true"></span><span><b>Live demo coming online</b>Final validation in progress.</span></p>',
  SHOWCASE_CHAT_TITLE: phoneLive ? "Call or message AFO like a customer." : "Message AFO like a customer.",
  SHOWCASE_CHAT_TEXT: phoneLive
    ? "Chat, send an enquiry, book online, or get a call code and ring the demo line from your own phone."
    : "Chat, send an enquiry or book online. Describe a job you’d actually get.",

  CONTACT_LIST: hasContact ? `<ul class="contact-list">${contactList}\n        </ul>` : "",
  CONTACT_NOTE: "",

  FINAL_HEADING: live ? "Try it on a job you’d actually get." : "Want AFO on your front office?",
  FINAL_LEAD: live
    ? hasContact
      ? `Play the customer in the Showcase. Then talk to ${esc(founder.shortName)} about your services, prices and how you like jobs handled.`
      : "Play the customer in the Showcase and watch the business side update."
    : hasContact
      ? `Talk to ${esc(founder.shortName)} about your services, prices and how you like jobs handled. The Live Showcase is coming online.`
      : "The Live Showcase is coming online. Until then, this page shows what it does.",
  FINAL_CTAS: finalCtas,

  FOOTER_LINKS: [
    live ? `<a href="${esc(config.showcase.url)}"${extAttrs}>Live Showcase${newTab}</a>` : "",
    hasContact ? `<a href="#contact">${esc(talk)}</a>` : "",
  ].filter(Boolean).join(""),
};

// ---------- Assemble ----------
let html = readFileSync(join(root, "src", "index.html"), "utf8");
html = html.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) => {
  if (!(key in slots)) throw new Error(`build: unknown slot ${m}`);
  return slots[key];
});
if (/\{\{|\}\}/.test(html)) throw new Error("build: unresolved template slot left in output");

const dist = join(root, "dist");
rmSync(dist, { recursive: true, force: true });
for (const d of ["", "js", "fonts", "assets"]) mkdirSync(join(dist, d), { recursive: true });
writeFileSync(join(dist, "index.html"), html);

const styleDir = join(root, "src", "styles");
// Light, string-safe CSS minification: drop comments and collapse whitespace outside quoted strings.
// Set NO_MINIFY=1 to ship the readable source (the modules in src/styles are the source of truth).
function minifyCss(src) {
  return src.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/).map((part, i) => {
    if (i % 2 === 1) return part; // a quoted string: keep as-is
    return part.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};,>])\s*/g, "$1").replace(/;}/g, "}");
  }).join("").trim();
}
const cssSource = readdirSync(styleDir).filter((f) => f.endsWith(".css")).sort()
  .map((f) => `/* ---- ${f} ---- */\n${readFileSync(join(styleDir, f), "utf8")}`).join("\n");
writeFileSync(join(dist, "styles.css"), process.env.NO_MINIFY ? cssSource : minifyCss(cssSource));

// One script file. The source is small ES modules in src/js; the build inlines them (in dependency order,
// each in its own function scope) so the shipped page has no internal import graph. That matters for the
// production release builder (~/Projects/afo-public-release-v1/tools/make-release.mjs): it fingerprints
// every .js file but rewrites references only in HTML and CSS, so relative imports between modules would 404.
function bundle(entry) {
  const dir = join(root, "src", "js");
  const order = [];
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    const text = readFileSync(join(dir, name), "utf8");
    for (const [, dep] of text.matchAll(/^import\s*\{[^}]*\}\s*from\s*"\.\/([\w-]+\.js)";/gm)) visit(dep);
    order.push(name);
  };
  visit(entry);
  const id = (name) => `__${name.replace(/\.js$/, "").replace(/[^\w]/g, "_")}`;
  const parts = order.map((name) => {
    let text = readFileSync(join(dir, name), "utf8");
    const names = [...text.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    text = text.replace(/^export\s+/gm, "");
    text = text.replace(/^import\s*\{([^}]*)\}\s*from\s*"\.\/([\w-]+\.js)";/gm, (_, list, dep) => `const {${list}} = ${id(dep)};`);
    if (/^\s*import[\s{*]/m.test(text) || /\bimport\s*\(/.test(text)) throw new Error(`build: unsupported import form in src/js/${name}`);
    return `// ---- src/js/${name} ----\nconst ${id(name)} = (() => {\n${text.trim()}\n${names.length ? `return { ${names.join(", ")} };` : ""}\n})();`;
  });
  return `// AFO landing page script, bundled by build.mjs from src/js/*.js. Edit the modules, not this file.\n${parts.join("\n\n")}\n`;
}
writeFileSync(join(dist, "js", "site.js"), bundle("main.js"));
for (const f of readdirSync(join(root, "src", "fonts")).filter((f) => f.endsWith(".woff2"))) copyFileSync(join(root, "src", "fonts", f), join(dist, "fonts", f));
for (const f of readdirSync(join(root, "src", "assets"))) copyFileSync(join(root, "src", "assets", f), join(dist, "assets", f));
if (photoOut) copyFileSync(join(root, founder.photo), join(dist, photoOut));
copyFileSync(join(root, "src", "favicon.svg"), join(dist, "favicon.svg"));
for (const f of ["robots.txt", "og.png"]) if (existsSync(join(root, "public", f))) copyFileSync(join(root, "public", f), join(dist, f));

const summary = [`showcase ${config.showcase.state}`, phoneLive ? "phone line live" : "", `${contacts.length} contact route(s)`, photoOut ? "founder photo" : "no founder photo"].filter(Boolean).join(", ");
console.log(`build: dist/ written (${summary})`);
if (!hasContact) console.warn("build: no LinkedIn, email or booking URL configured; the Talk-to buttons and contact list are omitted.");
if (!photoOut) console.warn("build: founder.photo is empty; the founder section renders without a photo.");
if (phoneLive) console.warn("build: phoneLine is live. Publish that only after the founder's real call on the demo line has been observed and the Showcase is approved for prospects.");
