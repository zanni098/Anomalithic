import type { Metadata } from "next"
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
})
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  weight: ["400", "500", "600", "700"],
})
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] })

export const metadata: Metadata = {
  title: "Anomalithic — one agent to rule them all",
  description: "An open-core, model-agnostic multi-agent runtime. Premium harness, live swarm traces.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Restore the user's saved theme before paint to avoid a flash. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: tiny pre-paint theme bootstrap
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('anom-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}`,
          }}
        />
      </head>
      <body className={`${fraunces.variable} ${hanken.variable} ${mono.variable}`}>{children}</body>
    </html>
  )
}
