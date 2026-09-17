"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import VideoBackground from "@/components/VideoBackground";
import DatePicker from "@/components/DatePicker";

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

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function LeaderboardPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  // Empty = today (the default live view). Set once the visitor picks a
  // different date — polling is skipped for a past day since it's a fixed,
  // already-final list, not something that needs refreshing every minute.
  const [dateFilter, setDateFilter] = useState("");
  const isToday = !dateFilter || dateFilter === todayKey();

  useEffect(() => {
    function load() {
      const params = dateFilter ? `?date=${dateFilter}` : "";
      fetch(`/api/leaderboard${params}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.winners)) setWinners(data.winners);
          setPulse(true);
          setTimeout(() => setPulse(false), 600);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    setLoading(true);
    load();
    if (!isToday) return;
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [dateFilter, isToday]);

  // Chronological — the day's first winner leads the board, newest joins at the bottom.
  const ordered = winners;

  return (
    <main className="relative flex min-h-screen h-[100dvh] flex-col items-center overflow-y-auto overflow-x-hidden">
      <VideoBackground  blurred/>
      <div className="w-full">
        <TopBar hideQuit />
      </div>

      <div className="flex flex-col items-center">
        <h1
          className="font-orbitron text-center text-[36px] font-black tracking-wide text-white sm:text-[52px]"
          style={{ textShadow: "0 0 30px rgba(179,18,23,0.55), 0 0 60px rgba(179,18,23,0.25)" }}
        >
          🏆 {isToday ? "Today's" : "That Day's"} Winners
        </h1>
        {isToday ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-white/50">
            <span className={`h-2 w-2 rounded-full bg-[#34c759] ${pulse ? "animate-ping" : ""}`} />
            <span>Live &mdash; updates automatically</span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/50">Viewing a past day &mdash; not live</p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <DatePicker
            theme="dark"
            value={dateFilter || todayKey()}
            max={todayKey()}
            onChange={(v) => setDateFilter(v === todayKey() ? "" : v)}
          />
          {!isToday && (
            <button
              onClick={() => setDateFilter("")}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
            >
              Today
            </button>
          )}
        </div>
      </div>

      <div className="mt-10 w-full max-w-2xl flex-1 px-6 pb-16">
        {loading ? (
          <p className="text-center text-white/60">Loading…</p>
        ) : ordered.length === 0 ? (
          <div className="mt-10 text-center text-white/50">
            <p className="text-4xl">🎯</p>
            <p className="mt-3">
              {isToday
                ? "No winners yet today — the board is waiting for its first champion!"
                : "No winners were recorded on this day."}
            </p>
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
