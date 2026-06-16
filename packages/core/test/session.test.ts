import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MockProvider } from "@anomalithic/providers";
import { describe, expect, it } from "vitest";
import { Agent } from "../src/agent.js";
import { SessionStore } from "../src/session.js";

describe("SessionStore", () => {
  it("saves, loads, and lists sessions", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anomalithic-sess-"));
    const store = new SessionStore(dir);
    store.save({
      id: "abc",
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      impressions: [],
      turns: 1,
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:01.000Z",
    });
    expect(store.load("abc")?.turns).toBe(1);
    expect(store.list().map((s) => s.id)).toEqual(["abc"]);
    expect(store.load("missing")).toBeUndefined();
  });
});

describe("Agent onTurnEnd", () => {
  it("fires a snapshot per turn and persists a resumable session", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anomalithic-sess2-"));
    const store = new SessionStore(dir);
    const snapshots: number[] = [];

    const agent = new Agent({
      provider: new MockProvider([{ text: "done" }]),
      model: "mock",
      sessionId: "run-1",
      onTurnEnd: (snap) => {
        snapshots.push(snap.turn);
        store.save({
          id: "run-1",
          model: "mock",
          messages: snap.messages,
          impressions: snap.impressions,
          turns: snap.turn,
          createdAt: "2026-06-16T00:00:00.000Z",
          updatedAt: "2026-06-16T00:00:02.000Z",
        });
      },
    });

    await agent.run("start");
    expect(snapshots).toEqual([1]);
    const saved = store.load("run-1");
    expect(saved?.turns).toBe(1);
    expect(saved?.messages.at(-1)?.role).toBe("assistant");
  });
});
