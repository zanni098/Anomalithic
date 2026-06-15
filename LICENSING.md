# Licensing (Open-Core)

Anomalithic uses an **open-core** model.

## Open source — Apache License 2.0

Everything required to run a capable agent locally is open source under the
[Apache-2.0 license](./LICENSE):

- `packages/*` — the runtime (`providers`, `core`, `cli`, and future `mcp`,
  `skills`, `hooks`, `memory`, `orchestrator`, `gateway`, `sdk`, `tui`)
- `apps/desktop` — the desktop shell (when added)
- `services/ads-sdk` — the thin client that renders ads and reports impressions

You can self-host, fork, and embed these freely under the Apache-2.0 terms.

## Proprietary — hosted services

The commercial services that operate the ad network are **not** open source:

- `services/ads-api` — ad inventory, serving, and impression verification
- `services/advertiser-portal` — advertiser onboarding, billing, analytics
- `services/wallet` — stablecoin custody/settlement, the 50/50 split, payouts

These power the official hosted ad marketplace and are the project's revenue moat.
The open packages can run completely without them (ads off).

## Why this split

The open runtime drives adoption and contribution; the hosted ad/payout platform
funds development. The signed-impression format
([docs/specs/thinking-impressions.md](./docs/specs/thinking-impressions.md)) is an
open contract, so anyone can build a compatible, independent ad network on top of
the open runtime.
