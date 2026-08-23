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

## NR CONCIERGE ROOT FIXES — COMPLETE & VERIFIED

### Priority 1: Single Voice Pipeline
- [x] **Single Voice Architecture**:
  - `AI Response` → `Single TTS Service (voiceService)` → `ElevenLabsTTSProvider` (`/api/tts`) → `Audio Playback`.
  - Single source of truth voice configuration (`ELEVENLABS_VOICE_ID` / standard premade Sarah `EXAVITQu4vr4xnSDxMaL`).
  - Website greeting, concierge opening greeting (`"What would you like to have?"`), assistant replies, and follow-up turns all sound like the identical assistant.
- [x] **Accidental Voice Switching Eliminated**:
  - Removed automatic fallback to browser `speechSynthesis`. Browser speech synthesis is strictly isolated as a disabled emergency fallback and never activates when ElevenLabs is configured.
  - Zero random voice changes across consecutive conversation turns.
- [x] **Graceful Failure Handling**:
  - ElevenLabs API failures (401, 500, network errors) terminate gracefully without throwing exceptions or crashing the frontend application.

### Priority 2: Maintenance Availability Root Fix & Action Flow
- [x] **Authoritative Data Flow**:
  - `Customer Question` → `NR Concierge` → `InventoryService.checkAvailability()` (single source of truth) → `Maintenance holds + active bookings + dates` → `Final answer`.
  - Direct integration with `vehicleStore.getVehicleMaintenances()` and `vehicleStore.getVehicleBookings()`.
- [x] **Grounded Unavailable Explanation & Helpful Next Actions**:
  - Scheduled Maintenance hold: *"The Toyota HiLux is unavailable from September 1 to September 5 because it is scheduled for maintenance. Would you like me to check different dates or show similar available vehicles?"*
  - Quick Actions: `['Check Different Dates', 'Show Similar Vehicles', 'Browse All Fleet']`.
  - Follow-up `"show similar"`: Understands previous vehicle/date context, queries `InventoryService` for candidate alternatives, and returns verified available vehicles with pre-filled booking URLs.
  - Follow-up `"check different dates"`: Prompts for the customer's preferred new travel dates.
- [x] **Zero Misleading Confirmations**:
  - Never says "proceed with other date", "book another date", or "available" on blocked vehicles.
  - No booking flow starts on an unavailable/maintained vehicle.
- [x] **Read-Only Security Guardrails**:
  - Refuses modification commands (cannot create/delete maintenance, cannot alter fleet/rates).
  - Never leaks administrative secrets, maintenance internal codes, or database IDs.

