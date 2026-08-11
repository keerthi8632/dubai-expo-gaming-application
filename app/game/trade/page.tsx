"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";
import TopBar from "@/components/TopBar";
import PlayerBadge from "@/components/PlayerBadge";
import ResultModal from "@/components/ResultModal";
import PredictionModal from "@/components/PredictionModal";
import AlreadyPlayedModal from "@/components/AlreadyPlayedModal";
import Modal from "@/components/Modal";
import VideoBackground from "@/components/VideoBackground";
import { PREDICT_NOW_BUTTON, WON_ICON, LOSS_ICON, GRAPH_ICON } from "@/lib/media";

const HISTORY_POINTS = 150;
const IDLE_TICK_MS = 300;
const REVEAL_MS = 6000;
const REVEAL_STEPS = 50;

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

  const [phase, setPhase] = useState<"idle" | "frozen" | "revealing" | "done">("idle");
  const [entryPrice, setEntryPrice] = useState(0);
  const [result, setResult] = useState<{ status: "WON" | "LOST"; entryPrice: number; exitPrice: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
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
      price += trend + (Math.random() - 0.5) * 42;
      history.push({ time: (startTime + i) as UTCTimestamp, value: Number(price.toFixed(2)) });
    }
    series.setData(history);
    livePriceRef.current = price;
    liveTimeRef.current = startTime + HISTORY_POINTS;

    const resize = () => chart.applyOptions({ width: containerRef.current!.clientWidth });
    resize();
    window.addEventListener("resize", resize);

    // Keep the market "alive" — wanders continuously until the player hits Start Now.
    idleIntervalRef.current = setInterval(() => {
      liveTimeRef.current += 1;
      livePriceRef.current += (Math.random() - 0.5) * 38;
      series.update({ time: liveTimeRef.current as UTCTimestamp, value: Number(livePriceRef.current.toFixed(2)) });
      chart.timeScale().scrollToRealTime();
    }, IDLE_TICK_MS);

    return () => {
      window.removeEventListener("resize", resize);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
      chart.remove();
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
    setEntryPrice(Number(livePriceRef.current.toFixed(2)));
    setPhase("frozen");
  }

  async function handlePredict(direction: "BUY" | "SELL") {
    if (!participantId) return;
    setError(null);
    try {
      const res = await fetch("/api/game/trade/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, entryPrice, prediction: direction }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setAlreadyPlayed(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not submit prediction");

      setPhase("revealing");
      animatePrices(entryPrice, data.exitPrice, REVEAL_MS, REVEAL_STEPS, () => {
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

      if (step >= steps) {
        clearInterval(interval);
        onDone();
      }
    }, durationMs / steps);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <VideoBackground />
      <TopBar />
      <div className="mt-2">
        <PlayerBadge name={name} />
      </div>

      <div className="mx-[64px] mt-[100px] overflow-hidden rounded-2xl border border-brand-red/30 bg-white">
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
                : "Watching the market move…"}
          </p>

          <button
            onClick={handleStart}
            disabled={phase !== "idle"}
            className="mt-6 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <img src={PREDICT_NOW_BUTTON} alt="Predict Now" className="h-[106px] w-[368px]" />
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}

      <p className="mt-auto pb-[100px] text-center text-[10px] text-[#FFFFFF]">
        Disclaimer: Charts are simulated (not live) and are for entertainment purposes only.
      </p>

      <Modal open={phase === "frozen"}>
        <PredictionModal price={entryPrice} onPredict={handlePredict} />
      </Modal>

      <Modal open={phase === "done" && result !== null}>
        {result && (
          <ResultModal
            won={result.status === "WON"}
            icon={result.status === "WON" ? WON_ICON : LOSS_ICON}
            title={result.status === "WON" ? "You Won!" : "You Lost!"}
            subtitle={
              result.status === "WON"
                ? "Great prediction! The market moved in your favor."
                : "The market moved against your prediction"
            }
            detail={
              <div className="flex items-center justify-center gap-3 rounded-lg bg-black/5 px-4 py-2 text-sm font-medium">
                <span>{result.entryPrice}</span>
                <span>→</span>
                <span>{result.exitPrice}</span>
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
