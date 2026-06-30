import { describe, expect, test } from "vitest"
import { ImpressionSigner, generateImpressionKey, verifyImpression } from "../src/index.js"

describe("ImpressionSigner", () => {
  test("mints monotonically-sequenced impressions", () => {
    const signer = new ImpressionSigner(generateImpressionKey(), "sess-1")
    const a = signer.mint(0, 1000)
    const b = signer.mint(0, 1010)
    expect(a.seq).toBe(0)
    expect(b.seq).toBe(1)
    expect(a.sessionId).toBe("sess-1")
    expect(a.id).not.toBe(b.id)
  })

  test("a freshly minted impression verifies against its key", () => {
    const key = generateImpressionKey()
    const imp = new ImpressionSigner(key, "sess-2").mint(3, 2000)
    expect(verifyImpression(key, imp)).toBe(true)
  })

  test("rejects an impression signed with a different key", () => {
    const imp = new ImpressionSigner(generateImpressionKey(), "sess-3").mint(1, 3000)
    expect(verifyImpression(generateImpressionKey(), imp)).toBe(false)
  })

  test("rejects a tampered field", () => {
    const key = generateImpressionKey()
    const imp = new ImpressionSigner(key, "sess-4").mint(1, 4000)
    expect(verifyImpression(key, { ...imp, turn: 99 })).toBe(false)
    expect(verifyImpression(key, { ...imp, startedAt: 1 })).toBe(false)
    expect(verifyImpression(key, { ...imp, sessionId: "evil" })).toBe(false)
  })

  test("rejects a malformed signature without throwing", () => {
    const key = generateImpressionKey()
    const imp = new ImpressionSigner(key, "sess-5").mint(0, 5000)
    expect(verifyImpression(key, { ...imp, signature: "abcd" })).toBe(false)
  })
})
