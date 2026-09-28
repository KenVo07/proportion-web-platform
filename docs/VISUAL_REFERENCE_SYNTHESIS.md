# Visual reference synthesis (V2)

Studied live on 2026-09-29 in Playwright Chromium: each site loaded at 1440×900 and 390×844 (iPhone user
agent), scrolled one viewport at a time with a pause for scroll-triggered motion, plus computed-style probes
(font families, elements using `backdrop-filter`, sticky elements) and the full text of Linear's Liquid Glass
article. A curated set of frames is in `docs/references/` for internal design reference only. They are
third-party screenshots: never copy them into `dist/` or publish them.

| Site | Fonts in use | Elements with backdrop blur | Sticky elements |
|---|---|---|---|
| linear.app | Inter Variable, Berkeley Mono | 3 (header 20px, two small pills) | 0 |
| linear.app Liquid Glass article | Inter Variable | 5 (header, "volume tint" layers) | 0 |
| attio.com | Inter, Inter Display, JetBrains Mono, Tiempos Text | 9 | 6 |
| raycast.com | Inter, Geist Mono | 21 (nav, product windows, dock) | 0 |
| retellai.com | Untitled Sans, Denton Condensed | 19 | 10 |
| elevenlabs.io | Inter, Waldenburg | 0 | 9 |
| intercom.com | Saans, Serrif, Saans Mono | 0 | 0 |

Even the most glass-heavy site (Raycast) keeps blur on floating chrome and product windows, not on reading
surfaces. Two of the seven use none at all.

---

## Linear: restraint, staging, and the Liquid Glass philosophy

**Observed.** Near-black page, one huge tight-tracked headline, a one-line subline, then the real product as a
wide panel resting on a softly lit "floor" (`linear-01`, `linear-02`). Sections alternate a two-line title with a
right-hand paragraph and a product fragment whose edges fade into the page. The intake section shows a Slack
thread turning into issues on a board (`linear-03`), which is the same idea as AFO's conversation becoming a
Case. Small mono labels ("FIG 0.1") give a technical-manual register. Headlines use a bright lead phrase followed
by a muted continuation.

**Liquid Glass, in Linear's words.** A Gaussian blur base, "a subtle gradient for structure, then a specular
highlight", masked to the shape, "a subtle shadow for added contrast". The light "moves through space as you
interact", so highlights shift as you scroll or tap. Touching an element "lifts it up slightly". A variable blur
intensifies as content approaches the screen edge. When Increase Contrast is on, glass gets solid outlines. They
deliberately did **not** reproduce refraction: "refraction can make dense professional interfaces harder to
read." The stated philosophy is Liquid Glass's "translucency, depth, and physicality" applied "with a ProKit
philosophy: purpose-built, disciplined, and designed for sustained focus" (`linear-glass-01`, `linear-glass-02`).

**Borrow.** Product UI as the hero visual, staged on a lit dark floor. Edge-faded product fragments instead of
whole screens. The two-tone headline, used once or twice, not everywhere. Mono labels for sequence and state.
The full glass recipe: blur, structural gradient, specular edge lit by a light that moves with scroll, contrast
shadow, lift on press, solid outlines under increased contrast, no refraction.

**Do not borrow.** An all-dark page: AFO's visitors read on phones in daylight, and AFO's own product UI is
light. Abstract isometric illustrations. Logo walls: AFO has no customers to show. "Agents" vocabulary.

## Attio: product states as the narrative

**Observed.** Light page on a hairline structural grid. A sticky left index ("Build pipeline", "Convert leads",
...) with an active bar, while the right column shows the product in the state that chapter describes
(`attio-02`). Overlays show a workflow producing an outcome on top of the data it came from: an email composer
over a lead table (`attio-03`). The UI content is specific and realistic. On mobile the index becomes horizontal
tabs pinned under the header (`attio-04`).

**Borrow.** A pinned chapter control that is also real navigation. One product surface changing state beside
short copy, instead of feature cards. Overlays for "AFO drafted this, now you decide". Specific, believable
content in every mock-up.

**Do not borrow.** The blue-violet gradient wash, "never sleeps" copy, customer counts, trademarked concept
names, and the density of stacked feature modules.

## Raycast: physicality and motion as identity

**Observed.** A floating, inset capsule nav in dark glass (`raycast-01`). Product windows sit in a desktop frame
with a glossy dock of raised, key-like buttons that have top highlights and pressed states (`raycast-02`). A
segmented capsule switches categories (`raycast-03`). Many frames were empty at capture time because content
enters on scroll, and some copy brightens word by word as you scroll.

