# MH Markets — Expo Prediction Games

A kiosk-style web app for the MH Markets Forex Expo Dubai booth. Visitors register, then play one of two entertainment-only games — **Trade Prediction Challenge** (Buy/Sell against a simulated chart) or **Spin & Win** (prize wheel) — with results and prizes managed from an internal admin dashboard.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma/PostgreSQL.

## Quick start

```bash
npm install
cp .env.example .env      # fill in the values below
npx prisma migrate dev --name init
npm run db:seed           # creates the first admin login
npm run dev
```

Visit `http://localhost:3000` (the app will use the next free port if 3000 is taken).

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signs admin session cookies |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Credentials for the admin account created by `npm run db:seed` |
| `RESEND_API_KEY` | Sends OTP verification emails and admin daily reports |
| `RESEND_FROM_EMAIL` | Sender address — **must be on a domain verified in your Resend account**. The sandbox address `onboarding@resend.dev` only delivers to the email that owns the Resend account, not real attendees — verify a custom domain before the event. |
| `NEXT_PUBLIC_APP_URL` | Base URL of the deployed app |
| `OTP_EXPIRY_MINUTES` | How long an email OTP code stays valid |
| `TWILIO_*` | Optional — SMS OTP support exists in `lib/otp.ts` but isn't wired into the UI |

## How the app is structured

### Visitor-facing flow
- **`app/page.tsx`** — kiosk home screen: looping background video, Trade Prediction / Spin Wheel buttons, and a Register button that opens an embedded Alphorix lead-capture form.
- **`components/RegistrationFlow.tsx`** — orchestrates registration in two steps:
  1. **`RegisterModal`** — name/email/phone/country fields, a "Send OTP" action (creates the participant + emails a code) and a "Register Now" action (validates everything, saves final details, verifies the code) — all inline, no separate screen.
  2. **`TermsModal`** — per-game terms & conditions with an acceptance checkbox.
- **`app/game/trade/page.tsx`** — Trade Prediction Challenge. A `lightweight-charts` area chart wanders continuously from page load; tapping **Predict Now** freezes it and asks Buy or Sell; the outcome (WON/LOST) is decided server-side first (via admin override or the configured win rate), and the chart's actual direction is then made to match — so the guess always "feels" correct without the client ever controlling the real result.
- **`app/game/spin/page.tsx`** — Spin & Win. A weighted six-segment wheel (`lib/spinSegments.ts`, fixed for the whole expo) spins to a segment chosen the same server-first way.
- Both games enforce **one play per participant per game** at the database level (`GameSession` has a `@@unique([participantId, gameType])` constraint) and show a themed "already played" popup (`components/AlreadyPlayedModal.tsx`) if replayed.

### Admin dashboard (`app/admin/*`)
JWT-cookie authenticated (seeded via `npm run db:seed`, no self-signup).
- **Participants** — search/list registrants, drill into a participant to force a WIN/LOSE outcome for either game ahead of time.
- **Game Config** — tune the Trade game's default win rate live (Spin segments are a code constant since they're fixed for the expo).
- **Winners** — every WON session with its prize/claim code, mark prizes as claimed.
- **Reports** — manage recipient emails and send a daily CSV summary (registrations + outcomes) on demand.

### Data model (`prisma/schema.prisma`)
`Participant`, `OtpCode`, `GameSession` (per-game result + optional admin `forcedOutcome`), `Admin`, `GameConfig`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build/run |
| `npm run lint` | Next.js lint |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:migrate` | Run/create migrations |
| `npm run prisma:studio` | Browse the database |
| `npm run db:seed` | Create/update the admin login from `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` |

## Notes for the next person

- **Guest bypass**: `app/page.tsx` currently has a temporary bypass on the Trade Prediction button that skips registration and creates an instant guest participant via `/api/guest` — useful for demoing quickly, but should be reviewed before the real event so every attendee actually registers.
- **Email deliverability**: verify a real sending domain in Resend before the event (see the `RESEND_FROM_EMAIL` note above) — OTP emails and daily reports will silently fail to reach attendees otherwise.
- **Media assets**: game/UI images live in `public/media/`; asset paths are centralized in `lib/media.ts` so swapping a file only requires updating one constant.
- **Disclaimer**: all chart/wheel data is simulated for entertainment — no real market data is used anywhere in the app.
