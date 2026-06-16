# ads-db — ad marketplace + wallet schema (Supabase)

> **Proprietary** (see [LICENSING.md](../../LICENSING.md)). This is the backend for
> the hosted Anomalithic ad network. The open runtime works fully without it.

The Postgres/Supabase schema that turns runtime-signed thinking-impressions into
real watcher payouts. It is the database half of Phase 3 in the
[roadmap](../../ROADMAP.md) and implements the redemption flow defined in the
[thinking-impressions spec](../../docs/specs/thinking-impressions.md).

## What it models

| Table | Purpose |
|---|---|
| `advertisers` | Who buys ad slots; monthly budget |
| `ads` | One short intro + one link, shown only while an agent thinks |
| `watchers` | People who earn, identified by a USDC-on-Base wallet |
| `impressions` | One verified thinking-window; **replay-proof** via unique `signature` and unique `(session_id, seq)` |
| `ledger` | The **50/50 split**, enforced by a `CHECK` (watcher = platform, summing to gross) |
| `payouts` | Stablecoin disbursements to watchers |
| `watcher_earnings` (view) | Earned vs. paid per watcher |

## Guarantees baked into the schema

- **No double-spend:** a signature can be inserted once; a `(session_id, seq)` pair once.
- **Exact 50/50:** the `ledger_fifty_fifty` CHECK constraint makes an uneven split impossible.
- **Auditable:** every credit is a ledger row tied to exactly one impression.

## Apply it

```bash
# with the Supabase CLI against a linked project:
supabase db push

# or paste services/ads-db/migrations/0001_init.sql into the SQL editor.
```

The service-role key (used only by the `ads-api` service) bypasses RLS to verify
signatures and credit impressions; end-user reads are gated by the RLS policies
sketched at the bottom of the migration.

## Verification (Phase 3 gate)

End-to-end on testnet: advertiser funds budget → agent thinks → runtime posts a
signed impression → `ads-api` verifies and credits → `ledger` row splits 50/50 →
`payouts` sends USDC. Forged or replayed impressions are rejected by the unique
constraints before any money moves.
