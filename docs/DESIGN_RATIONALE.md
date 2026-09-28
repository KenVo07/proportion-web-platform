# Visual design rationale

## What the page has to do

A plumber who receives an unsolicited LinkedIn message and clicks through has about ten seconds. The
page must answer, in order: what this is, whether it is for a business like theirs, whether it is real,
whether it is more than a chatbot, what they can try, and whether the person behind it is legitimate.
Every decision below serves that order.

## Continuity with the product

The page uses the AFO Showcase's own visual system rather than a separate "marketing" look, so a visitor
who clicks **Try AFO live** lands somewhere that feels like the same product:

- warm off-white canvas (`#f7f8f5`), white surfaces, thin slate lines
- slate ink (`#0f172a` / `#334155` / `#56657a`)
- one restrained teal action colour (`#0b665f`), amber for "waiting for you", green for confirmed, indigo for "a person is handling"
- system sans-serif stack, tight-tracked headings, monospace only for the product's own small labels
- 12 px radius for controls, 18 px for product frames

The only additions are a larger typographic scale, more generous section spacing, and a single dark
section for rhythm. No gradients, no illustration, no stock imagery, no glass effects, no particles.

## The product is the proof

Every visual on the page is a rebuilt fragment of the real Showcase business view: the Inbox row, the
"AI handling / You're handling" bar, the "What AFO did" timeline, the source-of-fact chips, the owner
decision card with **Approve & send / Take over / Reject**. Labels, states and chip names are the
product's, not invented. They use the fictional Riverbend Plumbing demo business, and the hero caption
says so.

Mock-ups are HTML rather than screenshots so they stay crisp at every size, reflow on phones, cost a few
kilobytes, and can be updated when the product's wording changes. They carry `role="img"` with a plain
description so screen readers get the meaning without reading a wall of UI labels.

## Information architecture

1. **Hero:** category and audience in one line, concrete behaviour in the lead, one primary action, the
   business view beside it.
2. **The front office:** three operational realities, no melodrama, then a one-paragraph bridge that
   states the positioning: asks the right questions, works from what the business decided, leaves the
   decisions to the owner.
3. **How it works:** one enquiry followed from first contact to a booked job and a drafted quote. Five
   steps, each paired with the fragment of the product that does that step. This replaces feature cards.
4. **Your business, your rules (dark):** the differentiator. What AFO is given, and the practical rules
   that follow (prices from the price list, nothing called booked until confirmed, exact approved quote,
   provenance on every fact, AI disclosure, evidence and checks).
5. **One front office:** a small flow diagram showing four channels feeding one Case.
6. **Your side of it:** Inbox, owner decision, take over and hand back, beside an Inbox mock-up.
7. **Live Showcase:** what to do and what to expect, including the fictional-business disclosure.
8. **Who's building it:** two short paragraphs, name and city, no portfolio.
9. **Final call to action** and a plain footer.

## Motion

Only reveals: sections and step visuals fade up once as they enter view, and the messages inside a step
appear in conversation order. Nothing loops, nothing moves on hover, nothing hijacks scroll. Reveals
are applied by CSS only when JavaScript is running, and are disabled entirely under
`prefers-reduced-motion`. Opacity and transform are used so there is no layout shift.

## Responsiveness

Mobile first. The hero visual collapses to one column and trims to four messages and four timeline
entries; the takeover bar re-stacks; the flow diagram turns vertical; the section grids go single
column below 900 px. The header keeps only the brand and one action on phones; all sections remain
reachable through the footer link and scrolling. Verified at 320, 390, 768, 1024 and 1440 px with no
horizontal overflow.

## Accessibility

Semantic landmarks and one `h1`; heading levels never skip; a skip link; visible focus outlines on every
link; colour never the only carrier of state (every chip has text); 4.5:1 contrast on body text and
labels; `lang="en-AU"`; reduced-motion respected. axe-core reports no violations at phone and desktop
widths (see `npm run a11y`).

## Performance

No web fonts, no images in the document flow, no third-party requests. The page is about 28 KB of HTML,
22 KB of CSS and under 1 KB of JavaScript before compression. There is nothing to lazy-load and
nothing that can shift layout after first paint.
