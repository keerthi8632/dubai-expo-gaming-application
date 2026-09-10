"use client";

import { useRouter } from "next/navigation";
import { LOGO, HOME_BUTTON, QUIT_BUTTON } from "@/lib/media";

type Props = {
  // Where "Home" goes — defaults to the true landing screen ("/"). Game pages
  // pass the game-selection URL instead, so Home steps back one level (to
  // Trade Prediction/Spin Wheel, keeping the participant) rather than all the
  // way out to Play Now!/Register. "Quit" always goes to "/" regardless, a
  // full reset from anywhere.
  homeHref?: string;
  // Escape hatch for the game-picker screen itself (app/page.tsx): its
  // "gameHome" stage is reached via local state, not a URL change (e.g.
  // straight from a form submit), so the URL can already be "/" — pushing
  // "/" again is then a same-URL no-op that Next won't re-render for. When
  // set, these run instead of navigating, resetting state directly.
  onHome?: () => void;
  onQuit?: () => void;
};

export default function TopBar({ homeHref = "/", onHome, onQuit }: Props) {
  const router = useRouter();
  // Client-side router.push, not a hard window.location navigation — a real
  // page load tears down and recreates the document, which drops the
  // Fullscreen API state (kiosk mode), forcing KioskGuard to wait for
  // another click before it can re-request it. page.tsx's own effect
  // already resets all state back to a clean slate when it lands on "/",
  // so a soft nav gets the same fresh-start result without exiting fullscreen.
  return (
    <div className="flex items-center justify-between px-[64px] py-[80px]">
      <button
        onClick={() => (onHome ? onHome() : router.push(homeHref))}
        className="transition-transform active:scale-95"
      >
        <img src={HOME_BUTTON} alt="Home" className="h-9" />
      </button>
      <img src={LOGO} alt="MH Markets" className="h-10" />
      <button
        onClick={() => (onQuit ? onQuit() : router.push("/"))}
        className="transition-transform active:scale-95"
      >
        <img src={QUIT_BUTTON} alt="Quit" className="h-9" />
      </button>
    </div>
  );
}
