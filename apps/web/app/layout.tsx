import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anomalithic.dev"),
  title: "Anomalithic — one agent to rule them all",
  description:
    "An open-core, model-agnostic AI agent runtime. MCP, skills, hooks, multi-agent, cross-session memory — and a thinking-time ad network that pays watchers 50/50 in stablecoin.",
  openGraph: {
    title: "Anomalithic — one agent to rule them all",
    description: "Open-core, model-agnostic AI agent runtime with a thinking-time ad network.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
