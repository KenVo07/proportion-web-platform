import assert from "node:assert/strict";
import test from "node:test";
import { withAttribution } from "../src/js/funnel.js";

const demo = "https://demo.proportion.systems/";
const contact = "https://proportion.systems/#contact";
test("ordinary navigation stays at the exact canonical URL without the approved campaign", () => {
  for (const query of ["", "?utm_campaign=unknown", "?utm_campaign=cs_test_synthetic", "?utm_campaign=public-funnel-v1&utm_campaign=other"]) {
    assert.equal(withAttribution(demo, query, "landing"), demo);
  }
});
test("campaign and a fixed source survive Landing → Showcase → contact; arbitrary payloads do not", () => {
  const query = "?utm_campaign=public-funnel-v1&utm_source=founder-outreach&email=fictional%40example.test&phone=0412345678&session_id=cs_test_synthetic&token=synthetic-secret&next=https://example.test/";
  const landing = withAttribution(demo, query, "landing");
  const destination = withAttribution(contact, new URL(landing).search, "showcase");
  assert.equal(destination, "https://proportion.systems/?utm_campaign=public-funnel-v1&utm_source=founder-outreach&utm_medium=referral#contact");
  assert.deepEqual([...new URL(destination).searchParams.keys()], ["utm_campaign", "utm_source", "utm_medium"]);
});
test("unrecognized, duplicated and personal-looking sources are replaced with a fixed surface label", () => {
  for (const source of ["fictional@example.test", "0412345678", "cus_synthetic", "sk_test_synthetic", "unknown", "landing&utm_source=showcase"]) {
    const query = `?utm_campaign=public-funnel-v1&utm_source=${source}`;
    assert.equal(new URL(withAttribution(contact, query, "showcase")).searchParams.get("utm_source"), "showcase");
  }
});
