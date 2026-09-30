# QA report (V2)

## 0. Final release candidate (2026-09-30, nine frames)

**Candidate source:** `a51c28dc1e008f6bfa7cf96fd760513d875fd669` (tree `e5f24ec99c4cbce4c211d38b5367e27ce654de3b`)
on `v2/visual-convergence`. Later commits on the branch change documentation and screenshots only.
**Build fingerprints** (sha256 over the sorted per-file sha256 list of `dist/`, first 16 hex digits): pending
`851320b37b5a8041`, live `c4baf65c1ea02626`. The build is deterministic (two builds, same fingerprint), built from
`git archive` of the commit exactly as the release builder does.

Run in a cloud container (4 cores) with headless Chromium through Playwright 1.62 (software compositing, no GPU)
and axe-core 4.13. Configuration: `site.config.json` as committed (Showcase pending, phone line pending, no
contact route, no founder photo), plus `SHOWCASE_STATE=live` for the live-state runs, plus a scratch config with a
placeholder LinkedIn and email to exercise the contact-configured ladder (never committed).

| Area | Result |
|---|---|
| Story | Nine frames: 0 hero · 1 enquiry · 2 Case · 3 offer · 4 booked · 5 quote · 6 approve · 7 takeover · 8 the real Showcase capture |
| `npm run check` | Pass, pending and live (also with a contact route configured, both states) |
| `npm run a11y` | Pass, pending and live: 0 axe violations (WCAG 2.1 A/AA + best practice) at 390 and 1440, on the page and on story steps 1, 3, 5, 7 and 8 as seen |
| `npm run stage` | Pass: no product-UI element escapes its card in any of the 9 frames at 1440, 1024, 390 and 320 (pending and live) |
| `npm run perf` | Desktop slow frames 0.4 / 0.1 / 0.3 % (baseline 0.2 / 0.3 / 0.3 %), phone 0.6 / 0.6 / 0.2 % (baseline 0.3 / 0.4 / 0.5 %), p99 16.8 ms everywhere, CLS 0. Controlled comparison in §0.2 |
| Layout shift | 0 on desktop and phone, through the whole story, in every run |
| First visit | ≈ 112 KB as served with gzip (baseline ≈ 109 KB). The real capture (114 KB) is never fetched on a first visit |
| Showcase CTA | Pending: no Showcase host anywhere in the page, no "Try AFO live", a truthful "coming online" status. Live: five links (nav, hero, section, final panel, footer), each exactly `https://demo.proportion.systems/`, new tab, `rel="noopener"` |
| Public safety | Shipped HTML, script and styles contain no internal IDs, local paths, dev hosts, preview routes, credentials or debug wording (`npm run check`, with 13 negative tests) |

### 0.1 The slow-frame regression: cause and fix

**Reproduced on the checkpoint bytes.** `npm run perf`, desktop 1440: old baseline `bf6bd69` 0.2 / 0.3 / 0.3 %
slow frames (> 20 ms), p99 16.8 ms; checkpoint `1d57a86` 1.0 %, p99 33.2 ms. Phone unchanged (0.4 %).

**Localized.** Per story frame, three passes each: the checkpoint's extra slow frames were all in frames 3–6
(booking and owner): 7–17 % slow there, against ≤ 0.5 % in the baseline. Every other frame and section was
unchanged.

**Measured, not guessed.** A Chrome trace of the frames 3 → 7 scroll shows the main thread unchanged at about
2.5 ms per frame (script, style, layout, paint and the capture decode are not the cost). The extra time is in the
display compositor, which in this environment is Chromium's software renderer: `DrawFrame` averaged 14.7 ms per
frame on the baseline and 20.2 ms on the checkpoint.

**Bisected** with CSS overrides injected into the checkpoint build, scrolling frames 3 → 7 at the same 9 px per
frame (instant scrolling, 2–6 runs each):

