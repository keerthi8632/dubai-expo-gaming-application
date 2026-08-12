import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyAdminJwt, ADMIN_COOKIE } from "@/lib/adminAuth";
import LogoutButton from "../LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const admin = token ? verifyAdminJwt(token) : null;

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <aside className="w-56 shrink-0 bg-black text-white">
        <div className="px-5 py-6 text-lg font-bold text-brand-red">MH Markets</div>
        <nav className="flex flex-col gap-1 px-3 text-sm">
          <NavLink href="/admin/participants">Participants</NavLink>
          <NavLink href="/admin/config">Game Config</NavLink>
          <NavLink href="/admin/winners">Winners</NavLink>
          <NavLink href="/admin/reports">Reports</NavLink>
        </nav>
        <div className="mt-auto px-3 py-4">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg px-3 py-2 hover:bg-white/10">
      {children}
    </Link>
  );
}
