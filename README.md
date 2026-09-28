# AFO public website (proportion.systems)

The public landing page for **AFO, the AI Front Office for service businesses**, built by Proportion.
One static page: plain HTML, one stylesheet, one small script. No framework, no runtime dependencies.

The page describes what the AFO Live Showcase does and points to it. It contains **no Showcase
logic**; the Showcase lives in its own repository and is served separately at `demo.proportion.systems`.

## Run it

```bash
npm ci --ignore-scripts     # optional: only needed for the verification tools (Playwright, axe-core)
npm run build               # writes dist/
npm run dev                 # builds, then serves dist/ at http://127.0.0.1:4400
```

`dist/` is the whole site: `index.html`, `styles.css`, `site.js`, `favicon.svg`, `og.png`, `robots.txt`.

## Configure the calls to action (`site.config.json`)

All CTA destinations are stamped in at build time from one file, so the page is never edited by hand to
switch states.

| Key | Values | Effect |
|---|---|---|
| `showcase.state` | `"pending"` (default) or `"live"` | `live` makes **Try AFO live** the primary CTA everywhere and links it to `showcase.url`. `pending` keeps the Showcase out of the CTAs and states plainly that it is being prepared. |
| `showcase.url` | URL | `https://demo.proportion.systems/`. Only used when `state` is `live`. |
| `showcase.phoneLine` | `"pending"` or `"live"` | Adds the "By phone as well" step to the Showcase section. Only used when the Showcase is live. |
| `contact.href` / `contact.label` | mailto:, https:// LinkedIn URL, etc. | Adds a **Get in touch** style link as the secondary (or, before the Showcase is live, primary) CTA and a footer link. Empty by default: no invented email address is shipped. |
| `founder.name`, `founder.location` | text | Used in the founder section and footer. |
| `siteUrl` | URL | Canonical URL and Open Graph image base. |

To preview another state without editing the checked-in file:

```bash
SITE_CONFIG=/path/to/other.json npm run build
```

**When the founder confirms the Showcase is prospect-ready:** set `showcase.state` to `"live"`
(and `showcase.phoneLine` to `"live"` once the demo phone line is accepted), rebuild, deploy.

## Verify

```bash
npm run check        # template leftovers, banned marketing phrases, rejected claim wording, anchors, heading order, external hosts, size budget
npm run a11y         # axe-core (WCAG 2.1 A/AA + best practice) at 390px and 1440px, plus a keyboard focus pass
npm run screenshots  # fold + full page at 320 / 390 / 768 / 1024 / 1440 into docs/screenshots, and a horizontal-overflow check
npm run copy         # regenerates docs/COPY.md, the exact visible copy of the built page
npm run og           # re-renders public/og.png from src/og.html
npm run verify       # check + a11y + screenshots + copy
```

## Deploy

The output is static, so any static host works. Do not deploy to production without the founder's
explicit go-ahead.

- **Cloudflare Pages / Netlify / Vercel:** build command `npm run build`, output directory `dist`.
- **Own server (Caddy):** serve `dist/` as the site root, for example

  ```
  proportion.systems {
      root * /srv/afo-public-website/dist
      file_server
      header Cache-Control "public, max-age=300"
  }
  ```

The apex `proportion.systems` currently resolves to a host that is not managed from this repository;
pointing it at this site is a DNS/hosting change for the founder to make.

## Layout of the repository

```
src/index.html      the page, with {{SLOT}} markers for the config-driven CTAs
src/styles.css      all styles; tokens at the top mirror the Showcase (warm canvas, slate ink, teal accent)
src/site.js         reveal-on-scroll only; the page is complete without it
src/og.html         source for the 1200x630 link-preview image
build.mjs           applies site.config.json and writes dist/
tools/              serve, check, a11y, screenshots, extract-copy, og
docs/               DESIGN_RATIONALE.md, COPY.md, CLAIMS_NOT_USED.md, RED_TEAM.md, screenshots/
```

## Editing guidance

- Product claims must map to something visible in the Showcase. `docs/CLAIMS_NOT_USED.md` lists what was
  deliberately left out and why; extend it rather than adding a claim you cannot show.
- The product visuals are HTML mock-ups that mirror the real Showcase business view (labels, states and
  chips are the product's own). They use the fictional Riverbend Plumbing demo business and are captioned as such.
- Keep the page to one `h1`, semantic sections, and no external requests. `npm run check` enforces most of this.
