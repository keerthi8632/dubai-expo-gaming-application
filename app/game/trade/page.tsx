"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { IChartApi, ISeriesApi, IPriceLine, UTCTimestamp } from "lightweight-charts";
import TopBar from "@/components/TopBar";
import PlayerBadge from "@/components/PlayerBadge";
import ResultModal from "@/components/ResultModal";
import PredictionModal from "@/components/PredictionModal";
import CountdownModal from "@/components/CountdownModal";
import AlreadyPlayedModal from "@/components/AlreadyPlayedModal";
import Modal from "@/components/Modal";
import VideoBackground from "@/components/VideoBackground";
import { PREDICT_NOW_BUTTON, WON_ICON, LOSS_ICON, GRAPH_ICON, MODEL_ARROW_ICON } from "@/lib/media";
import { FUNDED_ACCOUNT_NOTE } from "@/lib/prizes";

const HISTORY_POINTS = 150;
const IDLE_TICK_MS = 300;
const PRICE_FLOOR = 5000;
const PRICE_CEILING = 9000;
const REVEAL_MS = 2600;
const REVEAL_STEPS = 26;

function clampPrice(price: number): number {
  return Math.min(PRICE_CEILING, Math.max(PRICE_FLOOR, price));
}

export default function TradeGamePage() {
  return (
    <Suspense>
      <TradeGameInner />
    </Suspense>
  );
}

