"use client";

import { useState } from "react";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import { PREDICTION_FORM_BANNER, SPIN_FORM_BANNER, ARROW_ICON } from "@/lib/media";
import CloseButton from "./CloseButton";
import FlagSelect from "./FlagSelect";

type Props = {
  game: "TRADE" | "SPIN";
  onSubmitted: (participantId: string, fullName: string) => void;
  onClose?: () => void;
};

const COPY: Record<"TRADE" | "SPIN", { title: string; subtitle: string; banner: string }> = {
  TRADE: {
    title: "Trade Prediction Challenge",
    subtitle: "Watch the chart move, freeze it at your moment",
    banner: PREDICTION_FORM_BANNER,
  },
  SPIN: {
    title: "Spin & Win",
    subtitle: "Enter your details to unlock your spin.",
    banner: SPIN_FORM_BANNER,
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"firstName" | "email" | "phone" | "country" | "otp", string>>;

export default function RegisterModal({ game, onSubmitted, onClose }: Props) {
  const copy = COPY[game];
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneIso2, setPhoneIso2] = useState(DEFAULT_COUNTRY.iso2);
  const [residenceIso2, setResidenceIso2] = useState("");
  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Once set, the code field appears and this participant's OTP has been sent.
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const phoneCountry = COUNTRIES.find((c) => c.iso2 === phoneIso2) ?? DEFAULT_COUNTRY;
  const residenceCountry = COUNTRIES.find((c) => c.iso2 === residenceIso2);
  const otpSent = participantId !== null;

  function validateAllFields(): FieldErrors {
    const errors: FieldErrors = {};
    if (firstName.trim().length < 2) errors.firstName = "Enter your first name.";
    if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
    if (phone.trim().length < 5) errors.phone = "Enter a valid phone number.";
    if (!residenceIso2) errors.country = "Select your country.";
    return errors;
  }

  // Send OTP only cares about the email being valid — first name, phone, and
  // country are validated later, when Register Now is clicked.
  async function sendOtp() {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setFieldErrors((prev) => ({ ...prev, email: "Enter a valid email address." }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, email: undefined }));

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: firstName.trim() || "Guest",
          email,
          phone: phone.trim() || "0000000000",
          countryCode: phoneCountry.dialCode,
          countryOfResidence: residenceCountry?.name ?? "Pending",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? "Could not send code");
      setParticipantId(data.participantId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!participantId) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      if (!res.ok) throw new Error("Could not resend code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  // Register Now is a separate action from Send OTP: it validates every field
  // plus the code, saves the real details (without re-triggering a new OTP
  // email), then verifies the code the user already received.
  async function handleRegisterNow() {
    setError(null);
    if (!otpSent) {
      setError("Send the verification code to your email first.");
      return;
    }

    const errors = validateAllFields();
    if (otp.trim().length !== 6) errors.otp = "Enter the 6-digit code.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const updateRes = await fetch("/api/participant/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          fullName: `${firstName} ${lastName}`.trim(),
          phone,
          countryCode: phoneCountry.dialCode,
          countryOfResidence: residenceCountry?.name ?? "",
        }),
      });
      if (!updateRes.ok) throw new Error("Could not save your details");

      const verifyRes = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, code: otp, channel: "email" }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error ?? "Verification failed");
      onSubmitted(participantId as string, `${firstName} ${lastName}`.trim());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-[620px] max-w-full">
      <div className="flex flex-col items-center gap-6 overflow-hidden rounded-[28px] bg-white">
        <div className="relative w-full">
          <img src={copy.banner} alt="" className="h-[296px] w-full object-cover" />
          <CloseButton onClose={onClose} className="right-4 top-4" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegisterNow();
          }}
          className="flex w-full flex-col gap-12 bg-white"
        >
          <div className="flex flex-col items-center justify-center self-stretch pt-6">
            <span className="text-center text-[30px] font-bold text-[#d81618]">{copy.title}</span>
            <div className="flex h-[30px] w-full max-w-[392px] flex-col items-center pt-2">
              <span className="text-center text-[14px] font-normal leading-[21.75px] text-[#70757e]">{copy.subtitle}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 self-stretch px-8">
            <Field label="First Name" required error={fieldErrors.firstName}>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className={inputClass}
              />
            </Field>

            <Field label="Last Name">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className={inputClass}
              />
            </Field>

            <Field label="Email" required error={fieldErrors.email}>
              <div className="flex gap-4 self-stretch">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your Email Here"
                  disabled={otpSent}
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading || otpSent}
                  className="h-12 shrink-0 whitespace-nowrap rounded-lg bg-[#d81618] px-4 text-[14px] font-bold text-white disabled:opacity-60"
                >
                  {loading && !otpSent ? "Sending…" : otpSent ? "Code Sent" : "Send OTP"}
                </button>
              </div>
            </Field>

            {otpSent && (
              <Field label="Enter Verification Code" required error={fieldErrors.otp}>
                <div className="flex items-center gap-4 self-stretch">
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    className={`${inputClass} flex-1 tracking-widest`}
                  />
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={resending}
                    className="shrink-0 whitespace-nowrap text-[14px] font-semibold text-[#d81618] underline disabled:opacity-60"
                  >
                    {resending ? "Resending…" : "Resend"}
                  </button>
                </div>
              </Field>
            )}

            <Field label="Phone Number" required error={fieldErrors.phone}>
              <div className="flex gap-4 self-stretch">
                <FlagSelect
                  className="w-30 shrink-0"
                  value={phoneIso2}
                  onChange={setPhoneIso2}
                  options={COUNTRIES.map((c) => ({ iso2: c.iso2, value: c.iso2, label: c.dialCode }))}
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your Phone Number Here"
                  className={`${inputClass} flex-1`}
                />
              </div>
            </Field>

            <Field label="Country" required error={fieldErrors.country}>
              <FlagSelect
                value={residenceIso2}
                onChange={setResidenceIso2}
                placeholder="Choose Your Country"
                options={COUNTRIES.map((c) => ({ iso2: c.iso2, value: c.iso2, label: c.name }))}
              />
            </Field>
          </div>
          <div className="h-4" />

          {error && <p className="px-8 text-xs text-red-600">{error}</p>}

          <div className="flex flex-col self-stretch bg-white px-8 pb-[26px] pt-[18px]">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-[14px] bg-[#d81618] px-4 py-[18px] disabled:opacity-60"
            >
              <span className="text-center text-[16px] font-bold text-white">
                {loading ? (otpSent ? "Verifying…" : "Sending code…") : otpSent ? "Verify & Continue" : "Register Now"}
              </span>
              {!loading && <img src={ARROW_ICON} alt="" className="h-4 w-4" />}
            </button>
            <p className="flex h-[41px] flex-col items-center justify-center pb-3 pt-3.5 text-center text-[12px] leading-[18px] text-gray-500">
              By submitting, you agree we may contact you about our services.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base font-normal leading-6 text-black">
        {label}
        {required && <span className="text-[#d81618]">*</span>}
      </span>
      {children}
      {error && <span className="text-xs text-[#d81618]">{error}</span>}
    </label>
  );
}

const inputClass =
  "h-12 w-full rounded-lg border border-black/20 px-4 text-[14px] font-normal leading-[21px] text-black placeholder:text-black/50 disabled:bg-black/5 disabled:text-black/40";
