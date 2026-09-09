"use client";

import { useRouter } from "next/navigation";
import { LOGO, HOME_BUTTON, QUIT_BUTTON } from "@/lib/media";

export default function TopBar() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between px-[64px] py-[80px]">
      <button onClick={() => router.push("/")} className="transition-transform active:scale-95">
        <img src={HOME_BUTTON} alt="Home" className="h-9" />
      </button>
      <img src={LOGO} alt="MH Markets" className="h-10" />
      <button onClick={() => router.push("/")} className="transition-transform active:scale-95">
        <img src={QUIT_BUTTON} alt="Quit" className="h-9" />
      </button>
    </div>
  );
}
