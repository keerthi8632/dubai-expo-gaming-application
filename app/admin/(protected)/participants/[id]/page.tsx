"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminSelect from "@/components/AdminSelect";

type GameSession = {
  id: string;
  gameType: "TRADE" | "SPIN";
  status: string;
  forcedOutcome: "WIN" | "LOSE" | null;
  prizeLabel: string | null;
  claimCode: string | null;
};

type Participant = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  countryOfResidence: string;
  gameSessions: GameSession[];
};

export default function ParticipantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    const res = await fetch(`/api/admin/participants/${id}`);
    const data = await res.json();
    setParticipant(data.participant);
  }

  async function setForcedOutcome(gameType: "TRADE" | "SPIN", forcedOutcome: "WIN" | "LOSE" | null) {
    setSaving(gameType);
    await fetch("/api/admin/game-session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: id, gameType, forcedOutcome }),
    });
    await load();
    setSaving(null);
  }

  if (!participant) return <p className="text-black/40">Loading…</p>;

  return (
    <div>
      <h1 className="text-xl font-bold">{participant.fullName}</h1>
      <p className="mt-1 text-sm text-black/60">
        {participant.email} · {participant.phone} · {participant.countryOfResidence}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["TRADE", "SPIN"] as const).map((game) => {
          const session = participant.gameSessions.find((s) => s.gameType === game);
          return (
            <div key={game} className="rounded-xl bg-white p-5 shadow">
              <h2 className="font-semibold">{game === "TRADE" ? "Trade Prediction" : "Spin & Win"}</h2>
              <p className="mt-1 text-sm text-black/60">Status: {session?.status ?? "NOT_PLAYED"}</p>
              {session?.prizeLabel && <p className="text-sm text-green-700">Prize: {session.prizeLabel}</p>}
              {session?.claimCode && <p className="text-xs text-black/50">Claim code: {session.claimCode}</p>}

              <div className="mt-4">
                <label className="text-xs font-medium text-black/70">Force Outcome</label>
                <AdminSelect
                  value={session?.forcedOutcome ?? ""}
                  disabled={saving === game}
                  onChange={(e) => setForcedOutcome(game, (e.target.value || null) as "WIN" | "LOSE" | null)}
                  wrapperClassName="mt-1 block w-full"
                >
                  <option value="">Auto</option>
                  <option value="WIN">Force Win</option>
                  <option value="LOSE">Force Lose</option>
                </AdminSelect>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
