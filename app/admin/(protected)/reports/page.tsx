"use client";

import { useEffect, useState } from "react";
import AdminSelect from "@/components/AdminSelect";

type GameFilter = "" | "TRADE" | "SPIN";

export default function ReportsPage() {
  const [recipients, setRecipients] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [gameFilter, setGameFilter] = useState<GameFilter>("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/admin/reports/recipients");
    const data = await res.json();
    setRecipients((data.recipients ?? []).join(", "));
  }

  async function saveRecipients() {
    setSaving(true);
    setMessage(null);
    const list = recipients
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    const res = await fetch("/api/admin/reports/recipients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: list }),
    });
    setSaving(false);
    setMessage(res.ok ? "Recipients saved." : "Could not save recipients — check the email format.");
  }

  async function sendNow() {
    setSending(true);
    setMessage(null);
    const res = await fetch("/api/admin/reports/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameType: gameFilter || undefined }),
    });
    const data = await res.json();
    setSending(false);
    setMessage(res.ok ? `Report sent to ${data.recipients.join(", ")}.` : data.error ?? "Could not send report.");
  }

  function downloadReport() {
    const params = gameFilter ? `?gameType=${gameFilter}` : "";
    window.open(`/api/admin/reports/download${params}`, "_blank");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold">Reports</h1>

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">Recipients</h2>
        <p className="mt-1 text-xs text-black/50">Comma-separated email addresses that receive the daily report.</p>
        <textarea
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="ops@mhmarkets.com, manager@mhmarkets.com"
          className="mt-3 w-full rounded-lg border px-3 py-2 text-sm"
          rows={2}
        />
        <button onClick={saveRecipients} disabled={saving} className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">
          {saving ? "Saving…" : "Save Recipients"}
        </button>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">Game Filter</h2>
        <p className="mt-1 text-xs text-black/50">Applies to both sending and downloading reports below.</p>
        <AdminSelect
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value as GameFilter)}
          wrapperClassName="mt-3 w-full"
        >
          <option value="">All Games</option>
          <option value="TRADE">Trade Prediction</option>
          <option value="SPIN">Spin & Win</option>
        </AdminSelect>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">Send Daily Report</h2>
        <p className="mt-1 text-xs text-black/50">
          Emails today's registrations and game outcomes (as a CSV attachment) to the recipients above.
        </p>
        <button onClick={sendNow} disabled={sending} className="mt-3 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white">
          {sending ? "Sending…" : "Send Report Now"}
        </button>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">Download Report</h2>
        <p className="mt-1 text-xs text-black/50">Downloads a CSV of all registrations and game outcomes to date.</p>
        <button onClick={downloadReport} className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">
          Download CSV
        </button>
      </div>

      {message && <p className="text-sm text-black/70">{message}</p>}
    </div>
  );
}
