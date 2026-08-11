"use client";

import { useState } from "react";
import Button from "./Button";
import CloseButton from "./CloseButton";

type Props = {
  participantId: string;
  onVerified: () => void;
  onClose?: () => void;
};

export default function OtpModal({ participantId, onVerified, onClose }: Props) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, code: otp, channel: "email" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      onVerified();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      if (!res.ok) throw new Error("Could not resend code");
      setResent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="relative rounded-2xl bg-white p-6 text-center text-black">
      <CloseButton onClose={onClose} />
      <h2 className="font-semibold text-brand-red">Enter Verification Code</h2>
      <p className="mt-1 text-xs text-black/60">Sent to your email address.</p>
      <form onSubmit={handleVerify} className="mt-4 space-y-3">
        <input
          required
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="6-digit code"
          className="w-full rounded-lg border px-3 py-2 text-center text-sm tracking-widest"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full py-2.5">
          {loading ? "Verifying…" : "Verify & Continue"}
        </Button>
      </form>
      <button onClick={handleResend} disabled={resending} className="mt-3 text-xs text-black/50 underline">
        {resent ? "Code resent" : resending ? "Resending…" : "Resend code"}
      </button>
    </div>
  );
}
