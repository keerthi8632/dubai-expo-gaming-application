// The event runs on-site in Dubai, but the app may now run on a remote host
// whose system clock isn't set to Dubai time — so "now" as seen through the
// server process's own local getHours()/getMonth()/etc is not reliable for
// event-window or date-key logic. These helpers read wall-clock time in the
// venue's timezone explicitly, via Intl, regardless of the host's own TZ.
export const VENUE_TIMEZONE = "Asia/Dubai";

export type VenueTimeParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
};

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: VENUE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function getVenueTimeParts(date: Date): VenueTimeParts {
  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function venueDateKey(date: Date): string {
  const { year, month, day } = getVenueTimeParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function venueMinutesOfDay(date: Date): number {
  const { hour, minute } = getVenueTimeParts(date);
  return hour * 60 + minute;
}

// Midnight (venue-local) of the given instant, expressed as a real Date
// (still UTC-backed under the hood) — for range queries against timestamp
// columns like completedAt/createdAt, which are themselves real UTC
// instants. Asia/Dubai has no DST and a whole-hour offset (UTC+4), so this
// can compute it directly without a timezone conversion library.
export function venueStartOfDay(date: Date = new Date()): Date {
  const { year, month, day } = getVenueTimeParts(date);
  return new Date(Date.UTC(year, month - 1, day) - 4 * 60 * 60000);
}
