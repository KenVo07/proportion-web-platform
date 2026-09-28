# Visual design rationale (V2)

V1 was a sound, truthful baseline: calm, accurate and a little static. V2 keeps its product truth and rebuilds the
craft around one idea: **the product is the visual, and it moves only to explain what AFO does.** The principles
come from the live reference study in `VISUAL_REFERENCE_SYNTHESIS.md`, and the choreography is specified in
`MOTION_STORYBOARD.md`.

## The first ten seconds

A cold visitor, typically a tradie on a phone, sees four things:

1. The category and audience in one headline: "An AI front office for service businesses."
2. The founder's own positioning as the muted second line: "Built around your services, rules and workflows."
3. What AFO does, in one sentence that names the trades.
4. A real product composition assembling itself: a customer's words becoming a fact on a Case, with owner control
   (**AI handling · Take over**) floating over it.

A byline with the founder's name sits under the call to action.

## Daylight to read, graphite to watch

| Surface | Token | Use |
|---|---|---|
| Warm canvas | `#f7f8f5` | reading sections; the AFO Showcase's own canvas, so the click-through feels like one product |
| Ink | `#0f172a` / `#334155` / `#56657a` | text, AA contrast on canvas |
| Graphite stage | `#0b1114` with a lit floor | the product story, the Showcase section, the final panel |
| Teal accent | `#0b665f`, bright `#6fd6c8` on graphite | one action colour; bright only for labels on dark |
| States | ok `#047857`, warn `#b45309`, human `#4338ca` | the Showcase's own state colours (booked, waiting, you're handling) |

The page runs light, dark, light, dark, light, dark. The hero dims into the stage as you scroll, instead of cutting
to a new section, and the light rules section slides back over the stage like a sheet. Nothing is dark just to
look premium: the dark sections are the ones where the product is on stage.

## Type

**Inter 4 variable** (self-hosted, Latin, 73 KB) with optical sizing:

- display cuts on headlines, text cuts on 11 px product labels
- tabular figures for prices and times
- a metric-matched fallback so a late font swap doesn't move text

A **5 KB JetBrains Mono subset** carries the product's small uppercase labels ("WHAT AFO DID", "AI ASSISTANT") and
the quote block, the same register the Showcase uses. No third font. Headlines use a single weight with tight
tracking. The two-tone headline (ink plus muted continuation) is used twice, in the hero and the rules section,
not everywhere.

## Liquid glass, selectively

Glass is used on exactly five surfaces, all of them controls that float over live content:

1. the floating nav capsule, which switches tint with the section beneath it
2. the handling capsule, "AI handling · Take over", which docks into the business view in the owner chapter
3. the story's chapter dock, which is real navigation
4. the owner decision sheet over the Inbox
5. the final call-to-action panel over the real Showcase workspace

The recipe is Linear's:

- a backdrop blur (12 to 22 px) with saturation
- a top-lit structural gradient
- a 1 px specular edge drawn from a conic gradient whose light angle drifts a few degrees per screen as you scroll
- a contrast shadow
- no refraction, which would make product text harder to read

Glass never sits on reading text or dense product content. Under **reduced transparency** it becomes solid. Under
**increased contrast** it becomes solid with a hard outline and no specular edge. Browsers without backdrop blur
get a near-opaque surface. All three are verified in `npm run a11y`.

## The product is the proof

Every surface on the stage is rebuilt in HTML from the AFO Showcase business view, and every string is the
Showcase's:

- **Chat:** the Riverbend chat and its "AI ASSISTANT" labels.
- **Case:** the Job view's "What AFO knows — and how" with "Customer said" chips, and "AFO still needs" with the
  profile's own fact labels. Also "Appointment", "Quote", "Paused — safety first" and "Nothing outstanding right
  now."
- **Calendar:** staff lanes, "Existing jobs (sample)", "Times AFO offered", "Booked by AFO".
- **Business view:** the Inbox rows, the Activity feed, and the owner decision card with its exact "Price assumes"
  text and evidence line.
- **Handling bar:** "AI handling" and "You're handling".

The customer's photo is the Showcase's own synthetic sample photo. The final panel's backdrop is a real
screenshot of the Showcase workspace, with a fictional business. The stage is permanently captioned "Illustration
· Riverbend Plumbing is a fictional demo business".

HTML rebuilds rather than screenshots let the story recompose, stay sharp at any size, cost a few kilobytes, and
change wording in one place when the product changes.

## Motion that explains

Three scroll-driven sequences carry the story; three smaller moments follow it.

- **Contact becomes structure:** phrases lift out of the customer's words and land on the Case. Each answered
  need disappears.
- **Case becomes action:** the calendar checks availability. Offered, chosen, requested and booked are four
  visibly different slot states. The pause before "booked" is the truth constraint made visible.
- **Owner control:** the scene recomposes into the business side, the quote waits in a glass sheet, approval
  sends exactly that quote, and takeover silences AFO.
- **After the story:** rule receipts stamp in, the channel paths draw into one Case, and the final panel's light
  sweeps once.

The motion system is one spring family (a sampled damped spring in CSS `linear()`) plus two cubic curves, with
fixed durations. Only transform, opacity and bounded clip are animated. The one growing list is the last section of
its card, so layout shift is 0. Reading never waits for animation.

## Mobile is its own edit

Below 960 px:

- The stage pins under the nav and the copy passes through a reading band beneath it.
- One surface is in focus at a time, and the owner decision becomes a bottom sheet.
- The dock is the only floating layer.
- The first screen is headline, lead, button and byline, with the stage peeking below to invite the scroll.

It was checked at 320, 390 and 768, as well as 1024, 1440 and 1920.

## What was deliberately not done

- No orbs, waveforms, robots, particles or glowing gradients.
- No logo walls, testimonials or metrics.
- No stock photography.
- No per-trade deep links: the Showcase opens on its own picker.
- No word-by-word scroll text.
- No animation library: native sticky positioning, CSS transitions and the Web Animations API cover it.
