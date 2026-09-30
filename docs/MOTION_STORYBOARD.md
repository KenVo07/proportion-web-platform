# Motion storyboard (V2, as built)

The page tells one story on one product stage: a burst-pipe enquiry to the fictional Riverbend Plumbing, from
the first message to the owner's decision. Every string on the stage is the AFO Showcase's own wording: fact
labels, provenance chips, timeline entries, Inbox rows and owner-decision text. Every movement shows something AFO
actually does.

The story uses the **website chat** path, which the Showcase qualifies end to end: chat, facts, offered times, a
booking confirmed by the demo calendar, a photo, quote review, delivery in the chat, and takeover. The phone
channel appears in the Inbox as a second conversation. The page never shows a phone call ending in a booking,
because the demo line's booking behaviour is still being qualified.

Three details follow the Showcase exactly, as corrected by the independent truth audit in `QA_REPORT.md`:

- In the web-chat path the customer stays "New customer" even after giving a name.
- The $345 fixed price is drafted only after AFO has asked for, and received, a photo.
- Facts are "Customer said". The demo refuses AI-inferred facts, so the page never shows an "AFO inferred" fact.

## Motion system

| Token | Value | Used for |
|---|---|---|
| `--ease-settle` | sampled damped spring as a CSS `linear()` curve, about 1.5% overshoot | surfaces recomposing on the stage |
| `--ease-out` | `cubic-bezier(.2, .8, .2, 1)` | entrances, messages, reveals |
| `--ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` | glass tint, light sweep |
| `--dur-micro` | 180 ms | pressed buttons, chip changes |
| `--dur-small` | 320 ms | messages, fact rows, slot states |
| `--dur-move` | 640 ms | chat scrolling |
| `--dur-recompose` | 820 ms | stage layout changes between frames |
| fact flight | 1000 ms (WAAPI, FLIP) | a chip lifting from the customer's words onto the Case |

Only `translate`, `scale`, `opacity` and two bounded `clip-path` wipes are animated: the AI message opening, and
the booked calendar slot filling. There is one exception. Inside the Case card, "What AFO knows" is the card's
last section and grows downward as rows land, so nothing else moves. Measured cumulative layout shift is 0.

Scroll position picks the frame. Moving forward one frame plays that frame's choreography on a clock. Moving
backwards or skipping frames settles instantly with short fades. Copy is never delayed: the step text is plain,
static HTML.

- **Reduced motion.** Each frame renders its final state. Surfaces jump to their positions and only opacity
  fades. There are no flights, no wipes, no typing dots and no live-dot ring. Verified: zero running animations.
- **Without JavaScript.** The stage shows the hero frame in place and is not pinned. The steps read as plain
  dark-on-light text.

## Frame 0: arrival (hero, time-based, about 3 s)

| t | What happens | Why |
|---|---|---|
| 0 | Headline, lead, button and founder byline are already painted. | Reading never waits. |
| 120 ms | The chat card, the Case card (+110 ms) and the glass capsule "AI handling · Take over any time." (+260 ms) rise 3cqh and fade in. | The customer's side, the structured work, and owner control. |
| 300 ms | The Case shows "Case opened from website chat" and **AFO still needs**: "Whether water is still escaping right now", "The suburb the work is in", and "Whether the damaged pipe is exposed and easy to reach …". | The Case starts as a list of what the job needs. |
| 450 ms | The customer: "Hi, a pipe under my kitchen sink has burst. There's water everywhere." | |
| 900 ms | AFO's reply appears as a small "AI ASSISTANT ···" pill, then opens into "Sorry to hear that. Is water still escaping right now?" | A live conversation, not a script dump. |
| 1850 ms | "pipe under my kitchen sink has burst" is highlighted. A chip lifts from it and lands under **What AFO knows — and how** as "What is happening · Pipe under the kitchen sink has burst · Customer said". | The whole product in one gesture: conversation becomes structured work. |
| after | The live dot on the capsule rings slowly (2.4 s). It is the only loop on the page. | "Live", quietly. |

## Transition: daylight to stage (scrubbed by scroll)

- A graphite backdrop fades in behind the pinned stage (`--dark` 0 → 1). On desktop it follows the hero copy
  leaving; on phones it follows the stage pinning under the nav.
- On desktop the hero copy fades and rises 28px as it leaves.
- At `--dark` ≥ 0.5 the nav glass switches to its dark tint and the story copy switches from ink to white. That
  keeps text contrast near 4:1 even mid-transition.
