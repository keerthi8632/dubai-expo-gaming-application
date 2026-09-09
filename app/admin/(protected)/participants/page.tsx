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

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Participants</h1>
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
