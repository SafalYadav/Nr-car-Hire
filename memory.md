# NR Car Hire — Project Memory

> Living project-state file. Update this file after EVERY project run.

## Project

- Project: NR Car Hire
- Market: Australia (with temporary INR test currency configured)
- Product: Full-stack premium car-hire platform
- Delivery target: 7 days
- Primary currency: INR (Temporary Test Mode; default production AUD)

## Documentation State

The six mandatory source-of-truth files are:

- PRD.md — product requirements
- architecture.md — architecture and technical direction
- README.md — engineering/security/AI rules
- phase.md — 7-day roadmap
- design.md — visual design system
- memory.md — actual implementation state

## PHASE 5C & PHASE 5D — COMPLETE & VERIFIED

### Part A & B: Dual Natural Voice Greetings

- [x] **Website Opening Greeting (`WebsiteVoiceGreeting`)**:
  - Automatically speaks `"Welcome to NR Car Hire."` on initial website visit per session (`sessionStorage`).
  - Respects browser autoplay restrictions with zero console errors or page interruptions.
  - Does NOT repeat on page navigation, route transitions, or widget toggles.
- [x] **AI Concierge Opening Voice Greeting (`AiChatWidget`)**:
  - Voice agent naturally asks: `"What would you like to have?"` when opening the AI concierge widget.
  - Natural, warm, human delivery with support for English, Hinglish, Hindi, and Gujarati.
  - Pauses and waits for user's request without sending duplicate messages.

### Part C, D, E: Human-Like Voice Synthesis & Text-to-Speech

- [x] **Speech Sanitizer (`formatTextForSpeech`)**:
  - Natural currency conversions (`₹99/day` → `"99 rupees a day"`).
  - Natural date ranges (`1-5 September` → `"September 1st to 5th"`).
  - Extra codes converted to clean spoken names (`ext-zero-excess` → `"Zero Excess Protection"`).
  - Markdown, raw URLs, bracketed links, bullet symbols, raw JSON, and emoji cleanly stripped.
- [x] **Conversational Parity & Shared Memory**:
  - Voice and text use the identical `AiAgentService` brain, context state, and authoritative tools.

### Phase 5D: Full NR Car Hire Business Intelligence

- [x] **Authoritative Knowledge Base (`lib/data/knowledge-base.ts`)**:
  - **Cancellation & Refund Policy**: Free cancellation with 100% refund up to 48 hours prior to pickup.
  - **Booking Modification Policy**: Free date/location/vehicle modifications up to 24 hours prior.
  - **Driver Age Requirements**: 21+ years (21–24 young driver terms for Sedans/SUVs; 25+ full fleet access).
  - **Driver Licence Policy**: Full Australian state licence, digital licence, or International Driving Permit + passport.
  - **Fuel Policy**: Full-to-Full transparent policy.
  - **Mileage Policy**: 100% Unlimited kilometres included on all standard rentals across Australia.
  - **Late Return Policy**: Complimentary 59-minute grace period; $20/hr afterwards up to 1-day rate.
  - **Insurance & Liability**: Standard Comprehensive cover included; Zero Excess Protection (₹25/day) reduces liability to $0.
  - **Security Deposit**: $200 standard / $500 luxury pre-authorisation held on card and released within 3–5 days.
  - **One-Way Interstate Rentals**: Supported between Sydney, Melbourne, Brisbane, Gold Coast, Perth, Adelaide.
  - **24/7 Roadside Assistance**: Complimentary national breakdown coverage; Roadside Plus (₹8/day) for key lockout/tyres.
  - **Child Safety Seats**: AS/NZS 1754 Australian certified baby capsules, toddler seats, and booster seats (₹12/day).
  - **GPS Navigation**: Portable satellite GPS navigation units with speed camera alerts (₹10/day).
- [x] **Airport & Location Hub Intelligence**:
  - Sydney Kingsford Smith (SYD), Melbourne Tullamarine (MEL), Brisbane (BNE), Gold Coast (OOL), Perth (PER), Adelaide (ADL).
  - Specific terminal concourse collection desks, walking vs skywalk access, and 24/7 after-hours key drop-off boxes.
  - Honest rejection of unsupported cities with nearest supported hub recommendations.
- [x] **Multi-Requirement Recommendations & Grounded Vehicle Comparisons**:
  - Camry vs Tucson (sedan fuel efficiency vs SUV ride height/cargo).
  - CX-5 vs Tucson (sporty dynamics vs budget family hybrid).
  - BMW 3 Series vs Mercedes-Benz C-Class (rear-wheel agility vs executive luxury).
  - Largest boot volume (Hyundai Tucson 539L cargo volume, Toyota HiLux 4x4 open tray).
  - 5 people + large luggage for 2-week road trips (Hyundai Tucson & Mazda CX-5).
- [x] **Customer Booking Lookups (Customer-Safe)**:
  - Live lookup by booking reference (`BK-...`, `NR-2026-...`) reporting status, vehicle name, dates, hub, and payment status.
- [x] **Strict Security Isolation**:
  - Refuses `.env.local`, API keys (Gemini, Razorpay), server secrets, database credentials, admin audit logs, and mutation commands.

### Final Voice Refinement & Security Hardening (ElevenLabs & Turbopack)

- [x] **Secure Credential Management**:
  - Removed all hardcoded fallbacks for the ElevenLabs API key and Voice ID.
  - Required `.env.local` server-side variables ONLY; safely handles `401 Unauthorized` and `402 Payment Required` with a graceful text-only fallback.
  - Ensured absolutely zero credential leakage to client bundles or browser logs.
- [x] **Natural Voice Behaviors**:
  - Voice formatting adjusted for "129 rupees per day" (instead of "a day") as specified.
  - Implemented interrupt/barge-in support during TTS if the user speaks or types.
  - Restricted "Welcome to NR Car Hire." greeting to trigger strictly once per session.
- [x] **Build & Turbopack Fix**:
  - Diagnosed and fixed the `TurbopackInternalError` node worker crash caused by unsupported PostCSS config with Tailwind CSS v4.
  - Rewrote `@apply` directives to use native CSS variables mapping to the Tailwind v4 `@theme`.
  - Removed broken `postcss.config.mjs` entirely to enable stable fast compilation.

## Verification Metrics

- Build: PASS (`npm run build` — 45/45 static & dynamic routes compiled perfectly)
- Lint: PASS (`npx eslint` — 0 errors)
- Type Check: PASS (`npx tsc --noEmit` — 0 errors)
- Tests: PASS (`npm test` — 22/22 test files, 190/190 tests pass)
- Live E2E Verification: PASS (`scratch/test-phase5d-e2e.mjs` — 21/21 scenarios passed 100%)
- Dev Server: RUNNING (`next dev` on `http://localhost:3000`)
