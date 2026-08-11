import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(5).max(20),
  countryCode: z.string().min(1).max(5),
  countryOfResidence: z.string().min(2).max(60),
  doesTrade: z.boolean().optional(),
  language: z.enum(["ENGLISH", "ARABIC"]).default("ENGLISH"),
});

export const updateParticipantSchema = z.object({
  participantId: z.string().cuid(),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(5).max(20),
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
