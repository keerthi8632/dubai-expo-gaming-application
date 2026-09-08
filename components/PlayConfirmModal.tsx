"use client";

import { motion } from "framer-motion";

// Shown after someone registers via the standalone "Register" button (as
// opposed to "Play Now!") — those leads may only want to be on the mailing
// list/leaderboard and never intend to play, so we ask explicitly instead of
// dropping them straight into the game picker. "Cancel" (not "Maybe Later")
// because Alphorix itself won't let an already-registered lead resubmit the
// form — clicking Play Now later reopens the same form, which would just
// reject them, so there's no real "come back and register later" path to
// imply.
export default function PlayConfirmModal({ onPlay, onLater }: { onPlay: () => void; onLater: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 14 }}
      className="relative flex w-[420px] max-w-full flex-col items-center gap-3 overflow-hidden rounded-[28px] border-4 border-brand-red bg-gradient-to-b from-[#3a0508] via-[#1a0203] to-black p-8 text-center shadow-[0_0_60px_rgba(179,18,23,0.6)]"
    >
      <div className="text-6xl">🎉</div>

      <h2 className="text-[32px] font-black uppercase tracking-wide text-white [text-shadow:0_0_16px_rgba(179,18,23,0.9)]">
        You're in!
      </h2>

      <p className="text-[15px] font-semibold text-white">Registration complete. Want to play a game now?</p>

      <div className="mt-3 flex w-full gap-3">
        <button
          onClick={onLater}
          className="flex-1 rounded-[14px] border border-white/20 bg-white/5 py-3 text-[14px] font-black uppercase text-white transition-transform active:scale-95"
        >
          Cancel
        </button>
        <button
          onClick={onPlay}
          className="flex-1 rounded-[14px] bg-brand-red py-3 text-[14px] font-black uppercase text-white shadow-[0_0_20px_rgba(179,18,23,0.7)] transition-transform active:scale-95"
        >
          Play Now
        </button>
      </div>
    </motion.div>
  );
}
