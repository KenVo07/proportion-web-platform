import assert from "node:assert/strict";
import test from "node:test";
import { canonicalFunnel, founderContactConfigured } from "../tools/funnel-config.mjs";

const config = { siteUrl: "https://proportion.systems/", showcase: { url: "https://demo.proportion.systems/" }, contact: {} };
test("the public origin is release-bound and all dependent destinations move together", () => {
  const next = canonicalFunnel({ ...config, siteUrl: "https://release.public-funnel.test/" });
  assert.equal(next.contactUrl, "https://release.public-funnel.test/#contact");
  for (const url of Object.values(next.billingReturnUrls)) assert.equal(new URL(url).origin, "https://release.public-funnel.test");
  for (const siteUrl of ["http://proportion.systems/", "https://localhost/", "https://127.0.0.1/", "https://10.42.0.1/", "https://user@proportion.systems/", "https://proportion.systems/?secret=synthetic", "https://buy.stripe.com/"]) {
    assert.throws(() => canonicalFunnel({ ...config, siteUrl }));
  }
});
test("the release gate requires usable founder contact and rejects a public payment booking destination", () => {
  assert.equal(founderContactConfigured({}), false);
  assert.equal(founderContactConfigured({ email: "founder@public-funnel.test" }), true);
  for (const contact of [{ email: "invalid" }, { linkedin: "https://example.test/" }, { bookingUrl: "https://checkout.stripe.com/c/pay/synthetic" }, { bookingUrl: "https://buy.stripe.com/synthetic" }, { bookingUrl: "https://proportion.systems/checkout" }]) {
    assert.throws(() => founderContactConfigured(contact), /contact/);
  }
});
