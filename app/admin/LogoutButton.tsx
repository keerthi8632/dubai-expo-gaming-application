"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      className="w-full rounded-lg bg-white/10 px-3 py-2 text-left text-sm hover:bg-white/20"
    >
      Logout
    </button>
  );
}
