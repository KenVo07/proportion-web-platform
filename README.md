# AFO public website (proportion.systems) — V2

The public landing page for **AFO, the AI Front Office for service businesses**, by Proportion.
One static page, with no framework and no runtime dependencies:

- plain HTML
- CSS modules concatenated and lightly minified at build time
- five small ES modules bundled into one script at build time
- two self-hosted fonts

The page shows the AFO product as its own visual. A pinned product stage replays one enquiry to the fictional
Riverbend Plumbing, from the first message to the owner's decision. It recomposes as you scroll, using the
Showcase's own interface wording. The page contains **no Showcase logic**. The live Showcase is a separate
product served at `demo.proportion.systems`.

## Preview it

```bash
npm ci --ignore-scripts      # dev tools only (Playwright, axe-core); the site itself needs nothing
npm run dev                  # builds, then serves dist/ at http://127.0.0.1:4400
npm run dev:live             # same, previewing the "Showcase live" calls to action
HOST=0.0.0.0 npm run dev     # also reachable from a phone on the same Wi-Fi (the address is printed)
```

On the phone preview, scroll slowly through the dark story section. The stage should pin under the nav, and each
paragraph should move the product into its next state. With **Reduce motion** turned on, the same frames appear
without movement.

The review screenshots and motion filmstrips are in `docs/screenshots/` (live-state variant in
`docs/screenshots/live-state/`).

## Configure it (`site.config.json`)

Everything that depends on the founder's decisions is stamped in at build time from one file. Never hand-edit the
built page to change these.

| Key | Values | Effect |
|---|---|---|
| `showcase.state` | `"pending"` (default) or `"live"` | `live` makes **Try AFO live** the primary call to action in the nav, hero, Showcase section and final panel, linking to `showcase.url` in a new tab. `pending` shows a truthful "coming online" status instead, with no link to the Showcase anywhere and no "Try AFO live" wording (`npm run check` fails otherwise). |
| `showcase.url` | URL | `https://demo.proportion.systems/`, the production Showcase. Used only when `state` is `live`. The build refuses local, private-network and preview URLs: the founder's local interactive preview must never be linked from this page. |
| `showcase.phoneLine` | `"pending"` or `"live"` | Adds "ring the demo line from your own phone" to the Showcase section (only when `state` is also `live`). **Keep it `pending` until the founder has observed a real call on the demo line and approved the Showcase for prospects.** The build prints a warning when it is live. |
| `founder.name`, `founder.shortName`, `founder.role`, `founder.location` | text | Founder section, hero byline, footer, and the **Talk to Khoa** button. |
| `founder.photo` | path, e.g. `content/founder.jpg` | Real photo only: 4:5 portrait, at least 840 px wide, JPG, WebP or AVIF, under about 150 KB. Copied to `dist/assets/founder.<ext>`. Empty means the section renders without a photo. There is never a placeholder or avatar. |
| `founder.photoAlt` | text | Alt text for the photo. |
| `contact.linkedin` | `https://www.linkedin.com/in/<name>` | LinkedIn card in the founder section. |
| `contact.email` | business address | Email card (`mailto:`). |
| `contact.bookingUrl`, `contact.bookingLabel` | `https://…` scheduling link (for example a Google Calendar appointment page) | Optional **Book a short call** card. The page has no scheduler of its own. |

How the calls to action follow from that (one primary action per screen):

| Showcase | Contact configured | Nav | Hero | Final panel |
|---|---|---|---|---|
| live | yes | Try AFO live | Try AFO live · See how it works | Try AFO live · Talk to Khoa |
| live | no | Try AFO live | Try AFO live · See how it works | Try AFO live |
| pending | yes | Talk to Khoa | See how it works · Talk to Khoa | Talk to Khoa · See how it works |
| pending | no | See how it works | See how it works | See how it works |

The Live Showcase section is the same in both states except for its action: **live** shows one **Try AFO live**
button (with the destination host); **pending** shows a "Live demo coming online" status and no link.

The pre-D2 [public funnel integration](docs/PUBLIC_FUNNEL_GLUE_V1.md) derives one public-only
URL contract for Landing, Showcase and the founder-created Stripe return paths. It keeps
public payment closed and adds three static return surfaces without activating AFO.

Preview another state without editing the file: `SHOWCASE_STATE=live npm run build`, `PHONE_LINE=live …`, or
`SITE_CONFIG=path/to/other.json npm run build`.

**Before sharing the page with prospects:** add at least one contact route (LinkedIn or email), and a real founder
photo if you have one. Switch `showcase.state` to `live` once the Showcase is prospect-ready.

## Verify it

