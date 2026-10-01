import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { scanPublicPayment } from "../tools/public-payment-check.mjs";

test("H: the entire public build has zero payment entries and zero Stripe keys", async () => {
  assert.deepEqual(await scanPublicPayment(new URL("../dist/", import.meta.url)), []);
});
test("the negative gate detects payment destinations, public routes and either key mode", async () => {
  const root = mkdtempSync(join(tmpdir(), "payment-negative-control-"));
  try {
    const cases = [
      '<a href="https://checkout.stripe.com/c/pay/synthetic">Continue</a>',
      '<a href="https://buy.stripe.com/synthetic">Continue</a>',
      '<a href="https://checkout&#46;stripe.com/c/pay/synthetic">Continue</a>',
      '<a href="https://checkout&#X2e;stripe.com/c/pay/synthetic">Continue</a>',
      '<a href="/checkout">Continue</a>', '<form action="/pay">Continue</form>', '<a href="/%63heckout">Continue</a>',
      ...["sk_live", "sk_test", "pk_live", "pk_test", "rk_live", "rk_test"].map((prefix) => `const key = "${prefix}_syntheticNeverAKey";`),
      '<button>Buy now</button>', '<a href="/subscribe">Start a trial</a>',
    ];
    for (const body of cases) {
      writeFileSync(join(root, "index.html"), body);
      assert.ok((await scanPublicPayment(root)).length > 0, "negative control was missed");
    }
    writeFileSync(join(root, "index.html"), '<a href="/#contact">Talk about setup</a>');
    writeFileSync(join(root, "checkout.html"), "unlinked route");
    assert.ok((await scanPublicPayment(root)).some((finding) => finding.includes("checkout.html")));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
