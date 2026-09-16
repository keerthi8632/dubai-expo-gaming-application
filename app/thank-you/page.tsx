"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LOGO } from "@/lib/media";

// Alphorix's "Thank-you URL" setting points here after a successful form
// submission, with the lead's fields appended as query params (first_name/
// last_name/email/phone/country — confirmed from a real submission, see
// TASKS.md). Shows a brief confirmation (matching the main site's thank-you
// copy) and then hands the data back to our own app:
// - if it loaded inside the AlphorixForm iframe, postMessage it to the
//   parent window so page.tsx can close the modal and continue, no reload.
// - if it ever loads at the top level instead (redirect breaks out of the
//   iframe), fall back to a normal client-side redirect carrying the same
//   fields as query params.
// NOTE: AlphorixForm.tsx's "uncertain submission" grace period (currently
// 3500ms) must stay longer than this delay — it exists specifically to wait
// out this page's own postMessage, so bumping this without bumping that back
// out would bring back the "Try Again" flash over this very confirmation.
const AUTO_CONTINUE_DELAY_MS = 4500;

export default function ThankYouPage() {
  return (
    <Suspense>
      <ThankYouInner />
    </Suspense>
  );
}

function ThankYouInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const firstName = searchParams.get("first_name") ?? undefined;
    const lastName = searchParams.get("last_name") ?? undefined;
    const email = searchParams.get("email") ?? undefined;
    const phone = searchParams.get("phone") ?? undefined;

    const timer = setTimeout(() => {
      if (window.parent !== window.self) {
        window.parent.postMessage(
          { type: "alphorix-thank-you", firstName, lastName, email, phone },
          window.location.origin
        );
        return;
      }

      const params = new URLSearchParams({ stage: "gameHome" });
      if (firstName) params.set("firstName", firstName);
      if (lastName) params.set("lastName", lastName);
      if (email) params.set("email", email);
      if (phone) params.set("phone", phone);
      router.replace(`/?${params.toString()}`);
    }, AUTO_CONTINUE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      <img
        src="/media/background/navbar.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <img
        src="/media/background/Glow.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <img src={LOGO} alt="MH Markets" className="absolute top-8 h-8" />

      <div className="relative z-10 mx-auto max-w-2xl px-10 text-center text-white">
        <h1
          className="font-normal"
          style={{ fontFamily: "var(--font-inter)", fontSize: 42.27, lineHeight: "100%", letterSpacing: 0 }}
        >
          Thank you for connecting with <span className="font-bold">MH Markets.</span>
          <br />
          <br />
          <span className="font-bold">Your Registration is complete!</span>
        </h1>
        {/* <p className="mt-8 text-base text-white/70">Taking you to your game...</p> */}
      </div>

   
    </main>
  );
}
