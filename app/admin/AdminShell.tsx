"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const NAV_LINKS = [
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/config", label: "Game Config" },
  { href: "/admin/winners", label: "Winners" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-black px-4 text-white md:hidden">
        <span className="text-base font-bold text-brand-red">MH Markets</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
        >
          <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-20 flex h-screen w-64 shrink-0 transform flex-col bg-black text-white transition-transform duration-200 md:static md:h-auto md:w-56 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="hidden px-5 py-6 text-lg font-bold text-brand-red md:block">MH Markets</div>
        <nav className="flex flex-col gap-1 px-3 pt-20 text-sm md:pt-3">
          {NAV_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 ${active ? "bg-brand-red text-white" : "hover:bg-white/10"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-3 py-4">
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 pt-20 sm:p-6 md:p-8 md:pt-8">{children}</main>
    </div>
  );
}
