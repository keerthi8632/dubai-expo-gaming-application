import type { Metadata } from "next";
import { Inter, Orbitron, Space_Grotesk } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "MH Markets | Expo Prediction Challenge",
  description: "Trade Prediction Challenge and Spin & Win, live at the MH Markets expo booth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://alphorix.net" />
      </head>
      <body className="bg-brand-black text-white min-h-screen font-sans">{children}</body>
    </html>
  );
}
