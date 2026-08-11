"use client";

import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

// Matches the Figma "Spin Now / Trade Prediction" button exactly:
// a black outer bezel (thin red border, tiny white corner dots) wrapping a red
// gradient plate with a thin red-glow border, protruding tab-clips on its left/right
// edges, and thin accent marks at each of its 4 corners.
export default function PanelButton({ className, children, ...props }: Props) {
  return (
    <div
      className={clsx(
        "relative flex items-center justify-center rounded-[9px] border-[0.5625px] border-solid border-[#ff3b44] bg-black p-[27px]",
        className
      )}
    >
      {/* outer bezel corner dots */}
      <span className="absolute left-[6px] top-[6px] h-[3.375px] w-[3.375px] bg-white" />
      <span className="absolute right-[6px] top-[6px] h-[3.375px] w-[3.375px] bg-white" />
      <span className="absolute bottom-[6px] left-[6px] h-[3.375px] w-[3.375px] bg-white" />
      <span className="absolute bottom-[6px] right-[6px] h-[3.375px] w-[3.375px] bg-white" />

      <button
        {...props}
        className="relative flex items-center justify-center gap-[13.5px] self-stretch rounded-[7.875px] border-[1.125px] border-solid border-[#ff3b44] bg-gradient-to-b from-[#9b050b] to-[#4a0205] px-[56.25px] py-[18px] shadow-[0px_0px_9px_0px_rgba(255,59,68,0.33)] transition-transform active:scale-[0.97]"
      >
        {/* left edge tab */}
        <span className="absolute left-0 top-1/2 h-[13.5px] w-[6.75px] -translate-x-1/2 -translate-y-1/2 rounded-bl-[2.25px] rounded-tl-[2.25px] border-b-[1.125px] border-l-[1.125px] border-t-[1.125px] border-solid border-[#ff3b44] bg-[#622729]" />
        {/* right edge tab */}
        <span className="absolute right-0 top-1/2 h-[13.5px] w-[6.75px] -translate-y-1/2 translate-x-1/2 rounded-br-[2.25px] rounded-tr-[2.25px] border-b-[1.125px] border-r-[1.125px] border-t-[1.125px] border-solid border-[#ff3b44] bg-[#622729]" />

        {/* corner accent dots */}
        <span className="absolute left-[6px] top-[6px] h-[3.375px] w-[3.375px] bg-white" />
        <span className="absolute right-[6px] top-[6px] h-[3.375px] w-[3.375px] bg-white" />
        <span className="absolute bottom-[6px] left-[6px] h-[3.375px] w-[3.375px] bg-white" />
        <span className="absolute bottom-[6px] right-[6px] h-[3.375px] w-[3.375px] bg-white" />

        <span className="whitespace-nowrap text-center text-[18px] font-black text-white">{children}</span>
      </button>
    </div>
  );
}