- The glass chapter dock ("01 Enquiry · 02 Booking · 03 Owner") fades in.

## Sequence 1: contact becomes structure

**Frame 1, "A customer gets in touch while you're on a job" (about 2 s).** The chat comes forward and the
Case recedes: 92% scale, 38% opacity.

1. The customer: "Yes, it's still going."
2. AFO, after a writing pill: "If you can safely reach the water meter, turn the mains tap off. Keep away from any
   power points near the water."
3. A floating Activity note appears: **Safety first: commercial questions paused**. On the Case, the quote row
   changes to "Paused — safety first".
4. The customer: "Done, it's off. I'm in Clayton, and the pipe's right there under the sink."

**Frame 2, "The conversation becomes a Case" (about 2.5 s).** The Case comes forward. In the customer's last
message three phrases highlight in turn. From each one a chip lifts and flies to a new row at the bottom of
**What AFO knows** (FLIP, 1 s, 240 ms apart). The matching **AFO still needs** line fades out as it lands:

| Phrase in the conversation | New fact row (the Showcase's labels) | Source |
|---|---|---|
| "it's off" | Whether water is still escaping right now · No | Customer said |
| "Clayton" | The suburb the work is in · Clayton | Customer said |
| "right there under the sink" | Whether the damaged pipe is exposed and easy to reach … · Yes | Customer said |

Then "Nothing outstanding right now." appears. The stage chip becomes "Qualifying", the sub-line becomes "New
customer · Clayton", and the quote row returns to "Not ready yet".

On phones the chat compresses to the top of the stage and the Case slides up from below, so the facts fly
downward.

## Sequence 2: Case becomes action

**Frame 3, "It checks availability and offers times" (about 2.6 s).** The Case compacts to the upper left and
the latest messages show beneath it. A calendar card rises on the right with staff lanes Alex, Sam and Riley.

1. Existing jobs fade in as grey blocks, labelled "Existing jobs (sample)".
2. One light bar sweeps the lanes: the availability check.
3. Four dashed slots and an **Offered** chip row appear: 10:30 · Sam, 11:00 · Sam, 11:30 · Riley, 12:00 · Riley.
4. The log adds "Offered 4 times (website)".
5. AFO: "Thanks. The earliest is Tuesday 6 October at 10:30 am with Sam. Shall I book that?"

The date is always the next Tuesday at least two days away, in Melbourne time, so the illustration never shows a
past date.

**Frame 4, "It books only the time the customer chose" (about 3.7 s).**

1. The customer: "The earliest time works. I'm Jordan Lee, 0491 570 156, 12 Demo Street, Clayton." This is the
   profile's ACMA-reserved fictional number.
2. The 10:30 slot is outlined. The log adds "Customer chose Tue 6 Oct, 10:30 am", and the other offers dim.
3. The slot turns striped (requested). The chip becomes "Booking in progress" and the log adds "Booking requested
   for Tue 6 Oct, 10:30 am".
4. 800 ms later the slot fills solid teal: "Jordan Lee · Booked by AFO". The log adds "Calendar confirmed the
   booking", the chip becomes "Booked", and the Appointment row shows "Tue 6 Oct, 10:30 am · Sam".
5. AFO: "You're booked for Tuesday 6 October at 10:30 am. If it's safe, could you send a photo of the damaged
   pipe?"

The pause between "requested" and "booked" is deliberate. It shows that nothing counts as booked until the
calendar confirms. The step copy says what happens if it can't.

## Sequence 3: owner control

**Frame 5, "Quotes come from your price list, and wait for you" (about 1.8 s).** The stage recomposes from the
customer's view to the business view, the Showcase's two-sided layout.

- The chat slides left as the customer column: "Photo sent" with the Showcase's own synthetic sample photo, then
  AFO: "Thanks for the photo — that's with the team."
- The Case and calendar leave. The business view rises with tabs Inbox, Job, Calendar and Owner decision (dot).
- The capsule docks into the business view as its handling bar.
- Inbox rows: New customer (Booked, Website chat); New customer (Blocked drain, Phone call, Call live); Priya Nair
  (Hot water fault, Web form).
- Activity: "Evidence received (1 item)", then "Quote ready — waiting for your decision".
- The owner decision **sheet** (glass) slides up over the Inbox. It shows:
  - $345.00 AUD, "Waiting for you" and "This is a fixed price for the work described below."
  - The Showcase's "Customer said" lines and "Price assumes" text, including "and any water-damage repairs".
  - "1 evidence item on this enquiry · price calculated from the business's approved price list."
  - **Approve & send**, **Take over** and **Reject**.

**Frame 6, "You approve it. The customer gets exactly that" (about 1 s).** Approve & send depresses. The status
becomes "Sent to customer" and the sheet shows "Approved and delivered in the customer's chat — the exact quote you
saw." The customer column receives **Quote from the business** with the same lines. Activity adds "Approved quote
delivered in the customer's chat". (The re-created story does not show the Showcase's toast, "Approved — the quote
is in the customer's chat.": the sheet's own result line says the same thing, and on phones the toast covered the
Inbox row. The toast is visible in the real capture of frame 8.)

