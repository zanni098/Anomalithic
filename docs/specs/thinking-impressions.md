# Spec: Thinking-Impressions & Ad Events

Status: **stable contract (v1)** — implemented in `packages/core/src/impression.ts`.

This is the contract the ad marketplace (Phase 3) builds on. It is intentionally
frozen now so later phases — and third parties — can build compatible ad networks.

## Why impressions are signed

The killer feature pays watchers for ad views that happen *only while the agent is
thinking*. If a client could simply assert "I showed an ad for 3 seconds," the
economy would be trivially defraudable. So an impression is a **runtime-minted,
signed token** proving a real provider round-trip occurred.

## The `ThinkingImpression` object

```jsonc
{
  "id": "550e8400-e29b-41d4-a716-446655440000", // uuid v4 nonce, unique per window
  "sessionId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "turn": 1,            // 1-based provider round-trip index within the session
  "seq": 0,             // 0-based monotonic counter within the session
  "startedAt": 1750000000000, // epoch milliseconds the thinking window opened
  "signature": "9f86d081...<hex>" // HMAC-SHA256 over the canonical string
}
```

### Canonical signing string
```
`${id}.${sessionId}.${turn}.${seq}.${startedAt}`
```
Signed with HMAC-SHA256 using a runtime-held key. `verifyImpression(key, imp)`
recomputes and compares in constant time (`crypto.timingSafeEqual`).

### Lifecycle (event bus)
- `thinking.start` → `{ impression }` — window opens at the start of a round-trip.
- `thinking.end` → `{ impressionId, durationMs }` — at first output token / window close.

The `durationMs` is what the ledger checks against a minimum-dwell floor.

## Redemption flow (Phase 3, normative)

1. Client renders one ad on `thinking.start`; stops on `thinking.end`.
2. Client posts `{ impression, adId, watcherId, dwellMs }` to `ads-api`.
3. `ads-api` MUST reject unless ALL hold:
   - `verifyImpression(serverKey, impression)` is true (server holds/derives the key).
   - `impression.id` has not been redeemed before (nonce replay protection).
   - `(sessionId, seq)` is strictly increasing and not reused.
   - `dwellMs ≥ MIN_DWELL_MS` and `dwellMs ≤ MAX_DWELL_MS`.
   - per-session / per-watcher redemption rate is under limits.
4. On accept: credit watcher 50%, platform 50%; record in the payout ledger.

## Key management (Phase 3)

Phase 0 generates a per-session key in-process (good enough to prove the format).
Phase 3 derives the per-session key from a server-issued session secret so the
server can verify without the client ever holding a forgeable global key. See the
[ads threat model](../security/threat-model-ads.md).

## Versioning

Breaking changes bump the spec version and add a `v` field to the object. v1 has no
`v` field (implicit 1).
