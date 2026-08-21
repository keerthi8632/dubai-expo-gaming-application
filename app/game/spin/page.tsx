"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useMotionValue, useTransform, useVelocity, animate, AnimationPlaybackControls } from "framer-motion";
import TopBar from "@/components/TopBar";
import PlayerBadge from "@/components/PlayerBadge";
import ResultModal from "@/components/ResultModal";
import SpinAgainModal from "@/components/SpinAgainModal";
import AlreadyPlayedModal from "@/components/AlreadyPlayedModal";
import CountdownModal from "@/components/CountdownModal";
import Modal from "@/components/Modal";
import VideoBackground from "@/components/VideoBackground";
import { DEFAULT_SPIN_SEGMENTS, SpinSegment, segmentAngle, segmentCenterAngle } from "@/lib/spinSegments";
import { SPIN_WHEEL_BORDER, SPIN_NOW_BUTTON, STOP_BUTTON, WON_ICON, BETTER_LUCK_ICON } from "@/lib/media";
import { isFundedAccountPrize, FUNDED_ACCOUNT_NOTE } from "@/lib/prizes";

// Constant angular speed of the free spin (before Stop is pressed).
const SPIN_SPEED_DEG_PER_SEC = 720;
// Extra full turns the wheel makes while decelerating into its landing spot,
// on top of whatever rotation it already has from the free spin.
const LANDING_SPINS = 3;
// Pause after the wheel physically stops, before the countdown modal pops up
// — gives the player a moment to actually see where it landed.
const LANDED_PAUSE_MS = 900;
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
  // idle: not spinning yet. spinning: freely spinning, user controls when it
  // stops. stopping: decelerating into the resolved segment. revealing: wheel
  // has physically stopped, holding before the result modal appears.
  const [phase, setPhase] = useState<"idle" | "spinning" | "stopping" | "revealing">("idle");
  const [result, setResult] = useState<{ status: "WON" | "LOST" | "AGAIN"; segmentLabel: string; prizeLabel: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  const spinControlsRef = useRef<AnimationPlaybackControls | null>(null);
  const resolveRef = useRef<Promise<{ res: Response; data: any }> | null>(null);
  const pendingResultRef = useRef<{ status: "WON" | "LOST" | "AGAIN"; segmentLabel: string; prizeLabel: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/game/spin/segments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.segments) && data.segments.length > 0) setSegments(data.segments);
      })
      .catch(() => {});
  }, []);

  // Starts a free, indefinite spin immediately (so the button/wheel react the
  // instant the player taps it) while the outcome is resolved with the server
  // in the background — the player only finds out where it lands once they
  // tap Stop.
  function startSpin() {
    if (!participantId || phase !== "idle") return;
    setError(null);
    setPhase("spinning");

    const promise = fetch("/api/game/spin/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId }),
    }).then(async (res) => ({ res, data: await res.json() }));
    resolveRef.current = promise;

    // If the server rejects the spin (e.g. already played) while the wheel is
    // still freely spinning, stop it right away instead of waiting for Stop.
    promise.then(({ res, data }) => {
      if (res.status === 409) {
        spinControlsRef.current?.stop();
        setAlreadyPlayed(true);
        setPhase("idle");
      } else if (!res.ok) {
        spinControlsRef.current?.stop();
        setError(data.error ?? "Could not spin");
        setPhase("idle");
      }
    });

    // Long, constant-speed spin — effectively indefinite for a booth session,
    // stopped early whenever the player taps Stop.
    const farTarget = rotation.get() + SPIN_SPEED_DEG_PER_SEC * 3600;
    spinControlsRef.current = animate(rotation, farTarget, { duration: 3600, ease: "linear" });
  }

  async function stopSpin() {
    if (phase !== "spinning") return;
    spinControlsRef.current?.stop();
    setPhase("stopping");

    try {
      const outcome = await resolveRef.current;
      if (!outcome) throw new Error("Could not spin");
      const { res, data } = outcome;
      if (res.status === 409) {
        setAlreadyPlayed(true);
        setPhase("idle");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not spin");

      const current = rotation.get();
      const angle = segmentAngle(segments);
      const center = segmentCenterAngle(segments, data.segmentIndex);
      const jitter = (Math.random() - 0.5) * (angle * 0.6);
      const currentMod = ((current % 360) + 360) % 360;
      const targetMod = (((360 - center + jitter) % 360) + 360) % 360;
      const delta = ((targetMod - currentMod) % 360 + 360) % 360;
      const totalDelta = delta + LANDING_SPINS * 360;
      const targetRotation = current + totalDelta;

      // Uniform-deceleration kinematics (v0 → 0 over distance totalDelta):
      // duration = 2 * distance / v0. Paired with an ease-out curve this keeps
      // the wheel's speed continuous through the Stop press instead of
      // jumping to a different speed, then it gradually slows to a stop.
      const duration = (2 * totalDelta) / SPIN_SPEED_DEG_PER_SEC;
      await animate(rotation, targetRotation, { duration, ease: "easeOut" });

      // Wheel is now visibly stopped on the result — hold on it for a beat
      // before the 3, 2, 1 countdown (see CountdownModal below) plays and the
      // result popup appears.
      pendingResultRef.current = data;
      await new Promise((resolve) => setTimeout(resolve, LANDED_PAUSE_MS));
      setPhase("revealing");
    } catch (err: any) {
      setError(err.message);
      setPhase("idle");
    }
  }

  return (
    <main className="flex min-h-screen h-[100dvh] flex-col items-center overflow-y-auto overflow-x-hidden">
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
          {error && <p className="text-center text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-4 w-full max-w-[600px] lg:max-w-[360px]">
          <button
            onClick={phase === "idle" ? startSpin : phase === "spinning" ? stopSpin : undefined}
            disabled={phase === "stopping" || phase === "revealing"}
            className="w-full transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <img
              src={phase === "idle" ? SPIN_NOW_BUTTON : STOP_BUTTON}
              alt={phase === "idle" ? "Spin Now" : "Stop"}
              className="w-full"
            />
          </button>
        </div>
      </div>

      <p className="mt-auto pb-6 sm:pb-[100px] text-center text-[10px] text-[#FFFFFF]">
        Disclaimer: Charts are simulated (not live) and are for entertainment purposes only.
      </p>

      <Modal open={phase === "revealing"} contentClassName="w-full max-w-[320px]">
        <CountdownModal onComplete={() => setResult(pendingResultRef.current)} />
      </Modal>

      <Modal open={result !== null && result.status === "AGAIN"} contentClassName="w-full max-w-sm">
        {result && result.status === "AGAIN" && (
          <SpinAgainModal
            onContinue={() => {
              setResult(null);
              setPhase("idle");
            }}
          />
        )}
      </Modal>

      <Modal open={result !== null && result.status !== "AGAIN"}>
        {result && result.status !== "AGAIN" && (
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
            note={
              result.status === "WON"
                ? isFundedAccountPrize(result.prizeLabel)
                  ? FUNDED_ACCOUNT_NOTE
                  : "Reach out to our sales team to claim your prize."
                : undefined
            }
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