**Borrow.** The floating capsule nav. Tactile controls with a top highlight and a pressed state. A segmented
glass capsule for switching context, here the story chapters. One consistent physical easing, so motion reads as
a single material.

**Do not borrow.** Brand-colour light-streak art, starfields, and dozens of feature showcases.

## Retell: the direct path to trying it

**Observed.** A "Try Our Live Demo" card sits inside the hero (`retell-01`). A whole section is devoted to the
demo with a single action (`retell-02`). The voice category promises latency, realism and turn-taking.

**Borrow.** Demo prominence: once the Showcase is live, "Try AFO live" is in the nav and the hero, and it has its
own section with a single action. For the voice category, show what AFO can back: a call is answered, AFO says
it is an AI assistant, and there is a transcript of "what the caller was heard to say, and what AFO actually said
aloud".

**Do not borrow.** The orb, "#1", metric-heavy testimonials, "from the future", condensed display serif, and the
"we'll call you" form. AFO's demo never calls a number a visitor types.

## ElevenLabs: sensory restraint

**Observed.** Calm near-white surfaces on a faint grid with corner marks, product panels in soft rounded
stages, tabs switching product context, and a small persistent "Voice chat" pill bottom-right
(`elevenlabs-02`). The hero relies on gradient orbs as a voice metaphor (`elevenlabs-01`).

**Borrow.** Restraint: plenty of air, soft rounded product stages, one persistent path to trying the product.

**Do not borrow.** Gradient orbs or any abstract "voice" imagery, and the product-catalogue breadth.

## Intercom: AI and people in one system

**Observed.** The product shot combines an Inbox list, a conversation, a details panel and the customer's
messenger window overlapping it (`intercom-02`). It presents one operating system for AI and human work, not a
chatbot. Mono section labels with small colour squares. Editorial photography and a serif body face
(`intercom-01`).

**Borrow.** Show the customer's side and the business's side together, which is also how the AFO Showcase is
laid out ("Customer" beside "Your business"). Present AFO as the front office, with human takeover and hand-back
as first-class states.

**Do not borrow.** Stock or editorial photography, serif body copy, "highest-performing", resolution-rate
statistics, logo walls, and an email-capture hero form.

---

## Resulting AFO design principles

1. **Product truth is the art direction.** Every visual is a rebuilt AFO Showcase state, with the product's own
   labels. It is permanently marked as an illustration of a fictional demo business. No abstract AI imagery.
2. **Daylight to read, graphite to watch.** Reading sections sit on the warm Showcase canvas (`#f7f8f5`). The
   product story runs on a graphite stage with a softly lit floor. The page moves light, dark, light, dark.
   Nothing is dark just to look premium.
3. **One stage, one story.** The hero's product surfaces are the first frame of the story. As you scroll they
   recompose (conversation, Case, calendar, owner Inbox) rather than being replaced by new pictures.
4. **Glass is for controls that float over live content.** It is used only on the nav, the hero channel
   capsule, the story chapter dock, the owner decision sheet and the final call-to-action panel. It is never
   used on reading text or dense product content. The recipe is blur, structural gradient, a specular edge lit by
   a scroll-driven light, and a contrast shadow. There is no refraction. With reduced transparency it becomes
   solid, and with increased contrast it gets solid outlines.
5. **Motion explains causality.** Every movement answers "what did AFO just do?": a message arrives, a fact lifts
   out of it, the fact lands on the Case, a time is offered, the customer's choice becomes a booking only when the
   calendar confirms. Decorative motion does not ship.
6. **Calm and weighted.** One spring-like easing family, 600 to 850 ms to recompose, 150 to 250 ms for micro
   states. Only transform, opacity and bounded clip. Nothing loops except the small live indicator. Reading never
   waits for animation.
7. **Say the behaviour, then the reason.** Short headlines state what AFO does; the muted line says why it can be
   trusted. No number, customer or result appears that the product cannot show.
8. **One primary action per screen.** "Try AFO live" when the Showcase is open, otherwise "Talk to Khoa".
9. **Mobile is its own edit.** One product surface in focus at a time, a pinned stage above a reading band, and
   the bottom sheet as the owner decision. Floating layers are reduced to one.
10. **A person is accountable.** The founder is named, placed and reachable, and the page says plainly that the
    product is early.
