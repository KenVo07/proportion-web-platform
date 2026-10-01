import { readFileSync } from "node:fs";
import { canonicalFunnel, founderContactConfigured } from "./funnel-config.mjs";

const config = JSON.parse(readFileSync(process.env.SITE_CONFIG || new URL("../site.config.json", import.meta.url), "utf8"));
const funnel = canonicalFunnel(config);
if (process.argv.includes("--release") && !founderContactConfigured(config.contact)) {
  throw new Error("release requires a founder contact route in site.config.json");
}
process.stdout.write(`${JSON.stringify(funnel, null, 2)}\n`);
