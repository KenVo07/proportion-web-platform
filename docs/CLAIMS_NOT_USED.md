# Claims deliberately not made (V2)

Each item was considered for the page and left out or narrowed. The reason is that the AFO evidence does not
support it, contradicts it, or the product's own copy review rejected it. Sources are the AFO project packages,
read on 2026-09-28 and 2026-09-29. The V2 copy was also checked by an independent read-only truth audit; its
findings and how each was resolved are in `QA_REPORT.md`.

## Customers, results, proof

| Not claimed | Why |
|---|---|
| Customer counts, logos, testimonials, case studies, "trusted by" | No real client exists yet. The Showcase copy review made "no generated art, testimonials, logos, metrics" a rule. |
| Revenue, ROI, savings, missed-call recovery rates, response times, conversion lift | Nothing measures them. Latency figures in the docs are qualification targets, not guarantees. |
| Production deployments, "live for businesses" | The signoff "does not authorize any real business, number … or a real-client pilot". The founder note says AFO is early. |
| Bluegum Plumbing as an example or customer | It is a fictional QA fixture on production infrastructure, not a customer. |

## Wording the product's own review rejected

| Not used | Used instead |
|---|---|
| "books into the real schedule", "your calendar", Google Calendar | "offers times online" and "the calendar is asked". The Showcase calendar is an in-memory demo calendar. |
| "nothing you type leaves this sandbox" | "Your own private demo session." |
| "you approve every price" | "Quotes wait for you", scoped to quotes. |
| "replies in seconds", 24/7 | Not mentioned. |
| Any "every job / booking / quote / channel / call" guarantee | Avoided. `npm run check` fails on that wording, on percentages, and on "trusted by". |

## Capabilities that exist only partly, so are described narrowly

