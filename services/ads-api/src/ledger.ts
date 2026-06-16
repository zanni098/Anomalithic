import { type ThinkingImpression, verifyImpression } from "@anomalithic/core";

export interface RedeemRequest {
  impression: ThinkingImpression;
  adId: string;
  watcherId: string;
  dwellMs: number;
}

export type RedeemResult =
  | { ok: true; watcherMicro: number; platformMicro: number }
  | { ok: false; reason: string };

export interface LedgerEntry {
  impressionId: string;
  adId: string;
  watcherId: string;
  watcherMicro: number;
  platformMicro: number;
}

export interface AdLedgerOptions {
  /** Server-held key that the runtime's impressions are signed with. */
  signingKey: string;
  /** Gross price per impression, in micro-USDC (1e-6). Default 1000 = $0.001. */
  pricePerImpressionMicro?: number;
  /** Minimum thinking dwell to count, in ms. */
  minDwellMs?: number;
}

/**
 * In-memory ad ledger enforcing the same guarantees as the Supabase schema:
 * signature verification, replay protection (nonce + monotonic seq), a dwell
 * floor, and an exact 50/50 split. Swap the maps for Postgres to go durable.
 */
export class AdLedger {
  private readonly redeemed = new Set<string>();
  private readonly seqBySession = new Map<string, number>();
  private readonly entries: LedgerEntry[] = [];

  constructor(private readonly opts: AdLedgerOptions) {}

  redeem(req: RedeemRequest): RedeemResult {
    const price = this.opts.pricePerImpressionMicro ?? 1000;
    const minDwell = this.opts.minDwellMs ?? 500;

    if (!verifyImpression(this.opts.signingKey, req.impression)) {
      return { ok: false, reason: "bad_signature" };
    }
    if (this.redeemed.has(req.impression.id)) {
      return { ok: false, reason: "replay" };
    }
    const lastSeq = this.seqBySession.get(req.impression.sessionId) ?? -1;
    if (req.impression.seq <= lastSeq) {
      return { ok: false, reason: "stale_seq" };
    }
    if (req.dwellMs < minDwell) {
      return { ok: false, reason: "dwell_too_short" };
    }

    this.redeemed.add(req.impression.id);
    this.seqBySession.set(req.impression.sessionId, req.impression.seq);
    const watcherMicro = Math.floor(price / 2);
    const platformMicro = price - watcherMicro;
    this.entries.push({
      impressionId: req.impression.id,
      adId: req.adId,
      watcherId: req.watcherId,
      watcherMicro,
      platformMicro,
    });
    return { ok: true, watcherMicro, platformMicro };
  }

  ledger(): LedgerEntry[] {
    return [...this.entries];
  }

  earningsMicro(watcherId: string): number {
    return this.entries
      .filter((e) => e.watcherId === watcherId)
      .reduce((sum, e) => sum + e.watcherMicro, 0);
  }
}
