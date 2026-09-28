// Minimal static server for previewing dist/. No dependencies.
//   npm run dev                 -> http://127.0.0.1:4400 (this computer only)
//   HOST=0.0.0.0 npm run dev    -> also reachable from a phone on the same Wi-Fi (prints the address)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT || 4400);
const host = process.env.HOST || "127.0.0.1";
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

export function start(p = port, h = host) {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    const file = join(dist, path === "/" ? "index.html" : path);
    if (!file.startsWith(dist)) { res.writeHead(403); return res.end(); }
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not found");
    }
  });
  return new Promise((resolve) => server.listen(p, h, () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await start(port, host);
  console.log(`serving dist/ at http://127.0.0.1:${port}`);
  if (host === "0.0.0.0") {
    for (const list of Object.values(networkInterfaces())) for (const a of list || []) {
      if (a.family === "IPv4" && !a.internal) console.log(`on your phone (same Wi-Fi): http://${a.address}:${port}`);
    }
  }
}
