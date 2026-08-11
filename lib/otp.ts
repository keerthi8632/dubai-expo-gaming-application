import twilio from "twilio";
import { resend, RESEND_FROM } from "./resend";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES ?? 5);

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

export async function sendEmailOtp(toEmail: string, code: string) {
  // The Resend SDK returns { data, error } instead of throwing on failure —
  // without this check, a failed send (e.g. sandbox sender restrictions)
  // silently looks like success.
  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: toEmail,
    subject: "Your MH Markets verification code",
    html: `<p>Your verification code is <strong>${code}</strong>. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
  });
  if (error) throw new Error(error.message ?? "Failed to send verification email");
  return data;
}

// Optional: only needed if you decide to support SMS OTP alongside email.
// Uses Twilio Verify so you don't have to manage your own SMS code storage for this channel.
export async function sendSmsOtp(toPhoneE164: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID as string)
    .verifications.create({ to: toPhoneE164, channel: "sms" });
}

export async function checkSmsOtp(toPhoneE164: string, code: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const result = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID as string)
    .verificationChecks.create({ to: toPhoneE164, code });
  return result.status === "approved";
}
