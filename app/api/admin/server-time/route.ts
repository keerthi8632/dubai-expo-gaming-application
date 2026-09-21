import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getVenueTimeParts, venueDateKey, VENUE_TIMEZONE } from "@/lib/venueTime";

// Lets an admin confirm the deployed server's clock is sane before the event
// goes live, without needing SSH/log access to the host — game-win timing
// (jackpot day gate, prize queue windows, trade-prediction slots) is computed
// entirely from this server's system clock converted into venue-local time,
// never the kiosk tablet's own clock (see lib/venueTime.ts).
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  console.log("[admin/server-time] server clock:", now.toISOString(), "| venue (Dubai) date/time:", venueDateKey(now), getVenueTimeParts(now));

  return NextResponse.json({
    serverTimeUtc: now.toISOString(),
    venueTimezone: VENUE_TIMEZONE,
    venueDateKey: venueDateKey(now),
    venueTimeParts: getVenueTimeParts(now),
  });
}
