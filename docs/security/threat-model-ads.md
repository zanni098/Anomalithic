# Threat Model (stub): Ads & Payouts

Status: **stub** — expanded and gated before any real payout (Phase 3). This exists
now so the design builds toward it.

## Assets
- Watcher payout balances (real money in stablecoin).
- Advertiser budgets / funds.
- The impression-signing key(s).
- Reputation/trust of the network.

## Primary adversary: the fraudulent watcher
Wants to earn payouts without genuine ad exposure.

| Attack | Mitigation |
|---|---|
| Fake "I watched an ad" reports | Impressions must be **runtime-signed**; `ads-api` verifies signature ([spec](../specs/thinking-impressions.md)). |
| Replay a valid impression many times | One-time `id` nonce + strictly increasing `(sessionId, seq)`; redeemed nonces are stored. |
| Spin sessions in a tight loop to mint impressions | Min thinking-dwell floor; per-session & per-watcher rate limits; velocity anomaly detection. |
| Steal/extract the signing key from a client | Server-derived per-session keys; clients never hold a global forgeable key. |
| Headless bot farms | KYC-lite + device/IP heuristics + payout thresholds + manual review queue for outliers. |

## Secondary adversaries
- **Fraudulent advertiser:** malware/scam links → ad content review, URL reputation, allhowlist of schemes, takedown flow.
- **Malicious operator of a forked network:** the open spec lets anyone run a network; the *official* payout ledger is proprietary and authoritative for our payouts only.
- **Compromised dependency / supply chain:** lockfile pinning, provenance, minimal deps in the open runtime.

## Compliance gates (must clear before payouts go live)
- AML/KYC obligations for paying individuals; sanctions/geo screening.
- Tax treatment & reporting for watcher earnings by jurisdiction.
- Per-LLM-provider ToS: confirm ad-funded inference resale is permitted before enabling ads on that backend.

## Out of scope (for now)
- On-chain MEV / settlement-layer attacks (revisit when wallet design lands).
- Formal economic modeling of payout equilibrium.
