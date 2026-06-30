# @anomalithic/desktop

A Tauri shell that renders the Anomalithic web UI (`apps/web`) as a native desktop
app and talks to the local runtime server for streaming swarm traces.

## Run (development)

```bash
# 1. start the runtime API (in the repo root)
node apps/cli/dist/index.js serve            # http://127.0.0.1:4517

# 2. launch the desktop app (starts the web UI automatically via beforeDevCommand)
pnpm --filter @anomalithic/desktop dev
```

The window loads `http://localhost:4520` (the Next.js UI), which streams traces from
the runtime at `127.0.0.1:4517`.

## Package native installers

```bash
pnpm --filter @anomalithic/desktop tauri:build   # .msi / .dmg / .deb / AppImage
```

> **Status:** the shell is configured and the UI it renders is verified live in the
> browser. Native compilation requires the Rust toolchain (`cargo`) and platform icons
> under `src-tauri/icons/`; it was **not** compiled in the rebuild session, so treat the
> native build as pending verification on a machine with Rust installed. Production
> bundling also expects a static export of the web app at `apps/web/out` (run
> `next build` with `output: "export"`), or point `frontendDist` at a served URL.
