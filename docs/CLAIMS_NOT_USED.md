# Claims deliberately not made

Each item was considered for the page and left out because the repository's own evidence does not
support it, or explicitly rejects it. Sources are the AFO project packages read on 2026-09-28.

## Customers, results, proof

| Not claimed | Why |
|---|---|
| Any customer count, logo, testimonial, case study or "trusted by" strip | No real client exists yet; the first real client was still unselected in the pilot handoff, and the Showcase copy review recorded "no generated art, testimonials, logos, metrics" as a deliberate rule. |
| Revenue, ROI, savings, missed-call recovery rates, call-volume or conversion improvements | No measurement of any of these exists. |
| Production deployments or a "live for businesses" statement | Signoff explicitly "does not authorize any real business, number ... or a real-client pilot". The page says the product is being qualified before it takes a paying customer's calls. |
| Bluegum Plumbing & Maintenance as a customer or example | It is a fictional QA fixture that runs on production infrastructure. Not a customer; not shown. |

## Capability wording that was rejected in the product's own copy review

| Not used | Replaced with |
|---|---|
| "books into the real schedule" / "your calendar" | "offers available times" and "asks the calendar to confirm". The Showcase calendar is an isolated demo schedule; no Google Calendar integration is connected. |
| "nothing you type leaves this sandbox" | "Your own private demo session." |
| "you approve every price" | "Quotes wait for you", scoped to quotes. |
| "replies in seconds" | Not mentioned. Latency figures in the docs are qualification targets, not guarantees. |
| "can actually book" (unqualified) | Booking is described with its safeguards: exact choice recorded, calendar confirms, otherwise "not booked yet". |
| Anything with "every location, job, channel, booking or quote" as a guarantee | Avoided; `npm run check` fails on that wording. |

## Capabilities that exist only partly, so are described narrowly or not at all

| Topic | What the page says | What it does not say |
|---|---|---|
| Phone line | Mentioned as part of the Showcase only when `showcase.phoneLine` is `live`. | Not shown by default: the live demo line is currently stopped on open demo blockers (voice booking loop; booking accepted without name/address). No phone number is printed on the page. |
| Customer identity across channels | "it lands in the same Case" | Does not claim that a chat and a later form always merge into one Case (an anonymous chat followed by the form can create two). |
| Service areas | Listed as something AFO is given. | Does not claim service areas are enforced; enforcement is an open item. |
| Quote delivery | "The customer gets exactly the quote you approved." (web chat) | Does not claim delivery receipts, PDF quotes, or quote delivery after a phone call; those are not implemented. |
| Review / assurance | "kept as evidence and checked", naming two deterministic checks | Does not claim an AI reviewer, "reviewed, no issues", or that review is complete; the demo reports "Review: incomplete" and the mock-up shows exactly that. |
| Human takeover | Take over / hand back as shown in the Showcase. | Does not mention pause or safe-mode, which is required before a real client and not implemented; does not claim takeover state survives a restart. |
| Photos | Not mentioned. | AFO attaches photos but does not diagnose from them; photo evidence requests are declared not implemented. |
| SMS, WhatsApp, email, call transfer, ring groups, self-serve onboarding, payments, outbound | Not mentioned. | Deferred or not built. |
| Integrations (CRM, calendar, job-management software) | Not mentioned. | None is connected in the Showcase. |

## Founder and company

| Not claimed | Why |
|---|---|
| Legal entity, ABN/ACN, address, phone, email | None appears in the material. `contact.href` in `site.config.json` is empty until the founder supplies a real destination. |
| Monash University affiliation | The brief allows "Melbourne / Monash context" but the repository never states the relationship (student, graduate, staff). Left for the founder to add in one line if wanted. |
| Team size, funding, partners, awards | Not in the material. |

## Vocabulary kept out on purpose

"AI receptionist", "chatbot" (except to contrast), "agent", "automation platform", "omnichannel",
"AI-powered", "seamless", "revolutionise", "transform", "supercharge", "leverage". The page describes
behaviour instead.
