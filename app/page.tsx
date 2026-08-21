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

  // TEMPORARY BYPASS (both games): skip the register/OTP/terms modal and jump
  // straight into the game with an auto-created guest participant, via the
  // lightweight /api/guest route (no OTP row, no Resend email call).
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

        <div className="mx-auto mt-10 flex w-full max-w-[600px] flex-col gap-5 lg:max-w-[360px] lg:gap-3">
          <button onClick={() => openGuestBypass("TRADE")} className="w-full transition-transform active:scale-95">
            <img src={TRADE_PREDICTION_BUTTON} alt="Trade Prediction" className="w-full" />
          </button>
          <button onClick={() => openGuestBypass("SPIN")} className="w-full transition-transform active:scale-95">
            <img src={SPIN_NOW_BUTTON} alt="Spin Wheel" className="w-full" />
          </button>
        </div>

        {/* Decorative hero visual (podium/phone/coins from Figma) — no asset provided yet, export from Figma and drop in public/media to fill this slot */}
        {/* Above the kiosk breakpoint (>1080px) this just fills remaining
            height and sits at the bottom via justify-end, as before. At or
            below 1080px it's pulled out of flow and fixed to the literal
            bottom of the screen so it can't drift with content height above. */}
        <div className="w-full flex-1 desktop:flex desktop:flex-col desktop:items-center desktop:justify-end desktop:gap-[72px] desktop:pb-[30px]">
          <div className="fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-[72px] px-[64px] pb-8 desktop:static desktop:z-auto desktop:contents desktop:px-0 desktop:pb-0">
            <button
              onClick={() => setHubspotOpen(true)}
              className="mx-auto flex w-full max-w-[420px] items-center justify-center gap-3 rounded-xl bg-brand-red px-12 py-4 transition-transform active:scale-[0.98] desktop:max-w-[360px] desktop:gap-3 desktop:px-10 desktop:py-4"
            >
              <span className="text-center text-[28px] font-bold leading-normal tracking-normal text-[#FFFFFF] desktop:text-2xl">
                Register
              </span>
            </button>
            <p className="w-full whitespace-nowrap text-center text-xs font-normal leading-[18px] tracking-normal text-white">
              Disclaimer: Charts are simulated (not live) and are for entertainment purposes only.
            </p>
          </div>
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
          className="no-scrollbar relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white text-black"
        >
          <CloseButton onClose={() => setHubspotOpen(false)} />
          <AlphorixForm formId="dd0d6556f7d7" onSubmitted={() => setHubspotOpen(false)} />
        </div>
      </div>
    </main>
  );
}