| Topic | What the page says | What it does not say, and why |
|---|---|---|
| Phone | "AFO answers calls" (hero). "By phone, web chat, enquiry form or booking page" (story step 1). The phone call appears as an Inbox row. | It never shows or says that a call ends in a booked job, and no demo number is printed. Offering times by voice failed live (LPH-13), and a booking was accepted without a name (LPH-14). The "ring the demo line" line appears only when `showcase.phoneLine` is `live`. |
| Booking | "In web chat and on your booking page, AFO … offers times that fit"; "It isn't booked until the calendar confirms." | No calendar integration. It does not claim service areas are enforced (UNR-AREA-NOT-ENFORCED), so "service areas" was also removed from the setup list. |
| Facts | "each labelled with where it came from"; illustration facts are all "Customer said". | No "AFO inferred" or "Staff confirmed" facts: the demo profiles refuse AI-inferred facts (AUTHORITY_NOT_ALLOWED), and nothing writes staff-confirmed ones. The job type is the Case title, not a fact. |
| What's missing | "What's still missing is listed, not guessed"; the Showcase's own "AFO still needs" labels and "(customer doesn't know)". | No invented "still needs: name, address". The name/address rule is prompt-only (LPH-14). In the web-chat path the customer stays "New customer" even after giving a name, so the Inbox shows exactly that. |
| Quotes | "When the job has what your price needs, such as a photo, AFO drafts the quote"; "In web chat, the customer gets the exact quote you approved. If the job changes first, nothing is sent." | No quote delivery after a phone call (CS05 not implemented), and no delivery receipts (PB-02). The price guard is described as "A price that isn't on it never reaches the customer", not "the model never writes a number". |
| Review | "Conversations are kept as evidence and checked afterwards, for example 'Booked only the time the customer chose'. The review says what it couldn't verify." | No AI reviewer, no "reviewed, no issues", and no "every conversation". The price check is not observable in the Showcase, so it is not named. |
| Takeover | "Take over the chat and AFO goes silent." | No phone transfer (CS06), and no claim that takeover survives a restart. |
| One front office | "Whichever of these a customer uses, the enquiry becomes a Case in one Inbox." | No claim that a chat and a later form always merge into one Case (BL-03). The "one per enquiry" sub-label was removed. |
| Photos | AFO asks for a photo in chat and the customer sends the Showcase's sample photo. | No claim that AFO diagnoses from photos ("AFO does not diagnose from photos"). |
| Not built | Not mentioned. | SMS, WhatsApp, email, call transfer, ring groups, self-serve onboarding, payments, outbound, integrations. |
| Showcase deep links | One "Try AFO live" link to the Showcase. | No per-trade links: the Showcase opens on its own picker, so /demo/electrical would land on Plumbing. |

## Founder and company

| Item | Decision |
|---|---|
| Monash University | **Used.** The founder approved "Computer Science student at Monash University" in the V2 brief. V1 had left it out because no source stated it. |
| Founder photo | **Slot left empty.** No file in the project material is clearly labelled as the founder, and unlabelled personal images were not opened. Add a real photo with `founder.photo`. The page never shows a placeholder or avatar. |
| LinkedIn, business email, booking link | **Slots left empty.** None appears in the material. The only proportion.systems address found is the enquiry inbox of a different client-site pitch, so it was not used. Configure these in `site.config.json`. |
| Legal entity, ABN, address, phone | Not stated anywhere, so not shown. The footer says "© 2026 Proportion" and "A Proportion product". |
| HVAC | **Kept** as a target market from the founder's brief. There is no HVAC demo business, so the page no longer claims that everything shown comes from the Showcase. It now says "The product views on this page are re-created from the Showcase, with its fictional businesses." |

## Link preview image

`public/og.png` was rebuilt from the web-chat story: "Offered 4 times (website)" and "Calendar confirmed the
booking". V1's image showed a phone call ending in a confirmed booking, which the current evidence does not
support.

## Vocabulary kept out on purpose

"AI receptionist", "chatbot" (except to contrast), "agent", "agentic", "automation platform", "omnichannel",
"AI-powered", "seamless", "revolutionise", "transform", "supercharge", "leverage", "unlock", "empower", "24/7",
"never miss". The page describes behaviour instead.

## Final V2 pass (2026-09-30): wording and UI reconciled against the real capture

The founder pass added a ninth frame (a real Showcase capture) and some new re-created detail. Each new string was
checked against the only Product evidence available to this pass, the capture itself
(`src/assets/showcase-workspace.webp`) and the audited copy above. Anything neither shows was removed or reworded.

| Was | Now | Why |
|---|---|---|
| A "Job details" button and a masked number ("•••156") in the business view's detail header | "Burst or leaking pipe · New customer · Clayton" only | Neither appears in the capture or the audited copy. |
| "Quote delivered in the customer's chat" (What AFO did) | "Approved quote delivered in the customer's chat" | The capture's own Activity wording. |
| "Quote ready for you" chip (Showcase section) | "Waiting for you" | The decision card's audited chip. |
| "Describe a real job, or pick a suggested scenario." | "Describe a job you'd actually get." | No evidence that the Showcase offers suggested scenarios. |
| "All of it comes from the real product." (frame 8) | "This is the real product." plus "The views above are re-created from the AFO Showcase. This is a capture of the Showcase itself…" | The re-created views are adapted (panels combined, dates moved), so "all of it" overstated. |
| "Try the real product." heading while the Showcase is pending | "Try the real product, soon." (pending) / "Try the real product." (live) | No imperative to try something that is not open yet. |
| "The product views on this page are re-created…" (founder note) | "…in the story are re-created… The last one, and the image behind the final panel, are captures of the Showcase itself." | There are now real captures on the page. |

**Not reconciled here:** Client Workspace V1 is the stated Product authority, but its source and evidence are not in
this repository (or any branch of it) and were not reachable from this session. The capture and the re-created
labels agree with each other (tabs Inbox, Job, Calendar, Owner decision; "You're handling", "Hand back to AFO";
"Sent to customer"; the quote lines; the Activity strings), but whether they match the final Workspace V1 must be
confirmed by the founder against Workspace V1 itself.