function TradeGameInner() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const name = searchParams.get("name") ?? "Player";

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const idleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePriceRef = useRef(7000);
  const liveTimeRef = useRef(0);
  const entryLineRef = useRef<IPriceLine | null>(null);
  const exitLineRef = useRef<IPriceLine | null>(null);
  // lightweight-charts is a sizeable dependency only this page needs — loaded
  // via dynamic import() (below) so it's a separate chunk the browser fetches
  // in parallel instead of blocking this route's initial bundle. Cached here
  // once loaded so handleStart/handleCountdownComplete can reach LineStyle.
  const chartModuleRef = useRef<typeof import("lightweight-charts") | null>(null);

  const [phase, setPhase] = useState<"idle" | "frozen" | "countdown" | "revealing" | "done">("idle");
  const [entryPrice, setEntryPrice] = useState(0);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [result, setResult] = useState<{ status: "WON" | "LOST"; entryPrice: number; exitPrice: number; otherGamePlayed?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const resolveRef = useRef<Promise<{ res: Response; data: any }> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    let cleanup = () => {};

    import("lightweight-charts").then((mod) => {
      if (disposed || !containerRef.current) return;
      chartModuleRef.current = mod;
      const { createChart } = mod;

      const chart = createChart(containerRef.current, {
        layout: { background: { color: "#ffffff" }, textColor: "#222" },
        grid: { vertLines: { color: "#eee" }, horzLines: { color: "#eee" } },
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false, visible: true },
        height: 460,
      });
      const series = chart.addAreaSeries({
        lineColor: "#2563eb",
        lineWidth: 2,
        topColor: "rgba(37, 99, 235, 0.35)",
        bottomColor: "rgba(37, 99, 235, 0.02)",
      });
      chartRef.current = chart;
      seriesRef.current = series;

      // Seed some trending history so the chart isn't a blank canvas on load.
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - HISTORY_POINTS;
      let price = 7000;
      const history = [];
      for (let i = 0; i < HISTORY_POINTS; i++) {
        const trend = Math.sin(i / 25) * 8;
        price = clampPrice(price + trend + (Math.random() - 0.5) * 42);
        history.push({ time: (startTime + i) as UTCTimestamp, value: Number(price.toFixed(2)) });
      }
      series.setData(history);
      livePriceRef.current = price;
      liveTimeRef.current = startTime + HISTORY_POINTS;

      const resize = () => chart.applyOptions({ width: containerRef.current!.clientWidth });
      resize();
      window.addEventListener("resize", resize);

      // Keep the market "alive" — wanders continuously until the player hits Start Now.
      // Clamped to a floor/ceiling so a long idle period (kiosk sitting between
      // players) can't drift the price to zero/negative, which the resolve API
      // rejects (entryPrice must be positive).
      idleIntervalRef.current = setInterval(() => {
        liveTimeRef.current += 1;
        livePriceRef.current = clampPrice(livePriceRef.current + (Math.random() - 0.5) * 38);
        series.update({ time: liveTimeRef.current as UTCTimestamp, value: Number(livePriceRef.current.toFixed(2)) });
        chart.timeScale().scrollToRealTime();
      }, IDLE_TICK_MS);

      cleanup = () => {
        window.removeEventListener("resize", resize);
        if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
        chart.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  function handleStart() {
    if (!participantId) {
      setError("Missing participant. Please register again.");
      return;
    }
    setError(null);
    if (idleIntervalRef.current) {
      clearInterval(idleIntervalRef.current);
      idleIntervalRef.current = null;
    }
    const price = Number(livePriceRef.current.toFixed(2));
    setEntryPrice(price);
    setLivePrice(price);
    setPhase("frozen");

    const series = seriesRef.current;
    if (series) {
      if (entryLineRef.current) series.removePriceLine(entryLineRef.current);
      if (exitLineRef.current) {
        series.removePriceLine(exitLineRef.current);
        exitLineRef.current = null;
      }
      entryLineRef.current = series.createPriceLine({
        price,
        color: "#111827",
        lineWidth: 2,
        lineStyle: chartModuleRef.current!.LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Entry",
      });
    }
  }

  function handlePredict(direction: "BUY" | "SELL") {
    if (!participantId) return;
    setError(null);
    // Kick the resolve call off immediately so it resolves in the background
    // while the countdown plays — the countdown is what fills the gap the
    // user is watching, the network round-trip just happens underneath it.
    resolveRef.current = fetch("/api/game/trade/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, entryPrice, prediction: direction }),
    }).then(async (res) => ({ res, data: await res.json() }));
    setPhase("countdown");
  }

  async function handleCountdownComplete() {
    try {
      const { res, data } = (await resolveRef.current) ?? {};
      if (!res || !data) throw new Error("Could not submit prediction");
      if (res.status === 409) {
        setAlreadyPlayed(true);
        setPhase("idle");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not submit prediction");

      setPhase("revealing");
      animatePrices(entryPrice, data.exitPrice, REVEAL_MS, REVEAL_STEPS, () => {
        const series = seriesRef.current;
        if (series) {
          exitLineRef.current = series.createPriceLine({
            price: data.exitPrice,
            color: data.status === "WON" ? "#34c759" : "#ff3b30",
            lineWidth: 2,
            lineStyle: chartModuleRef.current!.LineStyle.Solid,
            axisLabelVisible: true,
            title: "Exit",
          });
        }
        setResult(data);
        setPhase("done");
      });
    } catch (err: any) {
      setError(err.message);
      setPhase("frozen");
    }
  }

  function animatePrices(fromPrice: number, toPrice: number, durationMs: number, steps: number, onDone: () => void) {
    const series = seriesRef.current;
    if (!series) return onDone();

    let value = fromPrice;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      liveTimeRef.current += 1;
      const progress = step / steps;
      const pull = (toPrice - value) * 0.15;
      const noise = (Math.random() - 0.5) * fromPrice * 0.004 * (1 - progress);
      value = step === steps ? toPrice : value + pull + noise;

      series.update({ time: liveTimeRef.current as UTCTimestamp, value });
      chartRef.current?.timeScale().scrollToRealTime();
      setLivePrice(value);

      if (step >= steps) {
        clearInterval(interval);
        onDone();
      }
    }, durationMs / steps);
  }

  return (
    <main className="flex min-h-screen flex-col overflow-y-auto">
      <VideoBackground />
      <TopBar homeHref={`/?stage=gameHome${participantId ? `&participantId=${participantId}` : ""}`} />
      <div className="mt-2">
        <PlayerBadge name={name} />
      </div>

      <div className="mx-[64px] mt-8 overflow-hidden rounded-2xl border border-brand-red/30 bg-white">
        <div ref={containerRef} />
        <div className="flex items-center justify-between border-t border-black/5 px-3 py-1.5">
          <span className="flex items-center gap-1 text-xs font-bold text-black/70">
            <span className="rounded bg-black px-1 py-0.5 text-[9px] font-black text-white">T7</span>
            {/* TradingView */}
          </span>
          {/* <span className="flex items-center gap-1.5 text-sm">
            <span className="h-3.5 w-3.5 rounded-full bg-purple-500" />
            <span className="h-3.5 w-3.5 rounded-full bg-red-500" />
          </span> */}
        </div>
      </div>

      {phase !== "done" && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <img src={GRAPH_ICON} alt="" className="h-[38px] w-[38px]" />
          <p
            className="text-center font-normal text-white"
            style={{ fontFamily: "var(--font-inter)", fontSize: 24, lineHeight: "normal", letterSpacing: 0 }}
          >
            {phase === "idle"
              ? "Tap Predict Now to set the market in motion."
              : phase === "frozen"
                ? "Market frozen — call it: Buy or Sell?"
                : phase === "countdown"
                  ? "Locking in your prediction…"
                  : "Watching the market move…"}
          </p>

          {phase === "revealing" && livePrice !== null && (
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <span className="text-sm text-white/70">Entry {entryPrice.toFixed(2)}</span>
              <span className="text-sm text-white/50">→</span>
              <span
                className={`text-sm font-bold ${livePrice >= entryPrice ? "text-[#34c759]" : "text-[#ff3b30]"}`}
              >
                {livePrice.toFixed(2)} ({livePrice >= entryPrice ? "+" : ""}
                {(livePrice - entryPrice).toFixed(2)})
              </span>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={phase !== "idle"}
            className="mt-6 w-full max-w-[600px] transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 lg:max-w-[360px]"
          >
            <img src={PREDICT_NOW_BUTTON} alt="Predict Now" className="w-full" />
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}

      <p className="mt-auto pb-[100px] text-center text-[10px] text-[#FFFFFF]">
        Disclaimer: Charts are simulated (not live) and are for entertainment purposes only.
      </p>

      <Modal open={phase === "frozen"} contentClassName="w-full max-w-[500px]">
        <PredictionModal price={entryPrice} onPredict={handlePredict} />
      </Modal>

      <Modal open={phase === "countdown"} contentClassName="w-full max-w-[320px]">
        <CountdownModal onComplete={handleCountdownComplete} />
      </Modal>

      <Modal open={phase === "done" && result !== null}>
        {result && (
          <ResultModal
            game="TRADE"
            participantId={participantId ?? ""}
            won={result.status === "WON"}
            icon={result.status === "WON" ? WON_ICON : LOSS_ICON}
            showPlayAnother={!result.otherGamePlayed}
            title={result.status === "WON" ? "You Won!" : "You Lost!"}
            subtitle={
              result.status === "WON"
                ? "Great prediction! The market moved in your favor."
                : "The market moved against your prediction"
            }
            note={result.status === "WON" ? FUNDED_ACCOUNT_NOTE : undefined}
            detail={
              <div className="flex items-center justify-center gap-3.5 self-stretch rounded-2xl bg-[#F5F6F8] px-3.5 py-4">
                <div className="flex w-[159px] flex-col">
                  <span className="text-center text-[12px] font-normal text-[#70757e] ">Entry</span>
                  <span className="pt-1 text-center text-[18px] font-medium text-black">
                    {result.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <img src={MODEL_ARROW_ICON} alt="" className="h-[18px] w-[18px]" />
                <div className="flex w-[159px] flex-col">
                  <span className="text-center text-[12px] font-normal text-[#70757e] ">Exit</span>
                  <span className="pt-1 text-center text-[18px] font-medium text-black">
                    {result.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
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
