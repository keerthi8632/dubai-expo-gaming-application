"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSelect from "@/components/AdminSelect";

type Participant = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  countryOfResidence: string;
  emailVerified: boolean;
  createdAt: string;
  gameSessions: { gameType: "TRADE" | "SPIN"; status: string }[];
};

type GameFilter = "" | "TRADE" | "SPIN";

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [q, setQ] = useState("");
  const [gameFilter, setGameFilter] = useState<GameFilter>("");
  const [loading, setLoading] = useState(true);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearResult, setClearResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, gameFilter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ q });
    if (gameFilter) params.set("gameType", gameFilter);
    const res = await fetch(`/api/admin/participants?${params.toString()}`);
    const data = await res.json();
    setParticipants(data.participants ?? []);
    setLoading(false);
  }

  function sessionStatus(p: Participant, game: "TRADE" | "SPIN") {
    return p.gameSessions.find((s) => s.gameType === game)?.status ?? "NOT_PLAYED";
  }

  async function clearAllParticipants() {
    if (!confirmingClear) {
      setConfirmingClear(true);
      setClearError(null);
      setClearResult(null);
      return;
    }
    setClearing(true);
    setClearError(null);
    try {
      const res = await fetch("/api/admin/reset-participants", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to clear participant data");
      setClearResult(`Cleared ${data.clearedParticipants} participant(s) and ${data.clearedSpinQueueClaims} spin queue claim(s).`);
      load();
    } catch (err: any) {
      setClearError(err.message);
    } finally {
      setClearing(false);
      setConfirmingClear(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Participants</h1>

      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Danger Zone</p>
        <p className="mt-1 text-xs text-red-700">
          Clears every participant, game session, OTP code, and spin queue claim — for starting a fresh event day.
          Admin logins and game config (spin prizes, win rate) are not affected. This cannot be undone.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={clearAllParticipants}
            disabled={clearing}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              confirmingClear ? "bg-red-700" : "bg-red-600"
            }`}
          >
            {clearing ? "Clearing…" : confirmingClear ? "Click again to confirm" : "Clear All Participant Data"}
          </button>
          {confirmingClear && !clearing && (
            <button
              onClick={() => setConfirmingClear(false)}
              className="rounded-lg bg-black/10 px-3 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
        {clearError && <p className="mt-2 text-xs text-red-700">{clearError}</p>}
        {clearResult && <p className="mt-2 text-xs text-green-700">{clearResult}</p>}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="w-full rounded-lg border px-3 py-2 text-sm sm:max-w-sm"
        />
        <AdminSelect
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value as GameFilter)}
          wrapperClassName="w-full sm:w-auto"
        >
          <option value="">All Games</option>
          <option value="TRADE">Trade Prediction</option>
          <option value="SPIN">Spin & Win</option>
        </AdminSelect>
      </div>
      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-black/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Trade</th>
              <th className="px-4 py-3">Spin</th>
              <th className="px-4 py-3">Registered</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-black/40">
                  Loading…
                </td>
              </tr>
            ) : participants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-black/40">
                  No participants found.
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/participants/${p.id}`} className="font-medium text-brand-red hover:underline">
                      {p.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.email}</td>
                  <td className="px-4 py-3">{p.phone}</td>
                  <td className="px-4 py-3">{p.countryOfResidence}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sessionStatus(p, "TRADE")} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sessionStatus(p, "SPIN")} />
                  </td>
                  <td className="px-4 py-3 text-black/50">{new Date(p.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "WON" ? "bg-green-100 text-green-700" : status === "LOST" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>;
}
