import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * A signed proof that the agent genuinely entered a "thinking" window (a real
 * provider round-trip). This is the unit the ad layer (Phase 3) will redeem:
 * impressions can only be minted by the runtime, never spoofed by a client timer.
 */
export interface ThinkingImpression {
  id: string;
  sessionId: string;
  turn: number;
  seq: number;
  /** Epoch milliseconds when the thinking window opened. */
  startedAt: number;
  signature: string;
}

function canonical(imp: Omit<ThinkingImpression, "signature">): string {
  return `${imp.id}.${imp.sessionId}.${imp.turn}.${imp.seq}.${imp.startedAt}`;
}

function sign(key: string, imp: Omit<ThinkingImpression, "signature">): string {
  return createHmac("sha256", key).update(canonical(imp)).digest("hex");
}

/** Generates a random runtime signing key (hex). */
export function generateImpressionKey(): string {
  return randomBytes(32).toString("hex");
}

/** Mints monotonically-sequenced, signed impressions for a single session. */
export class ImpressionSigner {
  private seq = 0;

  constructor(
    private readonly key: string,
    private readonly sessionId: string,
  ) {}

  mint(turn: number, startedAt: number): ThinkingImpression {
    const base = { id: randomUUID(), sessionId: this.sessionId, turn, seq: this.seq++, startedAt };
    return { ...base, signature: sign(this.key, base) };
  }
}

/** Server-side check used by the ad ledger before crediting an impression. */
export function verifyImpression(key: string, imp: ThinkingImpression): boolean {
  const expected = sign(key, {
    id: imp.id,
    sessionId: imp.sessionId,
    turn: imp.turn,
    seq: imp.seq,
    startedAt: imp.startedAt,
  });
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(imp.signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
