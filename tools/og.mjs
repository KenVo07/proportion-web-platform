// Renders src/og.html to public/og.png (1200x630) for link previews. Requires the playwright devDependency.
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(root, "src", "og.html")).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
await page.screenshot({ path: join(root, "public", "og.png"), type: "png" });
await browser.close();
console.log("public/og.png written");
