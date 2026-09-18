import type { Metadata, Viewport } from "next";
import { Inter, Orbitron, Space_Grotesk } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";
import KioskGuard from "@/components/KioskGuard";
import VersionLog from "@/components/VersionLog";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "MH Markets | Expo Prediction Challenge",
  description: "Trade Prediction Challenge and Spin & Win, live at the MH Markets expo booth.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/media/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://alphorix.net" />
      </head>
      <body className="bg-brand-black text-white min-h-screen font-sans">
        <VersionLog />
        <KioskGuard />
        {children}
      </body>
    </html>
  );
}
