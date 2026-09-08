"use client";

import { useEffect, useState } from "react";

type SpinSegment = {
  label: string;
  weight: number;
  prize: string | null;
  isSpinAgain?: boolean;
  dailyQueueCount?: number;
};
type SpinEventWindow = { startHour: number; startMinute: number; endHour: number; endMinute: number };

// Must match JACKPOT_LAST_AVAILABLE_DATE / JACKPOT_PRIZE_LABEL in
// lib/spinPrizeLimits.ts — kept as plain strings here (rather than importing
// that server-only module) so this client component doesn't pull Prisma into
// the browser bundle.
const JACKPOT_DAY = "2026-09-22";
const JACKPOT_PRIZE_LABEL = "USD 1,000 Funded Account";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ConfigPage() {
  const [rate, setRate] = useState(40);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [segments, setSegments] = useState<SpinSegment[]>([]);
  const [segmentsSaving, setSegmentsSaving] = useState(false);
  const [segmentsSaved, setSegmentsSaved] = useState(false);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);

  const [queueDate, setQueueDate] = useState(todayKey);
  const [queue, setQueue] = useState<string[]>([]);
  const [eventWindow, setEventWindow] = useState<SpinEventWindow>({
    startHour: 10,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
  });
  const [minWinGapMinutes, setMinWinGapMinutes] = useState(10);
  const [addPrize, setAddPrize] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [queueSaving, setQueueSaving] = useState(false);
  const [queueSaved, setQueueSaved] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [remainingCounts, setRemainingCounts] = useState<Record<string, number>>({});
  const [totalCounts, setTotalCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadQueue(queueDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueDate]);

  async function load() {
    const [configRes, segmentsRes] = await Promise.all([
      fetch("/api/admin/config"),
      fetch("/api/admin/spin-segments"),
    ]);
    const configData = await configRes.json();
    const configs = configData.configs as { key: string; value: any }[];
    const rateConfig = configs.find((c) => c.key === "trade_default_win_rate");
    if (rateConfig?.value?.rate != null) setRate(Math.round(rateConfig.value.rate * 100));
    const gapConfig = configs.find((c) => c.key === "spin_min_win_gap_minutes");
    if (gapConfig?.value?.minutes != null) setMinWinGapMinutes(gapConfig.value.minutes);

    const segmentsData = await segmentsRes.json();
    if (Array.isArray(segmentsData.segments)) setSegments(segmentsData.segments);
  }

  async function loadQueue(date: string) {
    setQueueError(null);
    const res = await fetch(`/api/admin/spin-queue?date=${date}`);
    const data = await res.json();
    if (Array.isArray(data.queue)) setQueue(data.queue);
    if (data.eventWindow) setEventWindow(data.eventWindow);
    setTotalCounts(data.totalCounts ?? {});
    setRemainingCounts(data.remainingCounts ?? {});
  }

  function moveQueueItem(from: number, to: number) {
    setQueue((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function removeQueueItem(i: number) {
    setQueue((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addQueueItem() {
    if (!addPrize) return;
    // Only one physical jackpot unit exists for the whole event — never let
    // the queue end up with it twice, whatever the day already contains.
    if (addPrize === JACKPOT_PRIZE_LABEL && queue.includes(JACKPOT_PRIZE_LABEL)) return;
    setQueue((prev) => [...prev, addPrize]);
  }

  // Randomizes the order of whatever's currently in the queue — does not
  // touch which prizes or how many are in it (use "Reset to Defaults" for
  // that). Purely a client-side reorder, nothing is saved until Save Queue.
  function shuffleQueue() {
    setQueue((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }

  // Rebuilds the queue from scratch using each segment's Daily Qty (see
  // Segments section above) — this replaces the current list entirely,
  // including any manual adds/removes.
  async function resetQueueToDefaults() {
    setQueueError(null);
    const res = await fetch("/api/admin/spin-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: queueDate }),
    });
    const data = await res.json();
    if (Array.isArray(data.queue)) setQueue(data.queue);
  }

  async function saveQueue() {
    setQueueSaving(true);
    setQueueSaved(false);
    setQueueError(null);
    try {
      const res = await fetch("/api/admin/spin-queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: queueDate, queue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.join(" ") ?? "Could not save queue");
      setQueueSaved(true);
      await loadQueue(queueDate); // refresh remaining/total counts against the newly saved queue
    } catch (err: any) {
      setQueueError(err.message);
    } finally {
      setQueueSaving(false);
    }
  }

  async function saveMinWinGapMinutes(minutes: number) {
    setMinWinGapMinutes(minutes);
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "spin_min_win_gap_minutes", value: { minutes } }),
    });
  }

  async function saveEventWindow(next: SpinEventWindow) {
    setEventWindow(next);
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "spin_event_window", value: next }),
    });
  }

  const totalEventMinutes =
    eventWindow.endHour * 60 + eventWindow.endMinute - (eventWindow.startHour * 60 + eventWindow.startMinute);
  const windowMinutes = queue.length > 0 ? totalEventMinutes / queue.length : 0;
  const winnablePrizes = Array.from(
    new Set(segments.filter((s) => s.prize).map((s) => s.prize as string))
  );

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "trade_default_win_rate", value: { rate: rate / 100 } }),
    });
    setSaving(false);
    setSaved(true);
  }

  function updateSegment(index: number, patch: Partial<SpinSegment>) {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSegment() {
    setSegments((prev) => [...prev, { label: "New Segment", weight: 10, prize: null, dailyQueueCount: 0 }]);
  }

  function removeSegment(index: number) {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveSegments() {
    setSegmentsSaving(true);
    setSegmentsSaved(false);
    setSegmentsError(null);
    try {
      const res = await fetch("/api/admin/spin-segments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(segments),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.join(" ") ?? "Could not save segments");
      setSegments(data.segments);
      setSegmentsSaved(true);
    } catch (err: any) {
      setSegmentsError(err.message);
    } finally {
      setSegmentsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">Game Config</h1>

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">Trade Prediction — Default Win Rate</h2>
        <p className="mt-1 text-xs text-black/50">
          Used when a participant has no forced outcome set. Doesn't affect participants with Force Win/Lose applied.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-sm font-medium">{rate}%</span>
        </div>
        <button onClick={save} disabled={saving} className="mt-4 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">Spin & Win — Segments</h2>
        <p className="mt-1 text-xs text-black/50">
          Add, remove, or edit wheel segments. Leave <strong>Prize</strong> empty to make it a losing segment, or check{" "}
          <strong>Spin Again</strong> to give the participant another spin instead (no prize, no win or loss recorded).
          Weight controls how likely a segment is relative to the others (higher = more likely) when the outcome isn't
          forced. <strong>Daily Qty</strong> is how many of that prize go into each day's scheduled queue (see Prize
          Queue below) — spins outside the queue's scheduled windows can never win a prize, only Spin Again or lose.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-black/50">
              <tr>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Prize (empty = lose)</th>
                <th className="py-2 pr-3">Spin Again</th>
                <th className="py-2 pr-3">Weight</th>
                <th className="py-2 pr-3">Daily Qty</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {segments.map((seg, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <input
                      value={seg.label}
                      onChange={(e) => updateSegment(i, { label: e.target.value })}
                      className="w-full rounded border px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={seg.prize ?? ""}
                      onChange={(e) => updateSegment(i, { prize: e.target.value.trim() === "" ? null : e.target.value })}
                      placeholder={seg.isSpinAgain ? "N/A" : "e.g. USD 100 Funded Account"}
                      disabled={seg.isSpinAgain}
                      className="w-full rounded border px-2 py-1 disabled:bg-black/5 disabled:text-black/30"
                    />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={seg.isSpinAgain ?? false}
                      onChange={(e) =>
                        updateSegment(i, {
                          isSpinAgain: e.target.checked,
                          prize: e.target.checked ? null : seg.prize,
                        })
                      }
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={1}
                      value={seg.weight}
                      onChange={(e) => updateSegment(i, { weight: Number(e.target.value) || 1 })}
                      className="w-20 rounded border px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      max={seg.prize === JACKPOT_PRIZE_LABEL ? 1 : undefined}
                      value={seg.dailyQueueCount ?? 0}
                      onChange={(e) => {
                        const cap = seg.prize === JACKPOT_PRIZE_LABEL ? 1 : Infinity;
                        updateSegment(i, { dailyQueueCount: Math.min(cap, Math.max(0, Number(e.target.value) || 0)) });
                      }}
                      disabled={seg.isSpinAgain || !seg.prize}
                      title={
                        seg.isSpinAgain || !seg.prize
                          ? "Only applies to prize segments"
                          : seg.prize === JACKPOT_PRIZE_LABEL
                            ? "Only one jackpot unit exists for the whole event"
                            : undefined
                      }
                      className="w-20 rounded border px-2 py-1 disabled:bg-black/5 disabled:text-black/30"
                    />
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => removeSegment(i)}
                      disabled={segments.length <= 2}
                      className="rounded bg-black/10 px-2 py-1 text-xs disabled:opacity-40"
                      title={segments.length <= 2 ? "Need at least 2 segments" : "Remove"}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={addSegment} className="mt-3 rounded-lg bg-black/10 px-3 py-1.5 text-xs font-semibold">
          + Add Segment
        </button>

        {segments.length % 2 !== 0 && (
          <p className="mt-3 text-xs text-amber-600">
            ⚠ Odd number of segments ({segments.length}). The wheel alternates red/white, so an odd count makes two
            segments of the same color end up next to each other. Add or remove one to keep it even.
          </p>
        )}

        {segments.some((s) => !s.isSpinAgain && /spin\s*again/i.test(s.label)) && (
          <p className="mt-3 text-xs text-amber-600">
            ⚠ A segment is labeled "Spin Again" but its Spin Again checkbox isn't ticked — it will render the Spin
            Again wedge on the wheel but resolve as a real loss. Check the box, or rename the label. Saving is
            blocked until this is fixed.
          </p>
        )}

        {segmentsError && <p className="mt-3 text-xs text-red-600">{segmentsError}</p>}

        <button
          onClick={saveSegments}
          disabled={segmentsSaving}
          className="mt-4 block rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {segmentsSaving ? "Saving…" : segmentsSaved ? "Saved ✓" : "Save Segments"}
        </button>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">Spin & Win — Prize Queue</h2>
        <p className="mt-1 text-xs text-black/50">
          Each event day is split into equal time windows across the hours below, and the first spin in a window
          wins that window's prize from the queue — everything else outside an active window can only land on Spin
          Again or a loss. Drag rows to reorder, or use <strong>Shuffle Order</strong> to randomize the current list.{" "}
          <strong>Reset to Defaults</strong> instead rebuilds the whole list from each segment's Daily Qty above,
          discarding any manual changes.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex flex-col text-xs font-medium text-black/60">
            Day
            <input
              type="date"
              value={queueDate}
              onChange={(e) => setQueueDate(e.target.value)}
              className="mt-1 rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs font-medium text-black/60">
            Event start
            <input
              type="time"
              value={`${String(eventWindow.startHour).padStart(2, "0")}:${String(eventWindow.startMinute).padStart(2, "0")}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                saveEventWindow({ ...eventWindow, startHour: h, startMinute: m });
              }}
              className="mt-1 rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs font-medium text-black/60">
            Event end
            <input
              type="time"
              value={`${String(eventWindow.endHour).padStart(2, "0")}:${String(eventWindow.endMinute).padStart(2, "0")}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                saveEventWindow({ ...eventWindow, endHour: h, endMinute: m });
              }}
              className="mt-1 rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs font-medium text-black/60">
            Min minutes between wins
            <input
              type="number"
              min={0}
              value={minWinGapMinutes}
              onChange={(e) => saveMinWinGapMinutes(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-28 rounded border px-2 py-1 text-sm"
            />
          </label>
          <p className="text-xs text-black/50">
            {queue.length} prizes · ~{windowMinutes.toFixed(1)} min per window
          </p>
        </div>
        <p className="mt-2 text-xs text-black/50">
          If nobody plays for a while, missed prizes carry over and stay queued — but no two wins can happen closer
          together than this gap, even if several prizes have backed up, so a slow start doesn't turn into a burst
          of back-to-back winners.
        </p>

        {queueDate === JACKPOT_DAY && (
          <p className="mt-3 text-xs font-medium text-amber-600">
            🏆 This is the jackpot's last available day — the $1,000 Funded Account only ever appears in the queue on{" "}
            {JACKPOT_DAY}.
          </p>
        )}

        {queue.filter((p) => p === JACKPOT_PRIZE_LABEL).length > 1 && (
          <p className="mt-3 text-xs font-medium text-red-600">
            ⚠ This queue has the Grand Prize / Jackpot listed more than once — only one unit exists for the whole
            event. Remove the extra entry below before saving; saving is blocked until only one remains.
          </p>
        )}

        <div className="mt-4 rounded-lg bg-black/[0.03] p-3">
          <p className="text-xs font-semibold uppercase text-black/50">Prizes left today</p>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.keys(totalCounts).length === 0 && <li className="text-black/40">No prizes scheduled for this day.</li>}
            {Object.entries(totalCounts).map(([prize, total]) => (
              <li key={prize} className="flex items-center justify-between">
                <span>{prize}</span>
                <span className="font-semibold">
                  {Math.max(remainingCounts[prize] ?? total, 0)} / {total} left
                </span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-4 space-y-1.5">
          {queue.map((prize, i) => (
            <li
              key={i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i) moveQueueItem(dragIndex, i);
                setDragIndex(null);
              }}
              className="flex cursor-grab items-center gap-3 rounded-lg border bg-black/[0.02] px-3 py-2 text-sm active:cursor-grabbing"
            >
              <span className="text-black/30">⠿</span>
              <span className="w-8 text-xs text-black/40">#{i + 1}</span>
              <span className="flex-1">{prize}</span>
              <button onClick={() => removeQueueItem(i)} className="rounded bg-black/10 px-2 py-1 text-xs">
                Remove
              </button>
            </li>
          ))}
          {queue.length === 0 && <p className="text-sm text-black/40">Queue is empty.</p>}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={addPrize}
            onChange={(e) => setAddPrize(e.target.value)}
            className="rounded border px-2 py-1.5 text-xs"
          >
            <option value="">Add prize…</option>
            {winnablePrizes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={addQueueItem}
            disabled={!addPrize || (addPrize === JACKPOT_PRIZE_LABEL && queue.includes(JACKPOT_PRIZE_LABEL))}
            title={
              addPrize === JACKPOT_PRIZE_LABEL && queue.includes(JACKPOT_PRIZE_LABEL)
                ? "The jackpot is already in this queue — only one unit exists for the whole event"
                : undefined
            }
            className="rounded-lg bg-black/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            + Add to Queue
          </button>
          <button onClick={shuffleQueue} disabled={queue.length === 0} className="rounded-lg bg-black/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
            🔀 Shuffle Order
          </button>
          <button
            onClick={resetQueueToDefaults}
            className="rounded-lg bg-black/10 px-3 py-1.5 text-xs font-semibold"
            title="Rebuilds the queue from each segment's Daily Qty, replacing the current list"
          >
            Reset to Defaults
          </button>
        </div>

        {queueError && <p className="mt-3 text-xs text-red-600">{queueError}</p>}

        <button
          onClick={saveQueue}
          disabled={queueSaving}
          className="mt-4 block rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {queueSaving ? "Saving…" : queueSaved ? "Saved ✓" : "Save Queue"}
        </button>
      </div>
    </div>
  );
}
