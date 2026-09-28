// Build: applies site.config.json to src/index.html and writes a static site to dist/.
// No framework, no bundler. Everything the page needs is copied verbatim except the
// call-to-action slots, which depend on whether the Live Showcase is prospect-ready.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
// SITE_CONFIG=path lets you preview another configuration (for example the live-Showcase state) without editing the checked-in one.
const config = JSON.parse(readFileSync(process.env.SITE_CONFIG || join(root, "site.config.json"), "utf8"));
const showcaseLive = config.showcase.state === "live";
const phoneLive = showcaseLive && config.showcase.phoneLine === "live";
const contact = config.contact.href ? config.contact : null;

if (!["live", "pending"].includes(config.showcase.state)) {
  throw new Error(`site.config.json: showcase.state must be "live" or "pending"`);
}
if (!contact) {
  console.warn("build: contact.href is empty, so contact links are omitted from the page.");
}

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const link = ({ href, label, kind, external = false }) =>
  `<a class="btn btn-${kind}" href="${escape(href)}"${external ? ' rel="noopener"' : ""}>${escape(label)}${external ? '<span class="btn-arrow" aria-hidden="true">↗</span>' : ""}</a>`;

const tryLive = () => link({ href: config.showcase.url, label: "Try AFO live", kind: "primary", external: true });
const howItWorks = (kind) => link({ href: "#how-it-works", label: "See how it works", kind });
const contactLink = (kind) => (contact ? link({ href: contact.href, label: contact.label, kind, external: /^https?:/.test(contact.href) }) : "");

const slots = {
  SITE_URL: escape(config.siteUrl),
  FOUNDER_NAME: escape(config.founder.name),
  FOUNDER_LOCATION: escape(config.founder.location),
  SHOWCASE_URL: escape(config.showcase.url),

  // Header: one button only.
  NAV_CTA: showcaseLive ? tryLive() : howItWorks("primary"),

  // Hero: primary + optional secondary, then one honest line about the Showcase.
  HERO_CTAS: showcaseLive
    ? `${tryLive()}${howItWorks("secondary")}`
    : `${howItWorks("primary")}${contactLink("secondary")}`,
  HERO_NOTE: showcaseLive
    ? "Fictional businesses, real conversations. Nothing to install."
    : "The live Showcase is being prepared for prospects. This page describes what it shows.",

  // Showcase section.
  SHOWCASE_STATUS: showcaseLive
    ? `<p class="lead">Open the Showcase in your browser. It runs on the real AFO runtime with fictional businesses, so you can try it before you talk to anyone.</p>`
    : `<p class="lead">The Showcase is being prepared for prospects and is not open yet. Everything on this page describes what it does when it opens.</p>`,
  SHOWCASE_PHONE: phoneLive
    ? `<li><span><b>By phone as well.</b> Get a call code on screen, then ring the demo line from your own phone and talk to AFO out loud.</span></li>`
    : "",
  SHOWCASE_CTAS: showcaseLive ? tryLive() : contactLink("primary"),

  // Final call to action.
  FINAL_HEADING: showcaseLive ? "Try AFO before you talk to anyone." : "See what AFO would do with your next enquiry.",
  FINAL_CTAS: showcaseLive ? `${tryLive()}${contactLink("secondary")}` : `${contactLink("primary")}${howItWorks(contact ? "secondary" : "primary")}`,

  FOOTER_LINKS: [
    showcaseLive ? `<a href="${escape(config.showcase.url)}" rel="noopener">Live Showcase</a>` : "",
    contact ? `<a href="${escape(contact.href)}"${/^https?:/.test(contact.href) ? ' rel="noopener"' : ""}>${escape(contact.label)}</a>` : "",
  ].filter(Boolean).join(""),
};

let html = readFileSync(join(root, "src", "index.html"), "utf8");
html = html.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) => {
  if (!(key in slots)) throw new Error(`build: unknown slot ${m}`);
  return slots[key];
});
if (/\{\{/.test(html)) throw new Error("build: unresolved template slot left in output");

const dist = join(root, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, "index.html"), html);
for (const f of ["styles.css", "site.js", "favicon.svg"]) copyFileSync(join(root, "src", f), join(dist, f));
for (const f of ["robots.txt", "og.png"]) if (existsSync(join(root, "public", f))) copyFileSync(join(root, "public", f), join(dist, f));

console.log(`build: dist/ written (showcase ${config.showcase.state}${phoneLive ? ", phone line live" : ""}${contact ? ", contact set" : ", no contact"})`);
