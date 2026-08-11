"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import TopBar from "@/components/TopBar";
import PlayerBadge from "@/components/PlayerBadge";
import ResultModal from "@/components/ResultModal";
import AlreadyPlayedModal from "@/components/AlreadyPlayedModal";
import Modal from "@/components/Modal";
import VideoBackground from "@/components/VideoBackground";
import { SPIN_SEGMENTS, SEGMENT_ANGLE, segmentCenterAngle } from "@/lib/spinSegments";
import { SPIN_WHEEL_BORDER, SPIN_NOW_BUTTON, WON_ICON, BETTER_LUCK_ICON } from "@/lib/media";

const SPINS = 5;
const WHEEL_SIZE = 953.297;
const BORDER_ROTATION_DEG = 0; // tweak this to nudge the border ring's light pattern

function wheelBackground() {
  const stops = SPIN_SEGMENTS.map((_, i) => {
    const color = i % 2 === 0 ? "#ffffff" : "#B31217";
    const from = i * SEGMENT_ANGLE;
    const to = (i + 1) * SEGMENT_ANGLE;
    return `${color} ${from}deg ${to}deg`;
  }).join(", ");
  return `conic-gradient(from -${SEGMENT_ANGLE / 2}deg, ${stops})`;
}

function labelPosition(index: number, radiusFraction: number) {
  const angle = (segmentCenterAngle(index) * Math.PI) / 180;
  const x = radiusFraction * 50 * Math.sin(angle);
  const y = -radiusFraction * 50 * Math.cos(angle);
  return { x, y };
}

export default function SpinGamePage() {
  return (
    <Suspense>
      <SpinGameInner />
    </Suspense>
  );
}

function SpinGameInner() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const name = searchParams.get("name") ?? "Player";

  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);
  // TESTING ONLY: force the win modal to always be visible so the design can be
  // iterated on without spinning every time. Remove this hardcoded value (set
  // back to `null`) before shipping.
  // const [result, setResult] = useState<{ status: "WON" | "LOST"; segmentLabel: string; prizeLabel: string | null } | null>({
  //   status: "WON",
  //   segmentLabel: "USD 100 Funded Account*",
  //   prizeLabel: "USD 100 Funded Trading Account",
  // });
  const [result, setResult] = useState<{ status: "WON" | "LOST";
 segmentLabel: string; prizeLabel: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  async function handleSpin() {
    if (!participantId || spinning) return;
    setError(null);
    setSpinning(true);
    try {
      const res = await fetch("/api/game/spin/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setAlreadyPlayed(true);
        setSpinning(false);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not spin");

      const center = segmentCenterAngle(data.segmentIndex);
      const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);
      const targetRotation = SPINS * 360 + (360 - center + jitter);

      await controls.start({
        rotate: targetRotation,
        transition: { duration: 5, ease: [0.15, 0.85, 0.25, 1] },
      });

      setResult(data);
    } catch (err: any) {
      setError(err.message);
      setSpinning(false);
    }
  }

  return (
    <main className="flex h-screen flex-col items-center overflow-hidden  ">
      <VideoBackground />
      <div className="w-full">
        <TopBar />
      </div>
      <div className="mt-2">
        <PlayerBadge name={name} />
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div
          className="relative aspect-square w-full max-w-[953.297px]"
          style={{ maxWidth: `min(${WHEEL_SIZE}px, 88vw, 50vh)` }}
        >
          {/* disc + labels spin together; the outer border ring stays fixed */}
          <motion.div animate={controls} className="absolute inset-[3%] z-10 rounded-full" style={{ background: wheelBackground() }}>
            {SPIN_SEGMENTS.map((seg, i) => {
              const { x, y } = labelPosition(i, 0.62);
              const isWhite = i % 2 === 0;
              return (
                <div
                  key={seg.label}
                  className="absolute w-[30%] text-center font-bold leading-tight"
                  style={{
                    left: `${50 + x}%`,
                    top: `${50 + y}%`,
                    transform: "translate(-50%, -50%)",
                    color: isWhite ? "#1a1a1a" : "#ffffff",
                    fontSize: "clamp(9px, 2.9vw, 20px)",
                  }}
                >
                  {seg.label}
                </div>
              );
            })}
          </motion.div>

          <img
            src={SPIN_WHEEL_BORDER}
            alt=""
            className="pointer-events-none absolute inset-0 z-10 h-full w-full"
            style={{ transform: `rotate(${BORDER_ROTATION_DEG}deg)` }}
          />
        </div>

        <div className="mt-4 flex h-5 items-center justify-center">
          {spinning && <p className="text-center text-sm text-white/70">Spinning…</p>}
          {error && <p className="text-center text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-4">
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <img src={SPIN_NOW_BUTTON} alt="Spin Now" className="h-[106px] w-[368px]" />
          </button>
        </div>
      </div>

      <p className="mt-auto pb-[100px] text-center text-[10px] text-[#FFFFFF]">
        Disclaimer: Charts are simulated (not live) and are for entertainment purposes only.
      </p>

      <Modal open={result !== null}>
        {result && (
          <ResultModal
            won={result.status === "WON"}
            icon={result.status === "WON" ? WON_ICON : BETTER_LUCK_ICON}
            badge={result.status === "WON" ? `🎁 ${result.prizeLabel}` : undefined}
            title={result.status === "WON" ? "You Won!" : "Better Luck Next Time!"}
            subtitle={
              result.status === "WON" ? (
                <>
                  You've won a <span className="font-bold text-[#1a1a1a]">{result.prizeLabel}</span> in our Spin & Win
                  challenge.
                </>
              ) : (
                "Thanks for playing! We hope to see you again for another chance to win."
              )
            }
            note={result.status === "WON" ? "Reach out to our sales team to claim your prize." : undefined}
          />
        )}
      </Modal>

      <Modal open={alreadyPlayed}>
        <AlreadyPlayedModal />
      </Modal>
    </main>
  );
}
