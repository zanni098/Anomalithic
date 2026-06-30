import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Biome is this project's linter; skip Next's duplicate ESLint pass (TS checks stay on).
  eslint: { ignoreDuringBuilds: true },
  // Pin the workspace root (multiple lockfiles exist on this machine).
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Allow embedding inside the Tauri desktop shell.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ]
  },
}

export default nextConfig
