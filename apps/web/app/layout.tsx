import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anomalithic.vercel.app"),
  title: "Anomalithic — one agent to rule them all",
  description:
    "An open-core, model-agnostic AI agent runtime. MCP, skills, hooks, multi-agent, cross-session memory, a visual agent builder — and a thinking-time ad network that pays watchers 50/50.",
  openGraph: {
    title: "Anomalithic",
    description: "One open-core, model-agnostic agent runtime to rule them all.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