**Frame 7, "Step into the chat whenever you like" (about 1.4 s).**

1. The sheet slides away.
2. The handling bar flips to indigo: "You're handling · AFO is silent.", with **Hand back to AFO**.
3. The customer column's subtitle becomes "A team member is here".
4. It then shows "A member of the team has joined the conversation." and "Hi Jordan, it's the owner — Sam will
   bring the parts."
5. Activity adds "You took over the conversation. AFO stays silent until you hand it back."

**Frame 8, "This is the real product" (about 0.8 s).** The re-created surfaces fade and a browser-framed capture of
the real Showcase workspace rises in their place ("AFO Showcase workspace · fictional demo business"), at the same
point of the enquiry: You're handling, Hand back to AFO, the Owner decision tab with the quote sent to the customer,
and every step in its Activity. The stage caption ("Re-created from the AFO Showcase") steps aside, because the
capture carries its own label.

- The capture is shown as the genuine image, only offset and scaled: on desktop it is cropped to the business view
  and its Activity (about 0.8× at 1440, so its text stays readable); on phones to the business column.
- It is not fetched on a first visit. The story starts loading it on reaching frame 5, three frames before it is
  shown; the final section reuses the cached file.

## Chapter dock (glass, interactive)

Three links to the first step of each chapter. The active chapter is a lifted pill with `aria-current="step"`,
and a hairline under it fills continuously as its steps scroll past. The dock is hidden and unfocusable in the
hero. Its specular edge, like the nav's, is lit from an angle that drifts a few degrees per screen with page
scroll.

## Scroll-driven moments after the story

| Section | Trigger | Motion |
|---|---|---|
| Your rules | each row entering view | The rule rises 14px; 120 ms later its product receipt settles in (98% → 100%). The light section itself slides over the graphite story with rounded top corners. |
| One front office | scrubbed across the band | Four channel pills connect to the Case node along drawn paths (dash offset 1 → 0). The node's ring lights, then paths draw to Inbox, Calendar and Owner decision. Drawn in full under reduced motion or without JavaScript. |
| Final call to action | entering view | The glass panel rises over a dimmed frame of the real Showcase workspace, and its specular edge sweeps once. |

## Phone edit (below 960px)

- The stage is pinned under the nav at 56% of the small viewport height. Step copy scrolls through the reading
  band beneath and tucks under the stage's soft bottom edge.
- One primary surface is in focus per frame, and at most one other is visible. The hero capsule, the Activity note
  and the Case's Appointment and log rows are left out.
- The owner decision is a bottom sheet over the business view.
- The dock sits on the stage's bottom edge. It is the only floating layer.

## What was rejected, and why

- **Word-by-word text scrubbing:** it makes reading wait.
- **A waveform or orb for the phone channel:** decorative, and the phone line is not the story here.
- **Automatic hand-back after takeover:** the takeover state is the point of the frame.
- **The View Transitions API for stage morphs:** its snapshots cover the sticky nav, blur text mid-flight, and
  behave badly when fast scrolling triggers them repeatedly.
- **GSAP / ScrollTrigger:** native sticky positioning, one requestAnimationFrame scroll reader, CSS transitions
  and the Web Animations API cover everything here with no dependency.
- **An "AFO inferred" fact and "AFO still needs: Name, Address":** neither is something the Showcase produces
  (truth audit).
- **Per-trade deep links (/demo/plumbing …):** the Showcase opens on its own business picker, so they would land
  on the wrong trade (truth audit).
- **Dimming inactive story steps:** it pushed text below WCAG AA contrast. An accent bar marks the active step
  instead.
