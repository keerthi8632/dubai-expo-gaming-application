# MH Markets — Expo Prediction Games

Phase 1 foundation: registration, email OTP verification, and the data model for both games plus admin control.

## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and RESEND_API_KEY at minimum
npx prisma migrate dev --name init
npm run dev
```

Visit `http://localhost:3000`.

## What's included in this phase

- `prisma/schema.prisma` — Participant, OtpCode, GameSession (unique per participant+game, enforcing one play), Admin, GameConfig
- `app/page.tsx` — game picker landing page
- `app/register/page.tsx` — registration form → email OTP → verify
- `app/api/register`, `app/api/otp/send`, `app/api/otp/verify` — working endpoints
- `lib/otp.ts` — Resend (email) + Twilio Verify (SMS, optional) helpers
- `lib/validation.ts` — Zod schemas used by every route

## Decisions baked in from our conversation

- OTP is email-first; the SMS path (`sendSmsOtp`/`checkSmsOtp` in `lib/otp.ts`) is wired but not called from the UI yet — wire it in if you decide to require phone verification too.
- "One chance per game" is enforced at the database level via `@@unique([participantId, gameType])` on `GameSession`, not just in application logic.
- Admin override lives on `GameSession.forcedOutcome` (`WIN` / `LOSE` / unset). The game resolution endpoint should always check this field before falling back to a random/default win rate — that logic is next.

## Next phases

1. **Trade Prediction Challenge** — chart animation (lightweight-charts, already in package.json), freeze-frame, Buy/Sell, win/lose reveal, claim code screen
2. **Spin & Win** — wheel component, segment config pulled from `GameConfig`, win/lose reveal
3. **Admin dashboard** — login, participants list, force win/lose per participant/game, winners list, prize claim tracking

## Open questions to confirm before phase 2/3

See the list from our chat — spin wheel segment schedule, target screen size/orientation and touch vs mouse input, whether both games share one registration, and prize inventory caps. These affect the UI and `GameConfig` shape, so worth locking in before building the games.
