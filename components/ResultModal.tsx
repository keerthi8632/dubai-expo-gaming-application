"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { CONFETTI_LOTTIE } from "@/lib/media";

type Props = {
  won: boolean;
  icon: string;
  badge?: string;
  title: string;
  subtitle: ReactNode;
  detail?: ReactNode;
  note?: string;
  redirectSeconds?: number;
};

const TOP_SECTION_HEIGHT = 190; // spans from the card's top edge down through the icon

export default function ResultModal({ won, icon, badge, title, subtitle, detail, note, redirectSeconds = 60 }: Props) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(redirectSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.push("/");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, router]);

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
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-4 self-stretch rounded-[14px] bg-black p-4"
          >
            <span className="text-center text-[16px] font-bold text-white">Back to Home</span>
          </button>
        </div>

        <div className="flex h-[41px] w-full flex-col items-center pt-3.5 pb-3">
          <span className="text-center text-[12px] font-normal text-[#9aa0ab]">Returning to home in {secondsLeft}s…</span>
        </div>

        {note && <p className="text-center text-sm text-[#70757e]">{note}</p>}
      </div>
    </div>
  );
}
