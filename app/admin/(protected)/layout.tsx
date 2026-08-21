import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminJwt, ADMIN_COOKIE } from "@/lib/adminAuth";
import AdminShell from "../AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const admin = token ? verifyAdminJwt(token) : null;

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
