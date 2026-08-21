"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Hardens the app for unattended kiosk tablets: enters fullscreen on first
 * touch, blocks the context menu, and traps back-navigation so a swipe/
 * button press can't take a booth visitor out of the game.
 *
 * Disabled on /admin routes — admins need normal browser chrome, right-click,
 * and back navigation while managing the booth from their own device.
 */
export default function KioskGuard() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    const requestFullscreen = () => {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };
      if (!document.fullscreenElement) {
        (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.())?.catch(() => {});
      }
    };

    const blockContextMenu = (e: Event) => e.preventDefault();

    // Trap the back button/gesture: keep re-pushing a history entry so
    // popstate never actually navigates away from the app.
    history.pushState(null, "", location.href);
    const trapBack = () => history.pushState(null, "", location.href);

    document.addEventListener("click", requestFullscreen);
    document.addEventListener("touchstart", requestFullscreen, { once: true });
    document.addEventListener("contextmenu", blockContextMenu);
    window.addEventListener("popstate", trapBack);

    return () => {
      document.removeEventListener("click", requestFullscreen);
      document.removeEventListener("touchstart", requestFullscreen);
      document.removeEventListener("contextmenu", blockContextMenu);
      window.removeEventListener("popstate", trapBack);
    };
  }, [isAdmin]);

  return null;
}
