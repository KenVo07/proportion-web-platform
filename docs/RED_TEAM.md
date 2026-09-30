# Cold-outreach red team (V2)

**Scenario.** A plumber receives an unsolicited LinkedIn message, taps the link on their phone and gives
proportion.systems ten seconds. The page was reviewed from the built output at 390×844 and 1440×900 in three
configurations:

- **A:** Showcase pending, no contact configured (the default).
- **B:** Showcase pending, with a contact route.
- **C:** Showcase live.

## The six questions

| # | Question | What answers it in the first screen | Verdict |
|---|---|---|---|
| 1 | What is this? | The headline: "An AI front office for service businesses." | Answered in the first line, before any animation. |
| 2 | Is it for businesses like mine? | The lead names "plumbers, electricians, HVAC and cleaning businesses". The illustration is a plumbing business, and its first customer message is "a pipe under my kitchen sink has burst". | Answered. A plumber sees their own job on screen. |
| 3 | Does this appear real? | A working product composition: the customer's chat, a Case with "What AFO knows — and how" and "AFO still needs", and an "AI handling · Take over" control. It assembles itself in about 3 seconds, and a fact visibly lifts from the customer's words onto the Case. It is captioned as an illustration with a fictional business. | Reads as real software. The "Fictional demo" labels are honesty markers that match the Showcase. |
| 4 | Is this more than a chatbot? | The Case and the takeover control are on screen at once. The lead says AFO "offers times online and drafts quotes from your price list for you to approve". | Answered on the first screen, then shown frame by frame: booking with calendar confirmation, a quote waiting in the Inbox, approve and send, take over. |
| 5 | What can I actually try? | **C:** "Try AFO live" in the nav and the hero, and a Showcase section with one action. **A/B:** "The live Showcase opens soon." | C is answered. In A and B there is honestly nothing to try yet, and the page says so rather than faking a demo. |
| 6 | Does this person/company look legitimate? | "Built in Melbourne by Minh Khoa Vo" under the call to action, linking to the founder section: Founder, Computer Science student at Monash University, Melbourne, Australia. | **B/C:** adequate to good, strong with a real photo. **A:** weaker, because a name without a way to reach them invites doubt. |

## Objections a sceptical tradie might raise, and where the page answers them

| Objection | Where the page answers it |
|---|---|
| "The AI will quote whatever it likes." | Rules: "Prices come from your price list. A price that isn't on it never reaches the customer." Frame 5 shows the decision card with its "Price assumes" text. |
| "It'll tell customers something's booked when it isn't." | Frame 4 shows the slot go offered, chosen, requested, and then confirmed by the calendar. The rule receipt pairs "Calendar confirmed the booking" with "Booking outcome unknown — not treated as booked". |
| "Customers hate bots." | "It says it's an AI assistant. Up front, whether customers call or chat." The safety-first exchange shows the tone. |
| "I want to handle my own customers." | Frame 7: take over the chat, reply as the business, hand it back. |
| "Is this even built?" | Every string on the stage is the Showcase's own, and the final panel sits over a real Showcase screenshot. The founder note is plain about it being early. |

## Weaknesses found and corrected in this pass

1. **The link preview showed a phone call ending in a booking** (V1's image), which LinkedIn displays before
   anyone clicks. It was rebuilt from the web-chat story.
2. **The first screen repeated itself:** the eyebrow said what the headline says. The eyebrow was removed.
3. **The phone first screen had a dead gap** between the copy and the stage. The stage now peeks right under the
   byline.
4. **The story had lost the pain.** V1's "the phone rings while you're under a sink" had been folded away. It is
   back as "A customer gets in touch while you're on a job", "No chasing half-finished enquiries" and "No pricing
   from memory after hours".
5. **Claims the truth audit rejected** were fixed: "AFO inferred" facts, "still needs name and address",
   service-area enforcement, per-trade links, and review wording. See `QA_REPORT.md`.

## What still limits the test

- **Configuration A has no contact route.** Set `contact.linkedin` or `contact.email` before any outreach, and
  "Talk to Khoa" becomes the primary action.
- **Until the Showcase is live, question 5 has no hands-on answer.** The story is the substitute.
- **The story is eight steps long on a phone** (seven re-created frames and the real capture). The chapter dock lets a visitor jump, and the first screen
  already answers questions 1 to 4 without scrolling.
- **"HVAC"** is the brief's term. Some Australian tradies say "heating and cooling" or "air con". This is a copy
  decision for the founder.
