"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LOGO,
  PLAY_NOW_BUTTON,
  TRADE_PREDICTION_BUTTON,
  SPIN_NOW_BUTTON,
  DISABLED_TRADE_PREDICTION_BUTTON,
  DISABLED_SPIN_NOW_BUTTON,
} from "@/lib/media";
import CloseButton from "@/components/CloseButton";
import AlphorixForm, { AlphorixSubmission } from "@/components/AlphorixForm";
import VideoBackground from "@/components/VideoBackground";
import Modal from "@/components/Modal";
import TermsModal from "@/components/TermsModal";
import TopBar from "@/components/TopBar";
import AlreadyRegisteredModal from "@/components/AlreadyRegisteredModal";
import PlayConfirmModal from "@/components/PlayConfirmModal";

// home: Play Now! + Register, both open the same Alphorix form.
// gameHome: shown after the form is submitted — Trade Prediction / Spin
// Wheel, no Register button (the player is already registered).
type Stage = "home" | "gameHome";

const LEADERBOARD_LINK_STYLE = {
  fontFamily: "var(--font-orbitron)",
  fontWeight: 900,
  fontSize: 24.63,
  lineHeight: "100%",
  letterSpacing: "0.04em",
} as const;

export default function HomePage() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // A result modal's "Play Another Game" link lands here with ?stage=gameHome
  // &played=<GAME>&participantId=<ID> — jump straight to the game picker,
  // already knowing who they are.
  const [stage, setStage] = useState<Stage>(searchParams.get("stage") === "gameHome" ? "gameHome" : "home");
  const existingParticipantId = searchParams.get("participantId");
  const [formOpen, setFormOpen] = useState(false);
  const [termsGame, setTermsGame] = useState<"TRADE" | "SPIN" | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [checkingGame, setCheckingGame] = useState<"TRADE" | "SPIN" | null>(null);
  // Which button opened the Alphorix form — "Play Now!"/game buttons drop the
  // player straight into the game picker on submit, but the standalone
  // "Register" button (home stage footer) shows a play-now-or-later prompt
  // instead, since that lead may not intend to play at all. A ref (not
  // state) because it's only read inside submission handlers, never rendered.
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);
  const formIntentRef = useRef<"play" | "register">("play");
  // Seeded from the /alphorix/thank-you redirect's query params, for the
  // case where that redirect broke out of the iframe to the top level
  // instead of arriving as a postMessage (see the effect below).
  const [registration, setRegistration] = useState<AlphorixSubmission | undefined>(() => {
    const firstName = searchParams.get("firstName") ?? undefined;
    const lastName = searchParams.get("lastName") ?? undefined;
    const email = searchParams.get("email") ?? undefined;
    const phone = searchParams.get("phone") ?? undefined;
    return firstName || lastName || email || phone ? { firstName, lastName, email, phone } : undefined;
  });

  // TopBar's Home/Quit buttons (and anything else) navigate here via
  // router.push("/") — since that's the same route this component is
  // already mounted on, Next does a soft navigation instead of remounting,
  // so `stage` (only ever seeded from the URL once, above) would otherwise
  // never notice the params disappeared. Keep it in sync on every URL change.
  useEffect(() => {
    const nextStage = searchParams.get("stage") === "gameHome" ? "gameHome" : "home";
    setStage(nextStage);
    // Landing back on plain "/" only happens via Home/Quit from the game
    // picker (the thank-you redirect's fallback always carries stage=
    // gameHome, so it never hits this branch) — treat it as a full reset
    // back to a clean first-visit state, not just a stage switch.
    if (nextStage === "home") {
      setRegistration(undefined);
      setTermsGame(null);
      setAlreadyRegistered(false);
      setCheckingGame(null);
      setShowPlayPrompt(false);
      setPlayedGames({ TRADE: false, SPIN: false });
    }
  }, [searchParams]);

  // Alphorix's Thank-you URL redirect lands on /alphorix/thank-you, which
  // postMessages the lead's fields back here if it loaded inside the
  // AlphorixForm iframe below — this is the reliable path (the AlphorixForm
  // component's own postMessage-sniffing is only a fallback for when the
  // redirect isn't wired up yet).
  useEffect(() => {
    function handleThankYouMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== "alphorix-thank-you") return;
      const { firstName, lastName, email, phone } = event.data;
      handleRegistered({ firstName, lastName, email, phone });
    }
    window.addEventListener("message", handleThankYouMessage);
    return () => window.removeEventListener("message", handleThankYouMessage);
  }, []);

  function openForm(intent: "play" | "register") {
    formIntentRef.current = intent;
    // Dev-only escape hatch — skips the real Alphorix iframe so local testing
    // doesn't require submitting the live form each time. Must stay off in
    // production, where this is the only place lead data gets captured.
    if (process.env.NEXT_PUBLIC_SKIP_ALPHORIX_FORM === "1") {
      handleRegistered(undefined);
      return;
    }
    setFormOpen(true);
  }

  function handleRegistered(info?: AlphorixSubmission) {
    setRegistration(info);
    setFormOpen(false);
    if (formIntentRef.current === "register") {
      setShowPlayPrompt(true);
    } else {
      setStage("gameHome");
    }
  }

  // Which games this participant has already completed — checked against the
  // DB (not just the single ?played= param) so both buttons disable once
  // neither game has anything left to play, regardless of how they got here.
  const [playedGames, setPlayedGames] = useState<{ TRADE: boolean; SPIN: boolean }>({
    TRADE: false,
    SPIN: false,
  });

  useEffect(() => {
    if (!existingParticipantId) return;
    fetch(`/api/participant/${existingParticipantId}/played-games`)
      .then((res) => res.json())
      .then((data) => setPlayedGames({ TRADE: !!data.TRADE, SPIN: !!data.SPIN }))
      .catch(() => {});
  }, [existingParticipantId]);

  // Uses whatever real name/email/phone the Alphorix form's postMessage gave
  // us (see AlphorixForm.tsx) to create/find the local participant row the
  // game APIs key off of. If we already know the participant (returning from
  // "Play Another Game"), that identity is reused instead of re-deriving it
  // from registration state that's lost on this fresh page mount. Falls back
  // to a Guest Player placeholder if neither is available.
  async function enterGame(game: "TRADE" | "SPIN") {
    const fullName = registration?.fullName || [registration?.firstName, registration?.lastName].filter(Boolean).join(" ");

    const res = await fetch("/api/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: existingParticipantId ?? undefined,
        fullName: fullName || undefined,
        email: registration?.email,
        phone: registration?.phone,
      }),
    });
    const data = await res.json();
    if (!res.ok) return;
    router.push(
      `/game/${game.toLowerCase()}?participantId=${data.participantId}&name=${encodeURIComponent(data.fullName ?? "Guest Player")}`
    );
  }

  // Gate on a game button click, before the Terms modal even opens. Skipped
  // for the "Play Another Game" round trip (existingParticipantId already
  // set from the URL) — that's the same participant intentionally continuing
  // to the second game, not a re-registration. Only applies to a fresh
  // Alphorix form submission this visit, to catch someone re-registering
  // with an email/phone that already has a Participant row from an earlier
  // session.
  async function handleGameClick(game: "TRADE" | "SPIN") {
    if (existingParticipantId) {
      setTermsGame(game);
      return;
    }
    setCheckingGame(game);
    try {
      const res = await fetch("/api/participant/check-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registration?.email, phone: registration?.phone }),
      });
      const data = await res.json().catch(() => ({ exists: false }));
      if (data.exists) {
        setAlreadyRegistered(true);
        return;
      }
      setTermsGame(game);
    } finally {
      setCheckingGame(null);
    }
  }

  // Home/Quit on the game-picker screen — reset state directly rather than
  // via router.push("/"), since this stage can be reached from local state
  // alone (a fresh Alphorix submit never touches the URL), leaving the URL
  // already at "/": pushing "/" again is then a same-URL no-op that Next
  // won't re-render for, so the buttons would otherwise do nothing.
  function resetToHome() {
    setStage("home");
    setRegistration(undefined);
    setTermsGame(null);
    setAlreadyRegistered(false);
    setCheckingGame(null);
    setShowPlayPrompt(false);
    setPlayedGames({ TRADE: false, SPIN: false });
    router.replace("/");
  }

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden">
      <VideoBackground />

      {stage === "gameHome" && (
        <div className="relative z-10 shrink-0">
          <TopBar onHome={resetToHome} onQuit={resetToHome} />
        </div>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-1 flex-col items-center px-[64px] py-8">
        {stage === "home" && <img src={LOGO} alt="MH Markets" className="h-8" />}

        {stage === "home" ? (
          <div className="mx-auto mt-24 flex w-full max-w-[600px] flex-col items-center gap-5 lg:max-w-[360px] lg:gap-4">
            <button onClick={() => openForm("play")} className="w-full transition-transform active:scale-95">
              <img src={PLAY_NOW_BUTTON} alt="Play Now!" className="w-full" />
            </button>
            <Link href="/leaderboard" className="mt-2 text-center text-white underline decoration-solid underline-offset-2" style={LEADERBOARD_LINK_STYLE}>
              Leaderboard
            </Link>
          </div>
        ) : (
          <div className="mx-auto mt-24 flex w-full max-w-[600px] flex-col items-center gap-5 lg:max-w-[360px] lg:gap-4">
            <button
              onClick={() => handleGameClick("TRADE")}
              disabled={playedGames.TRADE || checkingGame !== null}
              className="w-full transition-transform active:scale-95 disabled:active:scale-100"
            >
              <img
                src={playedGames.TRADE ? DISABLED_TRADE_PREDICTION_BUTTON : TRADE_PREDICTION_BUTTON}
                alt="Trade Prediction"
                className="w-full"
              />
            </button>
            <button
              onClick={() => handleGameClick("SPIN")}
              disabled={playedGames.SPIN || checkingGame !== null}
              className="w-full transition-transform active:scale-95 disabled:active:scale-100"
            >
              <img
                src={playedGames.SPIN ? DISABLED_SPIN_NOW_BUTTON : SPIN_NOW_BUTTON}
                alt="Spin Wheel"
                className="w-full"
              />
            </button>
          </div>
        )}

        {/* Decorative hero visual (podium/phone/coins from Figma) — no asset provided yet, export from Figma and drop in public/media to fill this slot */}
        {/* Above the kiosk breakpoint (>1080px) this just fills remaining
            height and sits at the bottom via justify-end, as before. At or
            below 1080px it's pulled out of flow and fixed to the literal
            bottom of the screen so it can't drift with content height above. */}
        <div className="w-full flex-1 desktop:flex desktop:flex-col desktop:items-center desktop:justify-end desktop:gap-[72px] desktop:pb-[30px]">
          <div className="fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-[72px] px-[64px] pb-8 desktop:static desktop:z-auto desktop:contents desktop:px-0 desktop:pb-0">
            {stage === "home" && (
              <button
                onClick={() => openForm("register")}
                className="mx-auto flex w-full max-w-[420px] items-center justify-center gap-3 rounded-xl bg-brand-red px-12 py-4 transition-transform active:scale-[0.98] desktop:max-w-[360px] desktop:gap-3 desktop:px-10 desktop:py-4"
              >
                <span className="text-center text-[28px] font-bold leading-normal tracking-normal text-[#FFFFFF] desktop:text-2xl">
                  Register
                </span>
              </button>
            )}
            <p className="w-full whitespace-nowrap text-center text-xs font-normal leading-[18px] tracking-normal text-white">
              Disclaimer: Charts are simulated (not live) and are for entertainment purposes only.
            </p>
          </div>
        </div>
      </div>

      {/* Kept mounted at all times (never unmounted) so the iframe starts loading as soon as
          the home page opens — toggling visibility here is instant instead of waiting on a
          fresh network load each time the user clicks Play Now/Register. */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 transition-opacity duration-200 ${
          formOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setFormOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="no-scrollbar relative h-[49vh] max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white text-black"
        >
          <CloseButton onClose={() => setFormOpen(false)} />
          <AlphorixForm formId="57237fa43377" onSubmitted={handleRegistered} />
        </div>
      </div>

      <Modal open={termsGame !== null} onClose={() => setTermsGame(null)} contentClassName="w-full max-w-[620px]">
        {termsGame && (
          <TermsModal game={termsGame} onAccept={() => enterGame(termsGame)} onDecline={() => setTermsGame(null)} />
        )}
      </Modal>

      <Modal open={alreadyRegistered} onClose={() => setAlreadyRegistered(false)}>
        <AlreadyRegisteredModal />
      </Modal>

      <Modal open={showPlayPrompt} onClose={() => setShowPlayPrompt(false)}>
        <PlayConfirmModal
          onPlay={() => {
            setShowPlayPrompt(false);
            setStage("gameHome");
          }}
          onLater={() => {
            setShowPlayPrompt(false);
            setStage("home");
          }}
        />
      </Modal>
    </main>
  );
}
