# QA report (V2)

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

## 4. Browser support and fallbacks

| Feature | Fallback |
|---|---|
| Container query units (Safari 16+, Firefox 110+) | Without them the illustration is hidden and the text story remains. |
| `backdrop-filter` | A near-opaque surface |
| `linear()` spring easing (Safari 17.2+) | A cubic-bezier ease-out |
| `@property` (animatable light angle) | The light angle steps instead of sweeping. |
| `:has()`, which scopes the stage fade | A hard crop at the padded stage edge |
| `overflow: clip` (Safari 16+) | Older iOS may allow a small sideways scroll. |
| ES modules | If the scripts never start, `.js` is removed after 3 s and the page renders statically. |

## 5. Not tested

- Real devices, including iOS Safari and Android Chrome on hardware.
- Firefox and Safari engines. All runs used Chromium.
- Screen readers by ear. Structure, names and landmarks were checked with axe and by reading the DOM.
- Production hosting: compression, caching and HTTPS are the host's. The Lighthouse "text compression" and
  bfcache notes come from the local development server.
