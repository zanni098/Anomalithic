import { ImpressionSigner } from "@anomalithic/core";
import { describe, expect, it } from "vitest";
import { AdLedger } from "../src/ledger.js";

const KEY = "server-signing-key";

describe("AdLedger", () => {
  it("credits a valid impression 50/50 and blocks replay", () => {
    const ledger = new AdLedger({ signingKey: KEY, pricePerImpressionMicro: 1000 });
    const signer = new ImpressionSigner(KEY, "sess-1");
    const imp = signer.mint(1, 1_750_000_000_000);

    const ok = ledger.redeem({ impression: imp, adId: "ad1", watcherId: "w1", dwellMs: 1500 });
    expect(ok).toEqual({ ok: true, watcherMicro: 500, platformMicro: 500 });
    expect(ledger.earningsMicro("w1")).toBe(500);

    const replay = ledger.redeem({ impression: imp, adId: "ad1", watcherId: "w1", dwellMs: 1500 });
    expect(replay).toEqual({ ok: false, reason: "replay" });
  });

  it("rejects forged signatures and too-short dwell", () => {
    const ledger = new AdLedger({ signingKey: KEY });
    const forged = new ImpressionSigner("wrong-key", "sess-2").mint(1, 1_750_000_000_000);
    expect(ledger.redeem({ impression: forged, adId: "a", watcherId: "w", dwellMs: 999 })).toEqual({
      ok: false,
      reason: "bad_signature",
    });

    const real = new ImpressionSigner(KEY, "sess-3").mint(1, 1_750_000_000_000);
    expect(ledger.redeem({ impression: real, adId: "a", watcherId: "w", dwellMs: 100 })).toEqual({
      ok: false,
      reason: "dwell_too_short",
    });
  });
});
