import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export so the Tauri desktop shell can bundle the UI (frontendDist = web/out).
  // The app is a client-rendered SPA that talks to the local runtime server, so static
  // export is a natural fit. CORS is handled by the runtime server (not the web app),
  // so no custom headers() are needed — and headers() is unsupported under `output: export`.
  output: "export",
  images: { unoptimized: true },
  // Biome is this project's linter; skip Next's duplicate ESLint pass (TS checks stay on).
  eslint: { ignoreDuringBuilds: true },
  // Pin the workspace root (multiple lockfiles exist on this machine).
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
}

export default nextConfig