```bash
npm run check        # template slots, banned hype, rejected/unsupported claim wording, anchors, heading order, hosts,
                     # Showcase pending/live link rules, public-safety (internal IDs, local paths, dev/preview routes), size budget
npm run a11y         # axe-core (WCAG 2.1 A/AA) at 390 and 1440 on the page and on story frames as seen, keyboard focus,
                     # reduced motion, reduced transparency, increased contrast, JavaScript off
npm run stage        # every story frame at 4 widths: no product-UI text or chip escapes its card
npm run perf         # CLS, LCP, long tasks and frame timing while scrolling the whole page (phone at 4x CPU throttle)
npm run screenshots  # regenerates docs/screenshots (first screens at 6 widths, story frames, full page, motion filmstrips)
npm run copy         # regenerates docs/COPY.md and docs/COPY-live.md, the exact copy including illustration strings
npm run og           # re-renders public/og.png (the link preview LinkedIn shows) from src/og.html
npm run verify       # check + a11y + stage + perf
```

## Deploy it

**Do not deploy without the founder's explicit go-ahead.** V2 is not deployed.

`https://proportion.systems` already serves **V1** (`2baebcc`). A separate release session put it live on
2026-09-28. That session's repository, `~/Projects/afo-public-release-v1`, builds, ships, smokes and rolls back
releases of this repository. Reuse it for V2 rather than setting up new hosting:

```sh
cd ~/Projects/afo-public-release-v1
node tools/make-release.mjs --repo ~/Projects/afo-public-website-v1 --commit <V2 commit> [--config founder.json]
sh tools/deploy.sh releases/<id>
node tools/public-smoke.mjs --expect-release <id> --pin <edge IPv4>   # this workstation cannot resolve the domain
```

- `make-release` builds from `git archive` of the commit and runs this repo's `tools/check.mjs`. It then
  fingerprints every `.css` and `.js` file, but rewrites references only in HTML and CSS.
- That is why the build bundles `src/js/*.js` into a single `dist/js/site.js`. Separate modules importing each
  other would 404 after fingerprinting and silently turn the page static. `npm run check` fails if a shipped script
  imports another. Verified by replaying the fingerprint step on a copy of `dist/`.
- `--config` stamps founder details (LinkedIn, email, photo path, `showcase.state`) without committing them.
- `public-smoke`'s "primary CTA reaches its section" check assumes an in-page link. Once `showcase.state` is
  `live`, the first button is the external "Try AFO live", so that check needs adjusting in the release repository.
- Its full-page screenshot shows the story as a long light column, because a full-page capture never scrolls.
  For visual evidence, use `docs/screenshots/page-*.jpg` from `npm run screenshots`.
- Rollback is one command in the release repository (`switch-release rollback`).

Any other static host also works (build `npm run build`, serve `dist/` with gzip or brotli), but the domain is
already wired to the path above.

## Repository layout

```
site.config.json          the only file to edit for CTAs, founder and contact details
src/index.html            the page, with {{SLOT}} markers filled by build.mjs
src/styles/00-08*.css     tokens, base, glass, nav, story layout, product UI, stage frames, sections, motion
src/js/main.js            entry: dates, story, scroll, reveals (progressive enhancement only); bundled to dist/js/site.js
src/js/story.js           the stage's nine frames: content per frame, choreography, fact flights (Web Animations API)
src/js/scroll.js          one requestAnimationFrame reader: backdrop, active frame, dock progress, nav tone, drawings
src/fonts/                Inter (variable, optical sizes) and a 5 KB JetBrains Mono subset, both SIL OFL (LICENSE.md)
src/assets/               real Showcase workspace capture (story frame 9 and final panel backdrop, lazy only), the Showcase's sample photo
src/og.html               source of the 1200x630 link preview
tools/                    serve, check, a11y, stage-check, perf, screenshots, extract-copy, og
docs/                     VISUAL_REFERENCE_SYNTHESIS, MOTION_STORYBOARD, DESIGN_RATIONALE, CLAIMS_NOT_USED,
                          RED_TEAM, QA_REPORT, COPY(-live), references/ (internal only), screenshots/
```

## Editing rules

- Every product claim must be something the Showcase shows. Illustration strings are the Showcase's own wording
  (`docs/COPY.md` lists them all). Extend `docs/CLAIMS_NOT_USED.md` rather than adding a claim you cannot show.
- Story frames are declared in `src/js/story.js` (`ADD`, `REMOVE`, `SWAPS`, `SEQUENCES`), and where each surface
  sits in each frame is in `src/styles/06-stage.css`. Change both together, then run `npm run stage` and
  `npm run screenshots`.
- Animate only `translate`, `scale` and `opacity`, plus bounded `clip-path`. The Case card's growing list must stay
  the last section in the card, which keeps layout shift at 0 (`npm run perf` reports it).
- `docs/references/` holds third-party screenshots for internal design reference. Never copy them into `dist/`.
