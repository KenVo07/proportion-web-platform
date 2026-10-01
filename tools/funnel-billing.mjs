// Qualification uses the real Billing service and its existing offline Stripe
// simulator. Provider URLs/keys/IDs stay inside the fixture and never reach dist/.
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalFunnel } from "./funnel-config.mjs";

export async function createBillingReturnFixture(repo, funnel, root) {
  const load = (path) => import(pathToFileURL(join(repo, path)).href);
  const [{ StripeSim, TEST_CONFIG }, { BillingStore }, { BillingService }] = await Promise.all([
    load("tests/billing-stripe-sim.ts"), load("src/billing/store.ts"), load("src/billing/service.ts"),
  ]);
  const sim = new StripeSim();
  const inputs = {};
  const createCheckout = sim.createCheckoutSession.bind(sim);
  sim.createCheckoutSession = async (input, key) => { inputs.checkout = input; return createCheckout(input, key); };
  const createPortal = sim.createPortalSession.bind(sim);
  sim.createPortalSession = async (input) => { inputs.portal = input; return createPortal(input); };
  const store = await BillingStore.open(join(root, "billing"), { mode: "test" });
  const billing = new BillingService({ config: { ...TEST_CONFIG, successUrl: funnel.billingReturnUrls.success,
    cancelUrl: funnel.billingReturnUrls.cancel, portalReturnUrl: funnel.billingReturnUrls.portal },
    store, stripe: sim, now: () => new Date(sim.clock * 1000), log: () => undefined });
  await billing.startCheckout({ clientId: "funnel-fixture", plan: "monthly", trial: true });
  await billing.startPortal("funnel-fixture");
  const bindings = { success: inputs.checkout.successUrl, cancel: inputs.checkout.cancelUrl, portal: inputs.portal.returnUrl };
  assert.deepEqual(bindings, funnel.billingReturnUrls);
  const before = await billing.view("funnel-fixture");
  assert.equal(before.record.status, "NO_SUBSCRIPTION");
  assert.equal(before.eligibility.billingEligibleForFounderActivation, false);
  return {
    billing, bindings,
    async assertUnchanged() { assert.deepEqual(await billing.view("funnel-fixture"), before, "public returns cannot mutate billing or activate a client"); },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.env.BILLING_REPO, "BILLING_REPO must name the recovered Billing integration checkout");
  const scratch = await mkdtemp(join(tmpdir(), "public-funnel-billing-"));
  let fixture;
  try {
    const config = JSON.parse(await readFile(process.env.SITE_CONFIG || new URL("../site.config.json", import.meta.url), "utf8"));
    fixture = await createBillingReturnFixture(process.env.BILLING_REPO, canonicalFunnel(config), scratch);
    await fixture.assertUnchanged();
    console.log(JSON.stringify({ pass: true, bindings: fixture.bindings, autoActivationChanged: false, liveStripeUsed: false }, null, 2));
  } finally { await fixture?.billing.drain(); await rm(scratch, { recursive: true, force: true }); }
}
