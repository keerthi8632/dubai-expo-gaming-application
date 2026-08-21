"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "./icons";

export type FlagOption = { iso2: string; value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: FlagOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export default function FlagSelect({ value, onChange, options, placeholder, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.iso2.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="flex h-12 w-full items-center gap-2 rounded-lg border border-black/20 bg-white px-3 text-left text-[14px] leading-[21px] text-black disabled:bg-black/5 disabled:text-black/40"
      >
        {selected && <span className={`fi fi-${selected.iso2.toLowerCase()} h-5 w-5 shrink-0 rounded-full bg-cover`} />}
        <span className="flex-1 truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-black" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-full min-w-[220px] overflow-hidden rounded-lg border border-black/20 bg-white shadow-lg">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full border-b border-black/10 px-3 py-2 text-[14px] text-black outline-none"
          />
          <div className="max-h-[130px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-[13px] text-black/40">No matches.</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.iso2}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-black hover:bg-black/5"
                >
                  <span className={`fi fi-${o.iso2.toLowerCase()} h-5 w-5 shrink-0 rounded-full bg-cover`} />
                  <span className="truncate">{o.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
