# Cold-outreach red team

Scenario: a plumber receives an unsolicited LinkedIn message, taps the link on their phone, and gives
the page ten seconds. Reviewed against the built page at 390 px and 1440 px on 2026-09-28, in both
configuration states.

| # | Question | What the visitor sees in the first screen | Verdict |
|---|---|---|---|
| 1 | What is this? | Eyebrow "AI Front Office · for service businesses"; headline "An AI front office, built around your business." | Answered in the first two lines. |
| 2 | Is it for businesses like mine? | First sentence of the lead: "for plumbers, electricians, HVAC and cleaning businesses". | Answered. Plumbing is named first and is the worked example throughout. |
| 3 | Does this appear real? | A product frame with the product's own labels: Inbox / Job / Calendar / Owner decision, "AI handling", a caller transcript, a timeline ending in a confirmed booking and a drafted quote. Captioned as the Showcase business view with a fictional business. | Reads as a real product. The "Fictional demo" pill is an honesty marker that matches the Showcase; the caption explains it. |
| 4 | Is this more than a chatbot? | The lead names booking, quoting from a price list, owner approval and takeover. The timeline shows "Calendar confirmed the booking" and "Quote drafted ... never by the model." | Answered above the fold; reinforced by the step-by-step section and the rules section. |
| 5 | What can I actually try? | **Live state:** "Try AFO live" is the primary button, with "Fictional businesses, real conversations. Nothing to install." **Pending state:** "See how it works" is the only button, and the note says the Showcase is being prepared. | Live state: answered. Pending state: honest but there is nothing to try; the visitor is asked to read instead. Switch to live as soon as the founder confirms. |
| 6 | Does this person/company look legitimate? | Founder name and city in the "Who's building it" section; "A Proportion product" in the footer; a `.systems` domain with a working favicon and link preview image. | Adequate, not strong. There is no contact channel until `contact.href` is set, and no company registration details anywhere. Set a contact destination before any outreach. |

## Objections a sceptical tradesperson might raise, and where the page answers them

- **"AI will quote whatever it likes."** Rules section: prices come from your price list; the model never
  invents one; what you approve is exactly what the customer gets. Step 04 shows the decision card.
- **"It'll tell customers something's booked when it isn't."** Step 03 and the rules section: exact
  choice recorded, calendar confirms, otherwise the customer is told it isn't booked yet.
- **"I want to talk to my own customers."** Step 05 and "Your side of it": take over any conversation,
  AFO goes silent, hand back later.
- **"Customers hate talking to a bot."** Rules section: AFO says it is an AI assistant up front. The
  page does not argue this away; it shows the safety-first exchange so the tone is visible.
- **"Is this even built, or is it a deck?"** Every visual is the product's own UI, and the founder
  section commits: "Everything described on this page is in the Showcase. If it isn't there, it isn't
  claimed here."

## Weaknesses found and how they were handled

1. **Showcase step list collapsed into a one-word column** (grid text-node bug) on every viewport.
   Fixed by wrapping each step's content.
2. **Takeover bar unreadable on phones** (text squeezed between pill and button). Fixed with a
   re-stacked layout under 720 px.
3. **Hero taller than a 900 px desktop viewport**, pushing the primary button below the fold. Fixed by
   trimming the transcript to four exchanges and the timeline to six entries.
4. **Headline broke into four short lines on phones** because of a character-width cap. Cap removed
   below 720 px.
5. **Final call to action in the pending state loops back to "See how it works".** Acceptable only until
   a contact destination is configured; flagged for the founder.
6. **"HVAC"** is the brief's term; Australian tradespeople more often say "heating and cooling" or
   "air conditioning". Left as briefed, flagged as a copy decision.
7. **No contact channel by default.** Deliberate (no invented address), but it weakens question 6.
   The single config field fixes it.

## What was not tested

- Real devices and screen readers. The checks are Playwright/Chromium screenshots at five widths, axe-core,
  and a keyboard pass. The one axe "needs manual review" item is the quote total in the step 04 mock-up, whose
  background axe could not resolve; it is near-black on pale teal and passes 4.5:1 by inspection.
- Load performance in the field. The page has no external requests and under 55 KB of assets, so the
  risk is low, but no Lighthouse run was possible offline.
