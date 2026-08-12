"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useMotionValue, useTransform, useVelocity, animate } from "framer-motion";
import TopBar from "@/components/TopBar";
import PlayerBadge from "@/components/PlayerBadge";
import ResultModal from "@/components/ResultModal";
import AlreadyPlayedModal from "@/components/AlreadyPlayedModal";
import Modal from "@/components/Modal";
import VideoBackground from "@/components/VideoBackground";
import { DEFAULT_SPIN_SEGMENTS, SpinSegment, segmentAngle, segmentCenterAngle } from "@/lib/spinSegments";
import { SPIN_WHEEL_BORDER, SPIN_NOW_BUTTON, WON_ICON, BETTER_LUCK_ICON } from "@/lib/media";

const SPINS = 5;
const WHEEL_SIZE = 953.297;
const BORDER_ROTATION_DEG = 0; // tweak this to nudge the border ring's light pattern

function wheelBackground(segments: SpinSegment[]) {
  const angle = segmentAngle(segments);
  const stops = segments.map((_, i) => {
    const color = i % 2 === 0 ? "#ffffff" : "#B31217";
    const from = i * angle;
    const to = (i + 1) * angle;
    return `${color} ${from}deg ${to}deg`;
  }).join(", ");
  return `conic-gradient(from -${angle / 2}deg, ${stops})`;
}

function labelPosition(segments: SpinSegment[], index: number, radiusFraction: number) {
  const angle = (segmentCenterAngle(segments, index) * Math.PI) / 180;
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

  // A live rotation value (not just an animation-complete callback) so each
  // label can counter-rotate itself in real time as the disc spins — its
  // position still orbits with the wheel, but the text glyphs stay upright.
  const rotation = useMotionValue(0);
  // Motion-blur: fast spin (high angular velocity) blurs the wheel, and it
  // sharpens back up automatically as the wheel decelerates toward landing.
  const rotationVelocity = useVelocity(rotation);
  const blurPx = useTransform(rotationVelocity, [-2000, 0, 2000], [6, 0, 6], { clamp: true });
  const discFilter = useTransform(blurPx, (b) => `blur(${b}px)`);
  const [segments, setSegments] = useState<SpinSegment[]>(DEFAULT_SPIN_SEGMENTS);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ status: "WON" | "LOST"; segmentLabel: string; prizeLabel: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  useEffect(() => {
    fetch("/api/game/spin/segments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.segments) && data.segments.length > 0) setSegments(data.segments);
      })
      .catch(() => {});
  }, []);

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

      const angle = segmentAngle(segments);
      const center = segmentCenterAngle(segments, data.segmentIndex);
      const jitter = (Math.random() - 0.5) * (angle * 0.6);
      const targetRotation = SPINS * 360 + (360 - center + jitter);

      await animate(rotation, targetRotation, { duration: 5, ease: [0.15, 0.85, 0.25, 1] });

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

      <div className="mt-6 flex w-full flex-1 flex-col items-center justify-start">
        <div
          className="relative aspect-square w-full max-w-[953.297px]"
          style={{ maxWidth: `min(${WHEEL_SIZE}px, 88vw, 50vh)` }}
        >
          {/* disc rotates; labels are children so their position orbits with it too,
              but each one applies its own counter-rotation to stay upright */}
          <motion.div
            className="absolute inset-[3%] z-10 rounded-full"
            style={{ background: wheelBackground(segments), rotate: rotation, filter: discFilter }}
          >
            {segments.map((seg, i) => (
              <SegmentLabel
                key={seg.label}
                label={seg.label}
                rotation={rotation}
                position={labelPosition(segments, i, 0.62)}
                color={i % 2 === 0 ? "#1a1a1a" : "#ffffff"}
              />
            ))}
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

        <div className="mt-4 w-full max-w-[600px] lg:max-w-[360px]">
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <img src={SPIN_NOW_BUTTON} alt="Spin Now" className="w-full" />
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

function SegmentLabel({
  label,
  rotation,
  position,
  color,
}: {
  label: string;
  rotation: ReturnType<typeof useMotionValue<number>>;
  position: { x: number; y: number };
  color: string;
}) {
  // Cancels out the disc's current rotation so the text glyphs stay upright
  // while their left/top position (inherited from the rotating parent) still
  // orbits correctly with the wedge they belong to.
  const counterTransform = useTransform(rotation, (r) => `translate(-50%, -50%) rotate(${-r}deg)`);
  return (
    <motion.div
      className="absolute w-[30%] text-center font-bold leading-tight"
      style={{
        left: `${50 + position.x}%`,
        top: `${50 + position.y}%`,
        transform: counterTransform,
        color,
        fontSize: "clamp(9px, 2.9vw, 20px)",
      }}
    >
      {label}
    </motion.div>
  );
}
