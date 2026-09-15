"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import VideoBackground from "@/components/VideoBackground";

type Winner = {
  id: string;
  gameType: "TRADE" | "SPIN";
  prizeLabel: string | null;
  completedAt: string | null;
  firstName: string;
};

const GAME_LABEL: Record<Winner["gameType"], string> = {
  TRADE: "Trade Prediction",
  SPIN: "Spin & Win",
};

const GAME_ICON: Record<Winner["gameType"], string> = {
  TRADE: "📈",
  SPIN: "🎡",
};

const POLL_MS = 60000;

function isJackpot(prizeLabel: string | null): boolean {
  return !!prizeLabel && /1,?000/.test(prizeLabel);
}

export default function LeaderboardPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    function load() {
      fetch("/api/leaderboard")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.winners)) setWinners(data.winners);
          setPulse(true);
          setTimeout(() => setPulse(false), 600);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // Chronological — the day's first winner leads the board, newest joins at the bottom.
  const ordered = winners;

  return (
    <main className="relative flex min-h-screen h-[100dvh] flex-col items-center overflow-y-auto overflow-x-hidden">
      <VideoBackground  blurred/>
      <div className="w-full">
        <TopBar />
      </div>

      <div className="flex flex-col items-center">
        <h1
          className="font-orbitron text-center text-[36px] font-black tracking-wide text-white sm:text-[52px]"
          style={{ textShadow: "0 0 30px rgba(179,18,23,0.55), 0 0 60px rgba(179,18,23,0.25)" }}
        >
          🏆 Today&apos;s Winners
        </h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-white/50">
          <span className={`h-2 w-2 rounded-full bg-[#34c759] ${pulse ? "animate-ping" : ""}`} />
          <span>Live &mdash; updates automatically</span>
        </div>
      </div>

      <div className="mt-10 w-full max-w-2xl flex-1 px-6 pb-16">
        {loading ? (
          <p className="text-center text-white/60">Loading…</p>
        ) : ordered.length === 0 ? (
          <div className="mt-10 text-center text-white/50">
            <p className="text-4xl">🎯</p>
            <p className="mt-3">No winners yet today &mdash; the board is waiting for its first champion!</p>
          </div>
        ) : (
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {ordered.map((w, i) => {
                const rank = i + 1;
                const jackpot = isJackpot(w.prizeLabel);
                return (
                  <motion.li
                    key={w.id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className={`flex items-center gap-4 rounded-2xl border px-5 py-4 backdrop-blur-md ${
                      jackpot
                        ? "border-[#FFD700]/50 bg-gradient-to-r from-[#3a2a05]/70 via-[#B31217]/30 to-[#3a2a05]/70"
                        : "border-white/10 bg-white/[0.07]"
                    }`}
                  >
                    <span className="font-orbitron w-10 shrink-0 text-center text-2xl font-black text-white/80">
                      {rank}
                    </span>

                    <span className="text-2xl shrink-0">{GAME_ICON[w.gameType]}</span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold text-white sm:text-xl">{w.firstName}</p>
                      <p className="truncate text-xs uppercase tracking-wide text-white/50 sm:text-sm">
                        {GAME_LABEL[w.gameType]}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      {jackpot && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#FFD700]">Jackpot</p>
                      )}
                      <p
                        className={`text-sm font-bold sm:text-base ${
                          jackpot ? "text-[#FFD700]" : "text-[#34c759]"
                        }`}
                      >
                        {w.prizeLabel}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </main>
  );
}
