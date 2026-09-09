import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/adminCookie";

// Edge runtime can't run jsonwebtoken (needs Node's crypto), so this only checks
// cookie presence for a fast redirect. Real signature verification happens in
// app/admin/layout.tsx (Node runtime) and in every /api/admin/* route via requireAdmin().
export function middleware(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/((?!login).*)"],
};
