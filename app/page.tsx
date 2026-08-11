"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOGO, TRADE_PREDICTION_BUTTON, SPIN_NOW_BUTTON } from "@/lib/media";
import RegistrationFlow from "@/components/RegistrationFlow";
import CloseButton from "@/components/CloseButton";
import AlphorixForm from "@/components/AlphorixForm";
import VideoBackground from "@/components/VideoBackground";

export default function HomePage() {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState<"TRADE" | "SPIN" | null>(null);
  const [hubspotOpen, setHubspotOpen] = useState(false);

  // TEMPORARY BYPASS (Trade Prediction only): skip the register/OTP/terms modal
  // and jump straight into the game with an auto-created guest participant, via
  // the lightweight /api/guest route (no OTP row, no Resend email call). Spin
  // Now goes through the real RegistrationFlow below.
  async function openGuestBypass(game: "TRADE" | "SPIN") {
    const res = await fetch("/api/guest", { method: "POST" });
    const data = await res.json();
    if (!res.ok) return;
    router.push(`/game/${game.toLowerCase()}?participantId=${data.participantId}&name=${encodeURIComponent("Guest Player")}`);
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <VideoBackground />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1080px] flex-col items-center px-[64px] py-8">
        <img src={LOGO} alt="MH Markets" className="h-8" />

        <div className="mt-10 flex w-full max-w-[600px] flex-col gap-5">
          <button onClick={() => openGuestBypass("TRADE")} className="w-full transition-transform active:scale-95">
            <img src={TRADE_PREDICTION_BUTTON} alt="Trade Prediction" className="w-full" />
          </button>
          <button onClick={() => setActiveGame("SPIN")} className="w-full transition-transform active:scale-95">
            <img src={SPIN_NOW_BUTTON} alt="Spin Wheel" className="w-full" />
          </button>
        </div>

        {/* Decorative hero visual (podium/phone/coins from Figma) — no asset provided yet, export from Figma and drop in public/media to fill this slot */}
        <div className="flex w-full flex-1 flex-col items-center justify-end gap-[72px] pb-[100px]">
          <button
            onClick={() => setHubspotOpen(true)}
            className="flex w-full max-w-[780px] items-center justify-center gap-6 rounded-xl bg-brand-red px-[100px] py-8 transition-transform active:scale-[0.98]"
          >
            <span className="text-center text-[56px] font-bold leading-normal tracking-normal text-[#FFFFFF]">Register</span>
          </button>
          <p className="w-full whitespace-nowrap text-center text-xs font-normal leading-[18px] tracking-normal text-white">
            Disclaimer: Charts are simulated (not live) and are for entertainment purposes only.
          </p>
        </div>
      </div>

      <RegistrationFlow
        game={activeGame ?? "TRADE"}
        open={activeGame !== null}
        onClose={() => setActiveGame(null)}
        onComplete={(participantId, fullName) =>
          router.push(
            `/game/${(activeGame ?? "TRADE").toLowerCase()}?participantId=${participantId}&name=${encodeURIComponent(fullName)}`
          )
        }
      />

      {/* Kept mounted at all times (never unmounted) so the iframe starts loading as soon as
          the home page opens — toggling visibility here is instant instead of waiting on a
          fresh network load each time the user clicks Register. */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 transition-opacity duration-200 ${
          hubspotOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setHubspotOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white text-black"
        >
          <CloseButton onClose={() => setHubspotOpen(false)} />
          <AlphorixForm formId="dd0d6556f7d7" />
        </div>
      </div>
    </main>
  );
}