| Variant | Slow frames, frames 3→7 |
|---|---|
| checkpoint as built | 12–19 % |
| no backdrop blur anywhere | 0.1 % |
| no backdrop blur on the nav only | 0.0 % |
| no card shadows | 1.9 % |
| capture hidden | 10.3 % (not the cause) |
| backdrop grain removed | 12.1 % (not the cause) |
| stage clip's top pad 64 → 24 px | 6.4 % |
| … and the desktop decision sheet solid instead of blurred | **0.7 %** (baseline, same window: 0.4 %) |
| … and the stage 20 px lower | 0.8 % (no further gain, so the founder's larger stage is kept) |

Two things made the compositor redo expensive backdrop blurs on every frame while the page scrolls:

1. **The stage clip reached up under the fixed glass nav.** The clip is padded so card shadows are not cut off;
   its 64 px top pad (which the founder pass's taller, higher stage moved up to 40 px from the top of the window)
   put the animating, masked stage beneath the nav's backdrop blur. Shadows fall downwards, so the top pad is now
   24 px and the clip starts at 80 px, below the nav (68 px).
2. **The desktop decision sheet blurred a paper column.** The founder pass placed the sheet exactly over the
   business view's right column, which is white paper: the blur showed nothing, but it was recomputed every frame.
   On desktop the sheet keeps the glass sheen, edge and shadow on a solid white surface (increased-contrast and
   reduced-transparency modes are still handled by the glass module). Phones keep the blur, where the sheet rises
   over the Inbox rows.

No product surface was made smaller, no stage size changed, and no threshold moved (`tools/perf.mjs` has no
thresholds; "slow" is still > 20 ms). Visual result: frames 3–6 look the same as the founder's pass.

**After, on the candidate** (`npm run perf`, three runs, the same conditions as the "before" runs):

| Build | Desktop slow frames | Desktop p99 | Phone (4× CPU) slow frames | Phone p99 | CLS | Longest task, desktop / phone |
|---|---|---|---|---|---|---|
| Baseline `bf6bd69` | 0.2 / 0.3 / 0.3 % | 16.8 ms | 0.3 / 0.4 / 0.5 % | 16.8 ms | 0 | 55–225 ms / 226–259 ms |
| Checkpoint `1d57a86` | 1.0 % | 33.2 ms | 0.4 % | 16.8 ms | 0 | 67 ms / 232 ms |
| **Candidate `a51c28d`** | **0.4 / 0.1 / 0.3 %** | **16.8 ms** | **0.6 / 0.6 / 0.2 %** | **16.8 ms** | **0** | 89–158 ms / 238–270 ms |

`tools/perf.mjs` scrolls with `scrollBy` while the page sets `scroll-behavior: smooth`, so each run covers a
different number of frames (desktop runs here ranged from 24 k to 60 k frames). Percentages from it are
comparable; raw counts are not. The controlled comparison below removes that noise.

**Controlled comparison:** in progress at the time of this commit; results follow in the next docs commit.

The long tasks are the page's start-up (the phone's are under a 4× CPU throttle, as in the baseline).

### 0.2 First-visit weight and the lazy capture

| | Candidate | Baseline `bf6bd69` |
|---|---|---|
| HTML (gzip) | 9.4 KB | 8.6 KB |
| CSS (gzip) | 17.3 KB | 14.1 KB |
| JS (gzip) | 7.2 KB | 7.0 KB |
| Fonts (WOFF2, 2 files) | 76.2 KB | 76.2 KB |
| Eager images | sample photo 2.9 KB | sample photo 2.9 KB |
| **First visit** | **≈ 112 KB** | **≈ 109 KB** |
| Uncompressed first visit (`perf.mjs`, local server without gzip) | 205.2 KB | 189.6 KB |
| Real Workspace capture (lazy) | 113.7 KB WebP, 1440 × 900 | 65.6 KB WebP, 1200 × 750 (final panel only) |

- First visit: 6 requests (page, 2 fonts, styles, script, sample photo). `perf.mjs` reports
  `captureOnFirstVisit: false` in all 6 runs. A request probe shows the capture is first fetched when the story
  reaches frame 5 (desktop at 3,480 px of 11,805; phone at 1,680 px of 10,453), three frames before it is shown.
  The final panel then reuses the cached file.
- The byte budget in `tools/check.mjs` is unchanged by this pass. The founder pass had raised `assets` (90 → 140 KB)
  and `total` (330 → 380 KB) for the larger capture. That is justified by the product: frame 9 now shows the
  capture cropped to its business view and Activity (990 source pixels wide) at up to about 0.9×, which a
  1200-pixel capture could only provide by upscaling. It is lazy, so first visits do not pay for it.

### 0.3 Accessibility

- axe-core, WCAG 2.1 A/AA + best practice, at 390 and 1440, pending and live: 0 violations on the page and on
  story steps 1, 3, 5, 7 and 8 as a visitor sees them. axe leaves colour contrast "for manual review" on text over
  glass and the graphite gradient (nav, story steps), as in the earlier pass; those were read in the full-size
  screenshots and are clearly legible (white or near-white on graphite, ink on light glass).
- Keyboard: every visible link reached by Tab with a visible focus outline (pending 9 stops on phone, 13 on
  desktop; live 11 and 15). **Skip link:** the first Tab stop, visible when focused, targeting `#main` (new check).
- Headings: one h1, no level jumps (`npm run check`). Meaningful link names: CTAs are "Try AFO live", "Talk to
  Khoa", "See how it works", "About the Live Showcase". External links open in a new tab, say so to screen readers
  ("opens in a new tab") and carry `rel="noopener"`.
- Reduced motion: 0 running animations, stage surfaces only fade, no fact flights. Reduced transparency and
  increased contrast: all 5 glass surfaces lose their blur. JavaScript off: nothing hidden, the story reads as text.
- The stage is `aria-hidden`; each story step describes its frame in text, and the hero's screen-reader note now
  says the story ends on a capture of the real Showcase.

### 0.4 Responsive review

Full-size screenshots were inspected, not contact sheets:

- first screens at 320, 390, 768, 1024, 1280, 1440, 1600 and 1920 (0 px horizontal overflow at every width)
- all nine frames at 1280, 1440, 1600, 1920 and 390; at the sanity widths, frame 9 at 320, frames 6 and 9 at 768,
  and frames 4, 6 and 9 at 1024
- the whole page as consecutive screens at 1280, 1440, 1600, 1920 and 390, in both Showcase states

Corrections made from that review (desktop and phone unless stated):

| Found | Fix |
|---|---|
| Frame 9's capture was shown whole: about 0.55× on desktop (body text ≈ 7 px) and 0.46× on phones (≈ 6 px), cropped mid-sentence on phones | Cropped to the part that carries the story: the business view and its Activity on desktop (≈ 0.8× at 1440, ≈ 0.9× at 1920), the business column at its natural height on phones |
| Frame 9 ran into the chapter dock at 1280 × 800 | Raised within the stage |
| Frame 4: the Case log hid "Calendar confirmed the booking", the line the step is about (the founder pass cut the log window to two rows; the script still assumed three) | The script reads the window's height |
| Frames 3–4: the calendar's last hour label was cut in half | Room inside the clipping box |
| Frame 6 (phone): the toast covered the selected Inbox row | Toast removed from the re-created story (desktop never showed it; the sheet's result line says the same; the real capture shows it) |
| Frame 6 (desktop): faint text from the Activity showed through the now solid sheet at 97 % | Opaque |

Checked and left as designed: the business view overlapping the customer column's right edge in the owner frames
(the founder pass's layering, two thirds business view); step copy passing under the pinned stage on phones.

### 0.5 Motion review

Filmstrips of every chapter transition as it plays are in `docs/screenshots/motion-*.jpg` (desktop 1440, plus
the owner chapter and the takeover-to-capture move on a 390 phone). Reviewed for reflow, snapping, overlap, tiny
intermediate surfaces and phone docking leakage:

- enquiry → facts → Case: the three chips lift from the customer's words and land on their Case rows; rows open
  without shifting text above them
- booking chain: offered → chosen → requested → "Booked by AFO", with the Case log advancing to "Calendar confirmed
  the booking"
- customer → owner: the Case and calendar leave, the business view rises, the capsule docks into it as its
  handling bar
- quote → approval: Approve & send depresses, "Sent to customer", the result line, the quote arrives in the chat
- takeover: the sheet slides away, the handling bar turns to "You're handling · Hand back to AFO", the team message
  arrives
- takeover → real capture: the re-created surfaces fade as the framed capture rises; the "Re-created" caption steps
  aside because the capture carries its own label

Reduced motion keeps every frame and only fades. The filmstrip tool previously scrolled the sticky stage "into
view" before each capture, which could record the wrong frame; it now clips the viewport instead.

### 0.6 Product-truth reconciliation

Every material claim on the page was re-read against the audited copy (§2 below) and the only Product evidence
available to this pass, the real capture. Kept, because the capture or the audit supports them: the four channels
and one Inbox, times offered online (web chat and booking page), "isn't booked until the calendar confirms", quotes
from the price list waiting for approval, "the exact quote you saw" (web chat), take over / hand back, "AFO says
it's an AI assistant". Removed or reworded: see `CLAIMS_NOT_USED.md`, "Final V2 pass" (an invented button and
masked number, three strings not in the capture, a "suggested scenario" feature, "all of it comes from the real
product", and the pending "Try the real product." imperative).

**Client Workspace V1** is the stated Product authority, but its source and evidence are not in this repository
(any branch) and were not reachable from this session. The capture and the re-created labels agree with each
other; whether both match the final Workspace V1 needs the founder's confirmation.

### 0.7 The real Workspace capture

| | |
|---|---|
| File | `src/assets/showcase-workspace.webp`, 1440 × 900, 113,678 bytes, WebP |
| sha256 | `635dfd0a6d9a90d30fca66c26519e451a824a48b3aa2d5c51f9cfdcecbb4990a` |
| Added | founder pass checkpoint `1d57a86` (replacing a 1200 × 750 capture of the same moment) |
| Shows | the AFO Showcase ("Live Showcase · Customer + Business") for the fictional Riverbend Plumbing: the customer's chat with the delivered quote and the owner's message, "You're handling · Hand back to AFO", the Owner decision tab with $345.00 AUD "Sent to customer", and the Activity from "Booked" to "You replied to the customer" |
| Used | story frame 9 (cropped per layout, JS-loaded from frame 5) and the final panel's backdrop (native lazy) |
| Label | "AFO Showcase workspace · fictional demo business" (frame 9), "Behind this panel: the real AFO Showcase workspace, with a fictional business." (final panel) |

### 0.8 Showcase state

| | Pending (committed) | Live (`showcase.state: "live"`) |
|---|---|---|
| Nav | See how it works (Talk to Khoa with a contact route) | Try AFO live ↗ |
| Hero | See how it works (+ Talk to Khoa); "The Live Showcase is coming online." | Try AFO live ↗ · See how it works |
| Showcase section | "Try the real product, soon."; status "Live demo coming online · Final validation in progress."; no action | "Try the real product." · "Open now" · Try AFO live ↗ (and its host) |
| Final panel | See how it works (Talk to Khoa first with a contact route) | Try AFO live ↗ (+ Talk to Khoa) |
| Links to the Showcase | none (the host does not appear in the page) | 5, all exactly `showcase.url`, new tab, `noopener` |

The founder's local interactive preview is never referenced: the build refuses local, private-network, IPv6-literal
and preview/dev/founder Showcase URLs, and `npm run check` fails on dev hosts, preview routes and "founder/
interactive preview" wording in any shipped file.

### 0.9 Public safety (shipped output)

`npm run check` scans `index.html`, the script and the styles for internal defect IDs, engineering state labels,
local paths, development hosts, private-network URLs, preview/dev routes, founder-preview wording, credentials
(API keys, bearer tokens) and debug/staging/TODO wording in the visible text, and it fails on any. Thirteen
negative tests (each leak injected into a built page) all fail as they should; both clean states pass. Note: this
covers the site output only. The repository itself is public on GitHub and its documentation and history
include internal engineering material.

### 0.10 Known limitations

- Workspace V1 reconciliation needs the founder (§0.6).
- No contact route is committed. With none configured, the only action on the page is "See how it works"; configure
  LinkedIn or email at release (`--config`) before outreach. Verified in a scratch build: "Talk to Khoa" then leads
  in the nav and final panel, and check passes in both states.
- No founder photo.
- Frame timing was measured with software compositing in a cloud container; real devices with GPU compositing
  should be at least as smooth. No real-device, Safari or Firefox testing (see §6).
- The re-created story computes its dates for the coming week; the real capture shows the date it was taken
  ("Mon, 28 Sept"). The step says it is a capture "at the same point", not the same day.

---

# Earlier pass (2026-09-29, eight-frame baseline)

Run on 2026-09-29 against the built `dist/` (default configuration: Showcase pending, no contact configured)
using headless Chromium via Playwright, axe-core 4.13, and Lighthouse 12.8.

## 1. Design-director pass

The brief called for one substantial inspection and one correction pass.

The inspection covered:

- first screens at 320, 390, 768, 1024, 1280, 1440 and 1920
- all eight story frames at 1440 and 390, plus 320 and 768
- the full page as consecutive screens
- frame-by-frame captures of the hero intro, the fact flights, the booking chain and the approval

| Criterion | Finding | Correction |
|---|---|---|
| First 5 seconds | Clear category, audience, action and founder byline. But the eyebrow repeated the headline, the Case card had a blank band from collapsed rows, the stage "floor" glow banded into rings at 1920, and on phones there was a dead gap before the stage. | Eyebrow removed. Rows now collapse to 0 px. Glow only on the graphite stage. Phone stage pulled up under the byline. |
| Composition | The hero chat's lower half was empty, and the handling capsule floated detached below the cards. | The Case overlaps the empty area, and the capsule sits across the chat and Case. |
| Product specificity | Strong, but the truth audit found non-Showcase strings (§2). | All replaced with the Showcase's own labels and states. |
| Originality | The product-as-story with the fact flight is specific to AFO. No reference pattern was copied (see VISUAL_REFERENCE_SYNTHESIS). | None needed. |
| Scroll rhythm | Light, dark, light, dark, light, dark works. The hard edge from the story into the rules section felt abrupt. | The rules section now slides over the story like a sheet (rounded top, shadow). |
| Motion continuity | Frames recompose without cuts. Fast scrolling settles cleanly, and backwards moves settle instantly. | None needed. |
| Glass restraint | Five surfaces, all floating controls. Contrast on dark nav glass could dip over white cards. | Dark nav glass made more opaque (0.74). |
| Mobile | One surface in focus. The owner decision toast was off-centre, the caption was clipped, and step headings tucked under the stage before they could be read. | Toast centring fixed. Short caption on phones. Frames advance when a heading is a third of the way into the reading band. |
| CTA | One primary action per screen. With no contact configured and the Showcase pending, the only action is "See how it works". | Left as is: it resolves as soon as a contact route is configured (README). |
| Cold-outreach credibility | Founder byline in the hero and a founder section. Weaker without a photo or contact route. | See RED_TEAM.md. |

Defects found and fixed while building, before the pass:

- The phone stage rendered at 0 px height.
- The graphite backdrop overhung the next section by one screen, hiding the rules headline.
- The stage's shadow padding caused sideways overflow on phones.
- A Case card reorder let long labels push values and chips out of the card.
- Inactive story steps were dimmed below AA contrast.
- Opening and closing Case rows caused 0.005 layout shift.

## 2. Independent truth audit

A separate read-only agent checked every visible and illustration string against the Showcase source, the
cross-surface final package, the live provider hardening reports, and the golden demo gate. It reported 4
blockers, 12 fixes and 6 notes. All were resolved:

| Finding | Severity | Resolution |
|---|---|---|
| Link preview showed a phone call ending in a confirmed booking | Blocker | `og.png` rebuilt from the web-chat story |
| "AFO still needs: Name, Address" is not a Showcase requirement (name/address is prompt-only, LPH-14) | Blocker | The profile's real still-needs labels. The customer gives name, fictional number and address. The Inbox keeps "New customer", as the chat path does. |
| "Everything shown … If it isn't there, it isn't claimed here" was untrue with HVAC and invented rows | Blocker | Replaced with "The product views on this page are re-created from the Showcase, with its fictional businesses." |
| Live-state phone line bullet while LPH-13/14 are open | Blocker (live state) | Stays behind `showcase.phoneLine` (default `pending`). The build warns when it is live, and the README says when to switch. |
| "offers available times" implied voice booking | Fix | "offers times online". Story step 3 is scoped to web chat and the booking page. |
| Service areas implied enforced | Fix | Removed from the setup list. "which quotes need your approval". |
| "AFO inferred" / "Staff confirmed" facts | Fix | Removed. All illustrated facts are "Customer said". The rule receipt shows a real fact row and "(customer doesn't know)". |
| Safety line broader than the product | Fix | "safety guidance comes first and price and booking questions wait" |
| Checks footnote named a check the Showcase cannot observe | Fix | "Conversations are kept as evidence and checked afterwards, for example 'Booked only the time the customer chose'. The review says what it couldn't verify." |
| Exact-quote delivery true only for web chat | Fix | Scoped to web chat, plus "If the job changes first, nothing is sent." |
| Case merge implied | Fix | "Whichever of these a customer uses …". The "one per enquiry" label was removed. |
| Takeover implied on calls | Fix | "Take over the chat" |
| Fixed price needs a photo | Fix | Photo request, "Photo sent" with the Showcase's sample photo, "Evidence received (1 item)", and the evidence line on the decision card |
| "Price assumes" dropped "and any water-damage repairs" | Fix | Restored verbatim |
| Per-trade deep links land on Plumbing | Fix | Removed. There is one link to the Showcase. |
| "The model never invents one." | Note | "A price that isn't on it never reaches the customer." |
| Non-Showcase job names, row stage, placeholder text, feed mix-ups | Note | "Hot water fault", "Broken double power point", "Standard clean this week", row "Booked", no "Not known yet", and Activity and Inbox strings kept apart |

## 3. Measurements

| Check | Result |
|---|---|
| Lighthouse, mobile (simulated slow 4G, local server without compression) | Performance 98 · Accessibility 100 · Best practices 100 · SEO 100 · FCP 1.7 s · LCP 2.1 s · TBT 0 ms · CLS 0 |
| Lighthouse, desktop | 100 · 100 · 100 · 100 · FCP 0.4 s · LCP 0.5 s · TBT 0 ms · CLS 0 |
| Frame timing, scrolling the whole page, desktop 1440 | p50 16.7 ms · p95 16.7 ms · p99 16.8 ms · 0.5% of frames over 20 ms |
| Frame timing, phone 390 at 4x CPU throttle | p50 16.7 ms · p95 16.7 ms · p99 16.8 ms · 0.1% of frames over 20 ms |
| Cumulative layout shift during the whole story | 0 (desktop and phone) |
| First-visit transfer | ≈109 KB: 30 KB gzipped HTML/CSS/JS, 76 KB fonts, 3 KB sample photo. The 64 KB final-panel image is lazy. |
| axe-core, WCAG 2.1 A/AA | 0 violations at 390 and 1440, for the page and for story frames 1, 3, 5 and 7 as seen |
| Keyboard | Every visible link reached by Tab, each with a visible focus outline. The dock is unfocusable while hidden. |
| Reduced motion | 0 running animations. Stage surfaces only fade. No flights. |
| Reduced transparency, increased contrast | All 5 glass surfaces drop their blur and become solid. Increased contrast adds outlines. |
| JavaScript off | Nothing hidden. Steps read dark on light. The illustration shows the hero frame. |
| Product UI containment | No element escapes its card, in any of 8 frames, at 320, 390, 1024 and 1440 |
| Horizontal overflow | 0 px at 320, 390, 768, 1024, 1440 and 1920 |
| Static checks | No template leftovers, banned phrases, rejected claim wording, dangling anchors, heading jumps, third-party hosts or inline handlers. Within the size budget. |

Headless Chromium composites in software. Real GPU devices should be at least as smooth. An early software run
dropped frames only where the stage mask, in-stage blur and nav blur stacked. The mask now applies only in the
frames that crop a surface, and in-stage blur is 12 px.

## 4. Release-path compatibility

`proportion.systems` already serves V1 through `~/Projects/afo-public-release-v1`. That repository was read only,
not modified, and nothing was deployed. Its `make-release.mjs` fingerprints every `.css` and `.js` file and
rewrites references only in HTML and CSS.

Replaying exactly that step on a copy of V2's first build showed `404 /js/dates.js`, `/js/story.js`,
`/js/scroll.js` and `/js/reveal.js`. The page fell back to static after 3 seconds, and the release gates would not
have caught it: they check references only in HTML.

Fix: the build now bundles the modules into one `js/site.js`, and `npm run check` fails if a shipped script imports
another. Replayed again: no failed requests, and the stage runs with motion.

V2's output also passes all six of the release builder's refusal patterns:

- local addresses
- placeholder domains
- local paths
- fixture markers
- unfilled slots
- draft markers

The release smoke's checks are structural and V2 satisfies them, with two caveats noted in the README: the
primary-CTA check once the Showcase is live, and the full-page screenshot.

## 5. Browser support and fallbacks

| Feature | Fallback |
|---|---|
| Container query units (Safari 16+, Firefox 110+) | Without them the illustration is hidden and the text story remains. |
| `backdrop-filter` | A near-opaque surface |
| `linear()` spring easing (Safari 17.2+) | A cubic-bezier ease-out |
| `@property` (animatable light angle) | The light angle steps instead of sweeping. |
| `:has()`, which scopes the stage fade | A hard crop at the padded stage edge |
| `overflow: clip` (Safari 16+) | Older iOS may allow a small sideways scroll. |
| ES module script | One bundled module file. If it never starts, `.js` is removed after 3 s and the page renders statically. |

## 6. Not tested

- Real devices, including iOS Safari and Android Chrome on hardware.
- Firefox and Safari engines. All runs used Chromium.
- Screen readers by ear. Structure, names and landmarks were checked with axe and by reading the DOM.
- Production hosting: compression, caching and HTTPS are the host's. The Lighthouse "text compression" and
  bfcache notes come from the local development server.
