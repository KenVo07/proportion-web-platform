import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const paymentRoute = /(?:^|\/)(?:buy|pay|checkout|payments?|subscribe)(?:[/?.#]|$)/i;
const decode = (text) => text.replace(/&#(x[0-9a-f]+|[0-9]+);?/gi, (entity, code) => {
  const hex = /^x/i.test(code);
  const point = parseInt(hex ? code.slice(1) : code, hex ? 16 : 10);
  return point <= 0x10ffff ? String.fromCodePoint(point) : entity;
})
  .replace(/&amp;/g, "&").replace(/%([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

export async function scanPublicPayment(root) {
  const findings = [];
  async function walk(directory, prefix = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (paymentRoute.test(relative)) findings.push(`${relative}: public payment route`);
      if (entry.isDirectory()) { await walk(join(directory, entry.name), `${relative}/`); continue; }
      if (!/\.(?:html?|js|mjs|css|json|txt|svg|map)$/i.test(entry.name)) continue;
      const body = decode(await readFile(join(directory, entry.name), "utf8"));
      if (/(?:checkout|buy|pay|billing|js|api)\.stripe\.com\b/i.test(body)) findings.push(`${relative}: Stripe payment destination or client SDK`);
      if (/\b[spr]k_(?:live|test)_[a-z0-9_]+/i.test(body)) findings.push(`${relative}: Stripe key`);
      for (const match of body.matchAll(/(?:href|action)\s*=\s*["']([^"']+)["']/gi)) {
        let path;
        try { path = new URL(match[1], "https://public.invalid/").pathname; } catch { continue; }
        if (paymentRoute.test(path)) findings.push(`${relative}: public payment action`);
      }
      if (/<(?:a|button)\b[^>]*>\s*(?:buy(?: now)?|pay(?: now)?|checkout|start (?:a )?trial|subscribe)\s*</i.test(body)) findings.push(`${relative}: public payment CTA`);
    }
  }
  await walk(root instanceof URL ? fileURLToPath(root) : root);
  return findings.sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = await scanPublicPayment(process.argv[2] || new URL("../dist/", import.meta.url));
  for (const finding of findings) console.error(finding); // names only; never echo a detected key
  console.log(`public-payment: ${findings.length ? "FAIL" : "PASS"} (${findings.length} findings)`);
  if (findings.length) process.exitCode = 1;
}
