"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "./icons";

type Props = {
  // "" means unset/today, otherwise "YYYY-MM-DD" — same convention the admin
  // date filters already use, so this drops straight into existing state.
  value: string;
  onChange: (value: string) => void;
  // Latest selectable date, "YYYY-MM-DD" — e.g. today, so a leaderboard/queue
  // date filter can't be pushed into the future.
  max?: string;
  placeholder?: string;
  // "dark" for glassy venue-screen surfaces (leaderboard), "light" for the
  // white admin-panel cards — matches AdminSelect's own light styling.
  theme?: "dark" | "light";
  className?: string;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

function formatDisplay(key: string): string {
  const parsed = parseDateKey(key);
  if (!parsed) return "";
  const d = new Date(parsed.year, parsed.month, parsed.day);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function DatePicker({ value, onChange, max, placeholder = "Select date", theme = "light", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const selected = parseDateKey(value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(selected?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.month ?? today.getMonth());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const parsed = parseDateKey(value);
    setViewYear(parsed?.year ?? today.getFullYear());
    setViewMonth(parsed?.month ?? today.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync the calendar's visible month when the popover opens
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const maxParsed = max ? parseDateKey(max) : null;
  const maxKey = maxParsed ? toDateKey(maxParsed.year, maxParsed.month, maxParsed.day) : null;

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const cells: (number | null)[] = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function goToMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  function pick(day: number) {
    const key = toDateKey(viewYear, viewMonth, day);
    if (maxKey && key > maxKey) return;
    onChange(key);
    setOpen(false);
  }

  function pickToday() {
    onChange("");
    setOpen(false);
  }

  const dark = theme === "dark";

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
          dark
            ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
            : "border border-black/10 bg-white text-black hover:border-black/20"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 shrink-0 ${dark ? "text-white/70" : "text-black/50"}`}>
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={value ? "" : dark ? "text-white/50" : "text-black/40"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border p-4 shadow-xl backdrop-blur-md ${
            dark ? "border-white/15 bg-[#1a0708]/95 text-white" : "border-black/10 bg-white text-black"
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              className={`rounded-lg p-1.5 transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              className={`rounded-lg p-1.5 transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className={`mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase ${dark ? "text-white/40" : "text-black/40"}`}>
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={i} />;
              const key = toDateKey(viewYear, viewMonth, day);
              const isSelected = key === value;
              const isToday = key === toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
              const isFuture = !!maxKey && key > maxKey;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isFuture}
                  onClick={() => pick(day)}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected
                      ? "bg-brand-red font-bold text-white"
                      : isFuture
                        ? dark
                          ? "cursor-not-allowed text-white/20"
                          : "cursor-not-allowed text-black/20"
                        : dark
                          ? "hover:bg-white/15"
                          : "hover:bg-black/5"
                  } ${isToday && !isSelected ? (dark ? "ring-1 ring-white/40" : "ring-1 ring-black/20") : ""}`}
                >
                  {day}
                  {isSelected && <Check className="absolute -bottom-1 h-2.5 w-2.5" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={pickToday}
            className={`mt-3 w-full rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              dark ? "bg-white/10 hover:bg-white/15" : "bg-black/5 hover:bg-black/10"
            }`}
          >
            Jump to Today
          </button>
        </div>
      )}
    </div>
  );
}
