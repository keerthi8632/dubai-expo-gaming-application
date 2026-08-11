"use client";

import { useEffect, useState } from "react";

export default function ConfigPage() {
  const [rate, setRate] = useState(40);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/admin/config");
    const data = await res.json();
    const config = (data.configs as { key: string; value: any }[]).find((c) => c.key === "trade_default_win_rate");
    if (config?.value?.rate != null) setRate(Math.round(config.value.rate * 100));
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

  return (
    <div className="max-w-lg space-y-6">
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
          Fixed for the entire expo. To change segments/prizes, edit <code>lib/spinSegments.ts</code> and redeploy.
        </p>
      </div>
    </div>
  );
}
