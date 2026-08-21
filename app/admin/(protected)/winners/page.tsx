"use client";

import { useEffect, useState } from "react";
import AdminSelect from "@/components/AdminSelect";

type Winner = {
  id: string;
  gameType: "TRADE" | "SPIN";
  prizeLabel: string | null;
  claimCode: string | null;
  claimedAt: string | null;
  completedAt: string | null;
  participant: { fullName: string; email: string; phone: string };
};

type GameFilter = "" | "TRADE" | "SPIN";

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [gameFilter, setGameFilter] = useState<GameFilter>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFilter]);

  async function load() {
    setLoading(true);
    const params = gameFilter ? `?gameType=${gameFilter}` : "";
    const res = await fetch(`/api/admin/winners${params}`);
    const data = await res.json();
    setWinners(data.winners ?? []);
    setLoading(false);
  }

  async function markClaimed(sessionId: string) {
    await fetch(`/api/admin/winners/${sessionId}/claim`, { method: "PATCH" });
    load();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Winners</h1>
      <AdminSelect
        value={gameFilter}
        onChange={(e) => setGameFilter(e.target.value as GameFilter)}
        wrapperClassName="mb-4 w-full sm:w-auto"
      >
        <option value="">All Games</option>
        <option value="TRADE">Trade Prediction</option>
        <option value="SPIN">Spin & Win</option>
      </AdminSelect>
      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-black/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Game</th>
              <th className="px-4 py-3">Prize</th>
              <th className="px-4 py-3">Claim Code</th>
              <th className="px-4 py-3">Claimed</th>
              <th className="px-4 py-3">Won At</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-black/40">
                  Loading…
                </td>
              </tr>
            ) : winners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-black/40">
                  No winners yet.
                </td>
              </tr>
            ) : (
              winners.map((w) => (
                <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{w.participant.fullName}</div>
                    <div className="text-xs text-black/50">{w.participant.email}</div>
                  </td>
                  <td className="px-4 py-3">{w.gameType}</td>
                  <td className="px-4 py-3">{w.prizeLabel}</td>
                  <td className="px-4 py-3 font-mono text-xs">{w.claimCode}</td>
                  <td className="px-4 py-3">{w.claimedAt ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-black/50">{w.completedAt ? new Date(w.completedAt).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3">
                    {!w.claimedAt && (
                      <button onClick={() => markClaimed(w.id)} className="rounded-lg bg-black px-3 py-1.5 text-xs text-white">
                        Mark Claimed
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
