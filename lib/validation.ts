import { z } from "zod";

// National number only (country code is captured separately) — digits only,
// no leading zero, 7-15 digits per the ITU E.164 national-number length range.
export const PHONE_RE = /^[1-9][0-9]{6,14}$/;
const phoneField = z.string().regex(PHONE_RE, "Enter a valid phone number.");

export const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: phoneField,
  countryCode: z.string().min(1).max(5),
  countryOfResidence: z.string().min(2).max(60),
  doesTrade: z.boolean().optional(),
  language: z.enum(["ENGLISH", "ARABIC"]).default("ENGLISH"),
  game: z.enum(["TRADE", "SPIN"]).optional(),
});

export const updateParticipantSchema = z.object({
  participantId: z.string().cuid(),
  fullName: z.string().min(2).max(100),
  phone: phoneField,
  countryCode: z.string().min(1).max(5),
  countryOfResidence: z.string().min(2).max(60),
});

export const verifyOtpSchema = z.object({
  participantId: z.string().cuid(),
  code: z.string().length(6),
  channel: z.enum(["email", "sms"]),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const setOutcomeSchema = z.object({
  participantId: z.string().cuid(),
  gameType: z.enum(["TRADE", "SPIN"]),
  forcedOutcome: z.enum(["WIN", "LOSE"]).nullable(),
});

export const spinSegmentsSchema = z
  .array(
    z
      .object({
        label: z.string().min(1).max(80),
        weight: z.number().positive(),
        prize: z.string().min(1).max(80).nullable(),
        isSpinAgain: z.boolean().optional(),
        dailyQueueCount: z.number().int().min(0).max(500).optional(),
      })
      .refine((s) => !s.isSpinAgain || s.prize === null, {
        message: "A Spin Again segment can't also have a prize",
        path: ["prize"],
      })
      // Guards against the label and the actual behavior silently
      // disagreeing — a segment named "Spin Again" with the checkbox left
      // unchecked renders the "Spin Again" wedge on the wheel but resolves
      // as a genuine loss, which is confusing to spot without this check.
      .refine((s) => s.isSpinAgain || !/spin\s*again/i.test(s.label), {
        message:
          "This label reads like a Spin Again segment, but the Spin Again checkbox isn't checked. Check it, or rename the label if it's meant to be a real loss.",
        path: ["isSpinAgain"],
      })
  )
  .min(2, "Need at least 2 segments");

// Duplicated (not imported) from lib/spinPrizeLimits.ts's JACKPOT_PRIZE_LABEL
// — that module pulls in the Prisma client, and this file is imported by the
// client component RegisterModal.tsx, so importing it here would leak
// Prisma into the browser bundle.
const JACKPOT_PRIZE_LABEL = "USD 1,000 Funded Account";

export const spinQueueSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  queue: z
    .array(z.string().min(1).max(80))
    .min(1, "Queue can't be empty")
    // Only one physical jackpot unit exists for the whole event — a queue
    // can never schedule it more than once, regardless of how it got added
    // (manual "+ Add to Queue" clicks, a misconfigured Daily Qty, etc).
    .refine((queue) => queue.filter((p) => p === JACKPOT_PRIZE_LABEL).length <= 1, {
      message: "The Grand Prize / Jackpot can only appear once in the queue — it's a single prize for the whole event.",
    }),
});
