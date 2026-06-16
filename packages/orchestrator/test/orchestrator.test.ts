import { Agent } from "@anomalithic/core";
import { MockProvider } from "@anomalithic/providers";
import { describe, expect, it } from "vitest";
import { Orchestrator } from "../src/orchestrator.js";
import { TaskStore } from "../src/store.js";

function makeAgent(): Agent {
  return new Agent({ provider: new MockProvider([{ text: "done" }]), model: "mock" });
}

describe("Orchestrator", () => {
  it("runs tasks in dependency order", async () => {
    const store = new TaskStore();
    const a = store.create({ title: "A", prompt: "do a" });
    store.create({ title: "B", prompt: "do b", blockedBy: [a.id] });

    const orchestrator = new Orchestrator({ store, makeAgent: () => makeAgent() });
    const tasks = await orchestrator.runToCompletion(2);

    expect(tasks.every((t) => t.status === "completed")).toBe(true);
    expect(tasks.find((t) => t.title === "A")?.result).toBe("done");
  });

  it("stops when the task budget is exceeded", async () => {
    const store = new TaskStore();
    const a = store.create({ title: "A", prompt: "do a" });
    store.create({ title: "B", prompt: "do b", blockedBy: [a.id] });

    const orchestrator = new Orchestrator({
      store,
      makeAgent: () => makeAgent(),
      budget: { maxTasks: 1 },
    });
    await orchestrator.runToCompletion(2);

    const statuses = store.list().map((t) => t.status);
    expect(statuses.filter((s) => s === "completed")).toHaveLength(1);
    expect(statuses.filter((s) => s === "pending")).toHaveLength(1);
  });

  it("runHeartbeat drains ready tasks then stops when idle", async () => {
    const store = new TaskStore();
    store.create({ title: "A", prompt: "do a" });
    const ran: number[] = [];
    const orchestrator = new Orchestrator({ store, makeAgent: () => makeAgent() });
    const tasks = await orchestrator.runHeartbeat({
      intervalMs: 5,
      maxIdleTicks: 1,
      onTick: (i) => ran.push(i.ran),
    });
    expect(tasks.every((t) => t.status === "completed")).toBe(true);
    expect(ran[0]).toBe(1);
  });
});
