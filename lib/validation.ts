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
  )
  .min(2, "Need at least 2 segments");

export const spinQueueSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  queue: z.array(z.string().min(1).max(80)).min(1, "Queue can't be empty"),
});
