import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { resend, RESEND_FROM } from "./resend";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type GameTypeFilter = "TRADE" | "SPIN" | undefined;

function buildCsv(sessions: Awaited<ReturnType<typeof fetchSessions>>): string {
  const csvHeader = "Name,Email,Phone,Country,Game,Status,Prize,ClaimCode,Claimed\n";
  const csvRows = sessions
    .map((s) =>
      [
        s.participant.fullName,
        s.participant.email,
        s.participant.phone,
        s.participant.countryOfResidence,
        s.gameType,
        s.status,
        s.prizeLabel ?? "",
        s.claimCode ?? "",
        s.claimedAt ? "yes" : "no",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  return csvHeader + csvRows;
}

function fetchSessions(where?: Prisma.GameSessionWhereInput) {
  return prisma.gameSession.findMany({ where, include: { participant: true }, orderBy: { createdAt: "desc" } });
}

export async function sendDailyReport(recipients: string[], gameType?: GameTypeFilter) {
  const since = startOfToday();

  const [participants, sessions] = await Promise.all([
    prisma.participant.findMany({
      where: { createdAt: { gte: since }, ...(gameType ? { registeredGame: gameType } : {}) },
    }),
    fetchSessions({ createdAt: { gte: since }, ...(gameType ? { gameType } : {}) }),
  ]);

  const tradeWon = sessions.filter((s) => s.gameType === "TRADE" && s.status === "WON").length;
  const tradeLost = sessions.filter((s) => s.gameType === "TRADE" && s.status === "LOST").length;
  const spinWon = sessions.filter((s) => s.gameType === "SPIN" && s.status === "WON").length;
  const spinLost = sessions.filter((s) => s.gameType === "SPIN" && s.status === "LOST").length;
  const claimsPending = sessions.filter((s) => s.status === "WON" && !s.claimedAt).length;

  const csv = buildCsv(sessions);

  const date = since.toISOString().slice(0, 10);
  const scopeLabel = gameType ? ` — ${gameType === "TRADE" ? "Trade Prediction" : "Spin & Win"}` : "";
  const html = `
    <h2>MH Markets Expo — Daily Report (${date})${scopeLabel}</h2>
    <ul>
      <li>New registrations: ${participants.length}</li>
      ${!gameType || gameType === "TRADE" ? `<li>Trade Prediction — Won: ${tradeWon}, Lost: ${tradeLost}</li>` : ""}
      ${!gameType || gameType === "SPIN" ? `<li>Spin & Win — Won: ${spinWon}, Lost: ${spinLost}</li>` : ""}
      <li>Prize claims pending: ${claimsPending}</li>
    </ul>
  `;

  return resend.emails.send({
    from: RESEND_FROM,
    to: recipients,
    subject: `MH Markets Expo — Daily Report ${date}${scopeLabel}`,
    html,
    attachments: [{ filename: `report-${date}.csv`, content: Buffer.from(csv).toString("base64") }],
  });
}

// Full-history CSV export (not limited to today), used by the admin panel's
// "Download Report" button — as opposed to sendDailyReport, which only
// covers today's activity and is emailed rather than downloaded.
export async function buildAllTimeReportCsv(gameType?: GameTypeFilter): Promise<string> {
  const sessions = await fetchSessions(gameType ? { gameType } : undefined);
  return buildCsv(sessions);
}
