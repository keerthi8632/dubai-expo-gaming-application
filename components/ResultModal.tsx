"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { CONFETTI_LOTTIE } from "@/lib/media";
import { FUNDED_ACCOUNT_TERMS } from "@/lib/termsCopy";
import Modal from "./Modal";
import TermsModal from "./TermsModal";

type Props = {
  game: "TRADE" | "SPIN";
  participantId: string;
  won: boolean;
  icon: string;
  badge?: string;
  title: string;
  subtitle: ReactNode;
  detail?: ReactNode;
  note?: string;
  // Shows a "T&Cs Apply" link that opens the dedicated Funded Account terms
  // (TermsModal in info mode, FUNDED_ACCOUNT_TERMS copy) — used for the
  // Spin & Win funded-account win case.
  showFundedAccountTerms?: boolean;
  // One entry per game, only two games exist — hide "Play Another Game" once
  // the other game is already played, since there's nothing left to play.
  showPlayAnother?: boolean;
  redirectSeconds?: number;
};

const TOP_SECTION_HEIGHT = 190; // spans from the card's top edge down through the icon

export default function ResultModal({
  game,
  participantId,
  won,
  icon,
  badge,
  title,
  subtitle,
  detail,
  note,
  showFundedAccountTerms,
  showPlayAnother = true,
  redirectSeconds = 60,
}: Props) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(redirectSeconds);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    if (termsOpen) return; // don't redirect home while they're reading the T&Cs
    if (secondsLeft <= 0) {
      router.push("/");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, router, termsOpen]);

  return (
    <div className="-translate-y-[50%] flex w-[500px] max-w-[400px] flex-col items-center gap-2 overflow-hidden rounded-[28px] bg-white">
      <div className="relative flex w-full flex-col items-center gap-2 pt-8">
        {won && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
            style={{ height: TOP_SECTION_HEIGHT }}
          >
            <DotLottieReact src={CONFETTI_LOTTIE} autoplay loop style={{ width: "100%", height: "100%" }} />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center gap-2">
          {badge && (
            <div className="flex items-center gap-[7px] rounded-[999px] bg-[#00c48c]/15 px-3.5 py-[7px]">
              <span className="text-center text-[12px] font-normal text-[#34c759]">{badge}</span>
            </div>
          )}

          <img src={icon} alt="" className="h-[100px] w-[100px] shrink-0" style={{ aspectRatio: "1/1" }} />
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-2 px-8 pb-8">
        <div className="flex h-[59px] w-full flex-col items-center pt-[18px]">
          <span className={`text-center text-[30px] font-bold ${won ? "text-[#34c759]" : "text-[#ff3b30]"}`}>{title}</span>
        </div>

        <div className="flex min-h-[30px] w-full flex-col items-center pt-2">
          <span className="text-center text-[14px] font-normal leading-[21.75px] text-[#70757e]">{subtitle}</span>
        </div>

        {detail && <div className="w-full pt-2">{detail}</div>}

        <div className="flex w-full flex-col gap-2.5 self-stretch pt-9">
          {showPlayAnother && (
            <button
              onClick={() => router.push(`/?stage=gameHome&played=${game}&participantId=${participantId}`)}
              className="flex items-center justify-center gap-4 self-stretch rounded-[14px] bg-black p-4"
            >
              <span className="text-center text-[16px] font-bold text-white">Play Another Game</span>
            </button>
          )}
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-4 self-stretch rounded-[14px] bg-[#F5F6F8] p-4"
          >
            <span className="text-center text-[16px] font-bold text-black">Exit</span>
          </button>
        </div>

        <div className="flex h-[41px] w-full flex-col items-center pt-3.5 pb-3">
          <span className="text-center text-[12px] font-normal text-[#9aa0ab]">Returning to home in {secondsLeft}s…</span>
        </div>

        {note && <p className="text-center text-sm text-[#70757e]">{note}</p>}
        {showFundedAccountTerms && (
          <button
            onClick={() => setTermsOpen(true)}
            className="text-center text-xs font-semibold text-[#70757e] underline underline-offset-2"
          >
            T&amp;Cs Apply
          </button>
        )}
      </div>

      {showFundedAccountTerms && (
        <Modal open={termsOpen} onClose={() => setTermsOpen(false)} dismissible contentClassName="w-full max-w-[620px]">
          <TermsModal mode="info" copy={FUNDED_ACCOUNT_TERMS} onClose={() => setTermsOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
