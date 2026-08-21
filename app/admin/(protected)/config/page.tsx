"use client";

import { useEffect, useState } from "react";

type SpinSegment = { label: string; weight: number; prize: string | null; isSpinAgain?: boolean };

export default function ConfigPage() {
  const [rate, setRate] = useState(40);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [segments, setSegments] = useState<SpinSegment[]>([]);
  const [segmentsSaving, setSegmentsSaving] = useState(false);
  const [segmentsSaved, setSegmentsSaved] = useState(false);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [configRes, segmentsRes] = await Promise.all([
      fetch("/api/admin/config"),
      fetch("/api/admin/spin-segments"),
    ]);
    const configData = await configRes.json();
    const config = (configData.configs as { key: string; value: any }[]).find((c) => c.key === "trade_default_win_rate");
    if (config?.value?.rate != null) setRate(Math.round(config.value.rate * 100));

    const segmentsData = await segmentsRes.json();
    if (Array.isArray(segmentsData.segments)) setSegments(segmentsData.segments);
  }

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
    setSegments((prev) => [...prev, { label: "New Segment", weight: 10, prize: null }]);
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
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? "Could not save segments");
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
          forced.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-black/50">
              <tr>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Prize (empty = lose)</th>
                <th className="py-2 pr-3">Spin Again</th>
                <th className="py-2 pr-3">Weight</th>
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

        {segmentsError && <p className="mt-3 text-xs text-red-600">{segmentsError}</p>}

        <button
          onClick={saveSegments}
          disabled={segmentsSaving}
          className="mt-4 block rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {segmentsSaving ? "Saving…" : segmentsSaved ? "Saved ✓" : "Save Segments"}
        </button>
      </div>
    </div>
  );
}
