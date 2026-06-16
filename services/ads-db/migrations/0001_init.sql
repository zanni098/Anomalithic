-- Anomalithic ad marketplace + wallet ledger (Supabase / PostgreSQL)
-- Phase 3 backend. Apply with `supabase db push` or paste into the SQL editor.
-- The 50/50 split and impression-replay protection are enforced in the schema.

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type ad_status        as enum ('active', 'paused', 'archived');
create type impression_status as enum ('pending', 'credited', 'rejected');
create type kyc_status       as enum ('none', 'lite', 'full');
create type payout_status    as enum ('queued', 'sent', 'failed');

-- ---------- advertisers ----------
create table advertisers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text not null unique,
  monthly_budget_cents integer not null default 0 check (monthly_budget_cents >= 0),
  created_at          timestamptz not null default now()
);

-- ---------- ads ----------
-- An ad is one short intro line + one link, shown only while an agent thinks.
create table ads (
  id              uuid primary key default gen_random_uuid(),
  advertiser_id   uuid not null references advertisers (id) on delete cascade,
  intro           text not null check (char_length(intro) <= 80),
  url             text not null,
  icon_url        text,
  status          ad_status not null default 'active',
  daily_cap_cents integer not null default 0 check (daily_cap_cents >= 0),
  created_at      timestamptz not null default now()
);
create index ads_advertiser_idx on ads (advertiser_id);
create index ads_status_idx on ads (status) where status = 'active';

-- ---------- watchers ----------
create table watchers (
  id             uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,            -- USDC-on-Base address
  kyc            kyc_status not null default 'none',
  country        text,
  created_at     timestamptz not null default now()
);

-- ---------- impressions (the redeemable unit) ----------
-- One row per verified thinking-window. The runtime signs each impression; the
-- ledger verifies the signature, then credits the watcher. Replay is blocked by
-- the unique signature and the unique (session_id, seq) pair.
create table impressions (
  id          uuid primary key default gen_random_uuid(),
  ad_id       uuid not null references ads (id) on delete restrict,
  watcher_id  uuid not null references watchers (id) on delete restrict,
  session_id  uuid not null,
  turn        integer not null,
  seq         integer not null,
  started_at  bigint not null,                    -- epoch ms (from the impression)
  dwell_ms    integer not null check (dwell_ms >= 0),
  signature   text not null,
  status      impression_status not null default 'pending',
  created_at  timestamptz not null default now(),
  constraint impressions_signature_unique unique (signature),
  constraint impressions_session_seq_unique unique (session_id, seq)
);
create index impressions_watcher_idx on impressions (watcher_id);
create index impressions_ad_idx on impressions (ad_id);

-- ---------- ledger (50/50 split) ----------
-- Created when an impression is credited. The split is enforced by a CHECK:
-- watcher and platform amounts must be equal and sum to the gross.
create table ledger (
  id             uuid primary key default gen_random_uuid(),
  impression_id  uuid not null references impressions (id) on delete cascade unique,
  gross_micro    bigint not null check (gross_micro >= 0),   -- micro-USDC (1e-6)
  watcher_micro  bigint not null check (watcher_micro >= 0),
  platform_micro bigint not null check (platform_micro >= 0),
  created_at     timestamptz not null default now(),
  constraint ledger_fifty_fifty
    check (watcher_micro = platform_micro and watcher_micro + platform_micro = gross_micro)
);

-- ---------- payouts ----------
create table payouts (
  id            uuid primary key default gen_random_uuid(),
  watcher_id    uuid not null references watchers (id) on delete restrict,
  amount_micro  bigint not null check (amount_micro > 0),
  tx_hash       text,
  status        payout_status not null default 'queued',
  created_at    timestamptz not null default now()
);
create index payouts_watcher_idx on payouts (watcher_id);

-- ---------- earnings view ----------
create view watcher_earnings as
select
  w.id   as watcher_id,
  w.wallet_address,
  coalesce(sum(l.watcher_micro), 0) as earned_micro,
  coalesce((select sum(p.amount_micro) from payouts p
            where p.watcher_id = w.id and p.status = 'sent'), 0) as paid_micro
from watchers w
left join impressions i on i.watcher_id = w.id and i.status = 'credited'
left join ledger l on l.impression_id = i.id
group by w.id, w.wallet_address;

-- ---------- row level security (sketch) ----------
-- Enable RLS; real policies bind to Supabase auth (advertiser/watcher identity).
alter table advertisers enable row level security;
alter table ads        enable row level security;
alter table watchers   enable row level security;
alter table impressions enable row level security;
alter table payouts    enable row level security;

-- Service-role (the ad-api) bypasses RLS and performs verification + crediting.
-- Example end-user policies (uncomment once auth mapping is wired):
-- create policy "advertiser reads own ads" on ads for select
--   using (advertiser_id = auth.uid());
-- create policy "watcher reads own impressions" on impressions for select
--   using (watcher_id = auth.uid());
-- create policy "watcher reads own payouts" on payouts for select
--   using (watcher_id = auth.uid());
