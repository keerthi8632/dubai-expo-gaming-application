"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AlreadyRegisteredModal({
  redirectSeconds = 10,
  // Resets the whole app/page.tsx stage back to a fresh first-visit state
  // (not just closing this modal) — a plain router.push("/") from here is a
  // same-URL no-op since this modal only ever shows while already on "/",
  // which is why "Back to Home" used to look like it did nothing.
  onQuit,
}: {
  redirectSeconds?: number;
  onQuit: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(redirectSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onQuit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  return (
    <motion.div
      initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 14 }}
      className="relative flex w-[420px] max-w-full flex-col items-center gap-3 overflow-hidden rounded-[28px] border-4 border-[#ffd400] bg-gradient-to-b from-[#2a0606] to-black p-8 text-center shadow-[0_0_60px_rgba(255,59,68,0.5)]"
    >
      <motion.div
        animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
        className="text-6xl"
      >
        🙌
      </motion.div>

      <h2 className="text-[32px] font-black uppercase tracking-wide text-[#ffd400] [text-shadow:0_0_16px_rgba(255,212,0,0.7)]">
        Already registered!
      </h2>

      <p className="text-[15px] font-semibold text-white">Looks like you've already joined the event. 🎯</p>
      <p className="text-[13px] text-white/60">One registration per player — no do-overs, no cheat codes.</p>

      <button
        onClick={onQuit}
        className="mt-3 w-full rounded-[14px] bg-[#ffd400] py-3 text-[16px] font-black uppercase text-black transition-transform active:scale-95"
      >
        Quit
      </button>
      <p className="text-[11px] text-white/40">Whisking you home in {secondsLeft}s…</p>
    </motion.div>
  );
}
