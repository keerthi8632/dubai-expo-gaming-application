import { prisma } from "./prisma";
import { resend, RESEND_FROM } from "./resend";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function sendDailyReport(recipients: string[]) {
  const since = startOfToday();

  const [participants, sessions] = await Promise.all([
    prisma.participant.findMany({ where: { createdAt: { gte: since } } }),
    prisma.gameSession.findMany({ where: { createdAt: { gte: since } }, include: { participant: true } }),
  ]);

  const tradeWon = sessions.filter((s) => s.gameType === "TRADE" && s.status === "WON").length;
  const tradeLost = sessions.filter((s) => s.gameType === "TRADE" && s.status === "LOST").length;
  const spinWon = sessions.filter((s) => s.gameType === "SPIN" && s.status === "WON").length;
  const spinLost = sessions.filter((s) => s.gameType === "SPIN" && s.status === "LOST").length;
  const claimsPending = sessions.filter((s) => s.status === "WON" && !s.claimedAt).length;

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
  const csv = csvHeader + csvRows;

  const date = since.toISOString().slice(0, 10);
  const html = `
    <h2>MH Markets Expo — Daily Report (${date})</h2>
    <ul>
      <li>New registrations: ${participants.length}</li>
      <li>Trade Prediction — Won: ${tradeWon}, Lost: ${tradeLost}</li>
      <li>Spin & Win — Won: ${spinWon}, Lost: ${spinLost}</li>
      <li>Prize claims pending: ${claimsPending}</li>
    </ul>
  `;

  return resend.emails.send({
    from: RESEND_FROM,
    to: recipients,
    subject: `MH Markets Expo — Daily Report ${date}`,
    html,
    attachments: [{ filename: `report-${date}.csv`, content: Buffer.from(csv).toString("base64") }],
  });
}