### Priority 3: Supabase Migration, Auth, Storage & Admin Panel Upgrade
- [x] **Supabase Client**: Configured `@supabase/supabase-js` client at `lib/db/supabase.ts` connected to `https://nerswxfbytxooyxcnvnc.supabase.co`.
- [x] **Database Schema**: Production SQL schema created at `supabase/migrations/20260823_supabase_init.sql` covering `profiles`, `vehicles`, `vehicle_images`, `vehicle_maintenances`, `locations`, `discounts`, `extras`, `bookings`, `payments`, `admin_audit_logs`, and `ai_conversations` with complete Row Level Security (RLS) policies.
- [x] **Data Migration Script**: Created `scripts/migrate-seed-supabase.ts` for populating real Australian fleet, discounts, extras, locations, and maintenance holds.
- [x] **Supabase Storage**: Implemented `lib/db/storage.ts` and `/api/admin/upload` for uploading, previewing, and deleting car images in the `vehicle-images` bucket.
- [x] **Admin Fleet Image Management**: Upgraded `app/admin/vehicles/page.tsx` with full CRUD, real-time image upload, multi-photo gallery management, and primary image setting.
- [x] **Supabase Authentication**:
  - Implemented `lib/auth/auth-context.tsx` and wrapped `app/layout.tsx`.
  - Created `/login` page ([app/login/page.tsx](file:///Users/safalyadav/nrcarhire/app/login/page.tsx)) with Email & Password and Google OAuth login.
  - Created `/signup` page ([app/signup/page.tsx](file:///Users/safalyadav/nrcarhire/app/signup/page.tsx)) with profile creation in `public.profiles`.
  - Upgraded Account Dashboard ([app/account/page.tsx](file:///Users/safalyadav/nrcarhire/app/account/page.tsx)) with live user session display, guest lookup, and logout.
  - Protected Admin Command Centre ([app/admin/layout.tsx](file:///Users/safalyadav/nrcarhire/app/admin/layout.tsx)) with `ADMIN` role barrier and sign out.
  - Auto pre-filled driver info in booking flow from authenticated Supabase profile.
- [x] **ElevenLabs AI Tools**: Formally exported and tested the 5 core AI Agent tool functions in `lib/services/ai-agent-tools.ts`.

### Priority 4: Official ElevenLabs Conversational AI Agent Integration
- [x] **Codebase Audit & Clean-up**:
  - Removed legacy custom chatbot widget (`components/ai/ai-chat-widget.tsx`).
  - Removed legacy voice greeting sound trigger (`components/voice/website-voice-greeting.tsx`).
  - Removed legacy voice provider directory (`lib/voice/`).
  - Removed legacy server-side TTS proxy (`app/api/tts/route.ts`).
  - Removed obsolete voice test suites (`tests/unit/concierge-final-voice-language-inventory.test.ts`, `tests/unit/concierge-root-verification.test.ts`, `tests/unit/elevenlabs-fallback.test.ts`, `tests/unit/voice-agent-phase5c.test.ts`).
- [x] **Official ElevenLabs React SDK**:
  - Installed `@elevenlabs/react` SDK with `useConversation` and `ConversationProvider`.
  - Configured `NEXT_PUBLIC_ELEVENLABS_AGENT_ID="agent_7101m0nhr59dekj8fj3germ8pq3j"`.
- [x] **Premium AI Voice Agent Widget**:
  - Created `components/ai/elevenlabs-agent-widget.tsx` with luxury gold & midnight UI matching NR Car Hire brand.
  - Floating bottom-right action trigger with live call status pulse.
  - Interactive modal with real-time soundwave orb visualizer, mic mute toggle, end call controls, live transcript, and popular prompt suggestions.
  - Mounted globally in `app/layout.tsx`. Zero duplicate UI widgets.
- [x] **Testing & Verification**:
  - Added unit test suite `tests/unit/elevenlabs-agent-integration.test.ts`.

### Priority 5: Razorpay Payment Gateway & Vercel Serverless Isolation Fix
- [x] **Root Cause Diagnosis**:
  - On localhost, Next.js runs in a single Node process where in-memory Maps (`paymentStore`, `bookingStore`) persist across requests.
  - On Vercel Serverless, `POST /api/bookings` and `POST /api/payments/verify` execute in separate isolated Lambda instances.
  - When `verifyPayment` ran, `paymentStore.findByOrderId(razorpay_order_id)` returned `null`, throwing `NotFoundError` and failing the checkout.
- [x] **Database Persistence & Serverless Resilience**:
  - Upgraded `lib/db/payment-store.ts` to persist all payment transactions to Supabase `public.payments` table and query Supabase if memory cache misses.
  - Upgraded `lib/db/booking-store.ts` to persist all reservations to Supabase `public.bookings` table and query Supabase if memory cache misses.
  - Upgraded `lib/services/payment-service.ts`:
    - Sanitized and trimmed `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` to strip any stray quotes or whitespace.
    - Updated `verifyPayment` to dynamically upsert missing payment records upon valid HMAC-SHA256 signature verification rather than prematurely failing with 404.
    - Added `rzp.on('payment.failed')` error listener in `components/booking/booking-flow.tsx` to surface exact gateway error descriptions to the user.

## Verification Metrics

- Build: PASS (`npm run build` — 47/47 static & dynamic routes compiled)
- Lint: PASS (`npx eslint` — 0 errors, 0 warnings across all directories)
- Type Check: PASS (`npx tsc --noEmit` — 0 errors)
- Tests: PASS (`npm test` — 25/25 test files, 207/207 unit tests pass)
- ElevenLabs Integration Suite: PASS (`tests/unit/elevenlabs-agent-integration.test.ts`)
- Dev Server: RUNNING (`next dev` on `http://localhost:3000`)
- GitHub Sync: Pushed to `origin/main` (commit `c5df64a`)
