// Cross-repository local qualification. Canonical browser origins are fulfilled
// from two loopback fixtures; every other browser request is blocked.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { start } from "./serve.mjs";
import { canonicalFunnel } from "./funnel-config.mjs";
import { scanPublicPayment } from "./public-payment-check.mjs";
import { createBillingReturnFixture } from "./funnel-billing.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const showcaseRepo = process.env.SHOWCASE_REPO;
const billingRepo = process.env.BILLING_REPO;
assert.ok(showcaseRepo && billingRepo, "SHOWCASE_REPO and BILLING_REPO must name the recovered integration checkouts");
const load = (repo, path) => import(pathToFileURL(join(repo, path)).href);
const [{ showcaseRig, JOURNEY_MESSAGES }, { createShowcaseServer }, { validatePublicFunnel, stampPublicFunnel }] = await Promise.all([
  load(showcaseRepo, "tests/showcase-fixture.ts"), load(showcaseRepo, "src/showcase/server.ts"), load(showcaseRepo, "src/showcase/public-funnel.ts"),
]);
const evidence = process.env.FUNNEL_EVIDENCE_DIR || join(root, "docs/public-funnel");
await mkdir(join(evidence, "screenshots"), { recursive: true });
const scratch = await mkdtemp(join(tmpdir(), "public-funnel-browser-"));
const config = JSON.parse(await readFile(join(root, "site.config.json"), "utf8"));
config.contact.email = "founder@public-funnel.test"; // synthetic release contact, never production configuration
const configPath = join(scratch, "site.json");
await writeFile(configPath, JSON.stringify(config));
const funnel = validatePublicFunnel(canonicalFunnel(config));
assert.equal(await readFile(join(root, "src/js/funnel.js"), "utf8"), await readFile(join(showcaseRepo, "src/showcase/public/funnel.js"), "utf8"), "attribution contract must agree across repositories");
let fixtureBuilt = false;
const build = (state) => {
  execFileSync(process.execPath, ["build.mjs"], { cwd: root, env: { ...process.env, SITE_CONFIG: configPath, SHOWCASE_STATE: state, PHONE_LINE: "pending" }, stdio: "pipe" });
  fixtureBuilt = true;
};
const rig = await showcaseRig();
let showcase, landing, billingFixture, browser, axe;
const outcomes = [];
const blocked = [];
const errors = [];
const report = (id, width, detail) => { outcomes.push({ id, width, pass: true, detail }); console.log(`${id} ${width}px: PASS — ${detail}`); };
const shot = (page, name, fullPage = false) => page.screenshot({ path: join(evidence, "screenshots", `${name}.png`), fullPage });
async function a11y(page, label, include) {
  await page.evaluate(axe); // test injection preserves the production script-src policy
  const violations = await page.evaluate(async (include) => {
    const result = await window.axe.run(include ? { include: [[include]] } : document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } });
    return result.violations.map((v) => ({ id: v.id, impact: v.impact, targets: v.nodes.map((node) => node.target) }));
  }, include);
  assert.deepEqual(violations, [], label);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: horizontal overflow`);
}
try {
  showcase = createShowcaseServer({ host: rig.host, secureCookie: false, ingress: "DIRECT", allowedOrigins: [new URL(funnel.showcaseUrl).origin],
    renderPublicPage: (html) => stampPublicFunnel(html, funnel), log: () => undefined });
  showcase.prependListener("request", (_request, response) => response.setHeader("Date", rig.clock.now.toUTCString()));
  await new Promise((resolve, reject) => { showcase.once("error", reject); showcase.listen(0, "127.0.0.1", resolve); });
  landing = await start(0);
  const origins = new Map([
    [new URL(funnel.publicSiteUrl).origin, `http://127.0.0.1:${landing.address().port}`],
    [new URL(funnel.showcaseUrl).origin, `http://127.0.0.1:${showcase.address().port}`],
  ]);
  billingFixture = await createBillingReturnFixture(billingRepo, funnel, scratch);
  browser = await chromium.launch();
  axe = await readFile(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "reduce", isMobile: width === 390, hasTouch: width === 390 });
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      const local = origins.get(url.origin);
      if (!local) { blocked.push(url.origin); return route.abort(); }
      const response = await route.fetch({ url: `${local}${url.pathname}${url.search}` });
      await route.fulfill({ response });
    });
    context.on("page", (page) => {
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (["error", "warning"].includes(message.type())) errors.push(message.text()); });
    });
    const page = await context.newPage();
    const campaign = "?utm_campaign=public-funnel-v1&utm_source=founder-outreach&email=synthetic%40public-funnel.test&session_id=synthetic-secret";
    build("pending");
    await page.goto(funnel.publicSiteUrl + campaign);
    assert.equal(await page.locator('a[data-funnel="showcase"]').count(), 0);
    assert.doesNotMatch(await page.content(), /https:\/\/demo\.proportion\.systems/);
    report("A", width, "pending exposes zero Showcase links");
    build("live");
    await page.reload();
    const links = await page.locator('a[data-funnel="showcase"]').evaluateAll((nodes) => nodes.map((node) => node.href));
    assert.equal(links.length, 5);
    assert.equal(new Set(links).size, 1);
    assert.equal(new URL(links[0]).origin, new URL(funnel.showcaseUrl).origin);
    assert.deepEqual([...new URL(links[0]).searchParams.keys()], ["utm_campaign", "utm_source", "utm_medium"]);
    await shot(page, `landing-live-${width}`);
    const [demo] = await Promise.all([context.waitForEvent("page"), page.locator('a[data-funnel="showcase"]').first().click()]);
    await demo.waitForLoadState("domcontentloaded");
    await demo.locator(".biz-card").first().waitFor();
    report("B", width, "all five links agree; a real click opens the canonical Showcase");
    await shot(demo, `showcase-entry-${width}`, true);
    await a11y(demo, "Showcase entry");
    await demo.locator('a[data-funnel="site"]').click();
    await demo.waitForURL((url) => url.origin === new URL(funnel.publicSiteUrl).origin);
    report("C", width, "Back to Proportion reaches the configured public site");
    await demo.goto(links[0]);
    await demo.locator('.biz-card[data-profile="plumbing"]').click();
    await demo.locator("#doorChat").click();
    await demo.locator("#chatLog .msg.afo").first().waitFor();
    for (const message of [JOURNEY_MESSAGES.burst, JOURNEY_MESSAGES.waterOff]) {
      const replies = await demo.locator("#chatLog .msg.afo").count();
      await demo.locator("#messageInput").fill(message);
      await demo.locator("#sendButton").click();
      await demo.waitForFunction((before) => document.querySelectorAll("#chatLog .msg.afo").length > before, replies);
    }
    if (width === 390) await demo.locator("#officeStrip").click();
    await demo.locator("#toProof").click();
    await demo.locator("#toNext").click();
    const contact = demo.locator('a[data-funnel="contact"]');
    await contact.waitFor();
    const href = await contact.getAttribute("href");
    assert.equal(new URL(href).origin, new URL(funnel.contactUrl).origin);
    assert.equal(new URL(href).hash, "#contact");
    assert.equal(new URL(href).searchParams.get("utm_source"), "founder-outreach");
    assert.doesNotMatch(href, /session_id|email|synthetic-secret|stripe\.com/);
    await shot(demo, `showcase-setup-${width}`, true);
    await a11y(demo, "Showcase setup");
    if (width === 1440) for (const responsive of [768, 1024, 1280, 1600]) {
      await demo.setViewportSize({ width: responsive, height: 1000 });
      await a11y(demo, `Showcase setup ${responsive}`);
    }
    await demo.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const [destination] = await Promise.all([context.waitForEvent("page"), contact.click()]);
    await destination.waitForURL((url) => url.hash === "#contact");
    await destination.locator(".contact-list").waitFor();
    await a11y(destination, "Landing contact", "#contact");
    await shot(destination, `landing-contact-${width}`);
    report("D", width, "after the real fixture experience, setup reaches the shared contact route with safe attribution");
    for (const [id, kind, title] of [["E", "success", "Your checkout step is complete."], ["F", "cancel", "Checkout wasn’t completed."], ["G", "portal", "Back from billing."]]) {
      await page.goto(funnel.billingReturnUrls[kind] + "?session_id=synthetic-private-payload&email=synthetic%40public-funnel.test#synthetic-secret");
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      assert.equal(await page.evaluate(() => location.search + location.hash), "");
      assert.doesNotMatch(await page.content(), /synthetic-private-payload|synthetic-secret|session_id/);
      assert.equal(await page.getByRole("link", { name: "Talk to Proportion" }).getAttribute("href"), funnel.contactUrl);
      await a11y(page, `billing ${kind}`);
      await shot(page, `billing-${kind}-${width}`, true);
      report(id, width, "founder fixture return URL reaches the truthful public surface; no query payload rendered or forwarded");
    }
    await context.close();
  }
  assert.deepEqual(await scanPublicPayment(join(root, "dist")), []);
  assert.deepEqual(await scanPublicPayment(join(showcaseRepo, "src/showcase/public")), []);
  await billingFixture.assertUnchanged();
  assert.deepEqual(blocked, [], "no browser request escaped the two local fixture origins");
  assert.deepEqual(errors, [], "console must be clean");
  report("H", 0, "zero public payment entries or Stripe keys on either surface; provider calls zero");
  await writeFile(join(evidence, "cross-surface.json"), JSON.stringify({ pass: true, outcomes, consoleErrors: errors, externalRequests: blocked, liveStripeUsed: false, autoActivationChanged: false }, null, 2));
} finally {
  await browser?.close();
  if (landing?.listening) await new Promise((resolve) => landing.close(resolve));
  if (showcase?.listening) await new Promise((resolve) => showcase.close(resolve));
  await rig.host.close();
  await billingFixture?.billing.drain();
  await rm(scratch, { recursive: true, force: true });
  if (fixtureBuilt) execFileSync(process.execPath, ["build.mjs"], { cwd: root,
    env: { ...process.env, SITE_CONFIG: join(root, "site.config.json"), SHOWCASE_STATE: "pending", PHONE_LINE: "pending" }, stdio: "pipe" });
}
