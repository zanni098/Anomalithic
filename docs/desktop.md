# Desktop app (Tauri)

`apps/desktop` is the native Anomalithic desktop shell, built with **Tauri 2**. It
produces small, native installers for Windows, macOS, and Linux from one codebase
and a static web UI (`apps/desktop/ui`).

## Producing installers (CI)

Installers are built by the [`Release Desktop`](../.github/workflows/release.yml)
workflow — you cannot build a macOS `.dmg` on Windows, so a release matrix on GitHub
runners is the correct mechanism:

```bash
git tag v0.1.0
git push --tags        # → builds .msi, .dmg, .deb / AppImage → draft GitHub Release
```

The workflow runs `tauri icon app-icon.png` to expand the single source icon into
every platform format, then `tauri-action` builds and attaches:

| Platform | Artifacts |
|---|---|
| Windows | `.msi` (WiX) and `.exe` (NSIS) |
| macOS | `.dmg` and `.app` (Apple silicon + Intel) |
| Linux | `.deb` and `.AppImage` |

## Building locally

Requires the [Tauri prerequisites](https://tauri.app/start/prerequisites/) (Rust +
your platform's webview/build tools):

```bash
pnpm install
pnpm --filter @anomalithic/desktop exec tauri icon app-icon.png   # first time
pnpm --filter @anomalithic/desktop dev      # run the app
pnpm --filter @anomalithic/desktop build    # build an installer for your OS
```

## Status

v0.1 is the native shell: branded console UI plus a working native bridge
(`runtime_info` command). Wiring the local agent runtime (provider keys, sessions,
skills, memory) into the desktop UI is tracked on the [roadmap](../ROADMAP.md).
