import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const original = JSON.parse(readFileSync(new URL("site.config.json", root), "utf8"));
function build(config = original, state = "pending") {
  const scratch = mkdtempSync(join(tmpdir(), "funnel-config-"));
  const path = join(scratch, "site.json");
  writeFileSync(path, JSON.stringify(config));
  try {
    execFileSync(process.execPath, ["build.mjs"], { cwd: root, env: { ...process.env, SITE_CONFIG: path, SHOWCASE_STATE: state }, stdio: "pipe" });
    return readFileSync(new URL("dist/index.html", root), "utf8");
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}

test("A: pending has zero public Showcase destinations; B: live has exactly five canonical links", () => {
  assert.doesNotMatch(build(), /https:\/\/demo\.proportion\.systems|Try AFO live/);
  const links = [...build(original, "live").matchAll(/<a\b[^>]*href="(https:\/\/demo\.proportion\.systems[^\"]*)"[^>]*>/g)];
  assert.equal(links.length, 5);
  for (const link of links) {
    assert.equal(link[1], "https://demo.proportion.systems/");
    assert.match(link[0], /data-funnel="showcase"/);
    assert.match(link[0], /rel="[^"]*noopener/);
  }
});

test("both states reject every noncanonical Showcase URL, including plausible public alternatives", () => {
  for (const url of ["https://other.example.test/", "https://demo.proportion.systems/preview", "https://demo.proportion.systems/?next=founder", "https://demo.proportion.systems:444/", "https://user@demo.proportion.systems/", "https://demo.proportion.systems.evil.test/", "http://127.0.0.1:4323/", "https://10.42.0.1/"]) {
    for (const state of ["pending", "live"]) {
      const config = structuredClone(original);
      config.showcase.url = url;
      assert.throws(() => build(config, state), /showcase.url/);
    }
  }
});

test("one release contract derives contact and all three billing returns from the public site", () => {
  const result = JSON.parse(execFileSync(process.execPath, ["tools/export-funnel.mjs"], { cwd: root, encoding: "utf8" }));
  assert.deepEqual(result, {
    version: 1, publicSiteUrl: original.siteUrl, showcaseUrl: original.showcase.url,
    contactUrl: "https://proportion.systems/#contact",
    billingReturnUrls: {
      success: "https://proportion.systems/billing-success.html",
      cancel: "https://proportion.systems/billing-cancel.html",
      portal: "https://proportion.systems/billing-return.html",
    },
  });
  assert.throws(() => execFileSync(process.execPath, ["tools/export-funnel.mjs", "--release"], { cwd: root, stdio: "pipe" }), /contact/);
  const scratch = mkdtempSync(join(tmpdir(), "funnel-release-"));
  const path = join(scratch, "site.json");
  const configured = structuredClone(original);
  configured.contact.email = "founder@public-funnel.test";
  writeFileSync(path, JSON.stringify(configured));
  try {
    const exported = execFileSync(process.execPath, ["tools/export-funnel.mjs", "--release"], {
      cwd: root, env: { ...process.env, SITE_CONFIG: path }, encoding: "utf8",
    });
    assert.deepEqual(JSON.parse(exported), result);
    assert.doesNotMatch(exported, /founder@public-funnel\.test/);
    assert.match(build(configured), /class="contact-link contact-email"/);
  } finally { rmSync(scratch, { recursive: true, force: true }); }
});

test("E/F/G: static returns explain onboarding, cancellation and billing help without query interpolation", () => {
  build();
  for (const [name, heading] of [["success", "Your checkout step is complete."], ["cancel", "Checkout wasn’t completed."], ["return", "Back from billing."]]) {
    const html = readFileSync(new URL(`dist/billing-${name}.html`, root), "utf8");
    assert.ok(html.includes(heading));
    assert.match(html, /href="https:\/\/proportion\.systems\/#contact"/);
    assert.match(html, /name="referrer" content="no-referrer"/);
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(html, /session_id|client_id|\{CHECKOUT_SESSION_ID\}|AFO is active|payment received/i);
    if (name === "success") assert.match(html, /AFO activation is a separate, founder-assisted step/);
  }
});
