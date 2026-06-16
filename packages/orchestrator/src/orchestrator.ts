import type { Agent } from "@anomalithic/core";
import { BudgetTracker } from "./budget.js";
import type { TaskStore } from "./store.js";
import type { Budget, Task } from "./types.js";

export interface OrchestratorOptions {
  store: TaskStore;
  makeAgent: (task: Task) => Agent;
  budget?: Budget;
}

export interface HeartbeatOptions {
  intervalMs?: number;
  maxIdleTicks?: number;
  concurrency?: number;
  signal?: AbortSignal;
  onTick?: (info: { tick: number; ran: number; pending: number }) => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Drives a team of agents through a dependency-ordered task queue under budget. */
export class Orchestrator {
  private readonly budget: BudgetTracker;

  constructor(private readonly opts: OrchestratorOptions) {
    this.budget = new BudgetTracker(opts.budget);
  }

  async runToCompletion(concurrency = 2): Promise<Task[]> {
    while (!this.budget.exceeded()) {
      const batch: Task[] = [];
      while (batch.length < concurrency && !this.budget.exceeded()) {
        const next = this.opts.store.checkout(`worker-${batch.length}`);
        if (!next) break;
        batch.push(next);
      }
      if (batch.length === 0) break;
      await Promise.all(batch.map((task) => this.runOne(task)));
    }
    return this.opts.store.list();
  }

  /**
   * Long-running loop for unattended work: drains ready tasks each tick, waits,
   * then keeps picking up newly-added tasks until idle for `maxIdleTicks`
   * (or aborted, or over budget). This is what lets a project run for hours/days.
   */
  async runHeartbeat(opts: HeartbeatOptions = {}): Promise<Task[]> {
    const intervalMs = opts.intervalMs ?? 1000;
    const maxIdle = opts.maxIdleTicks ?? 3;
    const concurrency = opts.concurrency ?? 2;
    let idle = 0;
    let tick = 0;

    const finished = () =>
      this.opts.store.list().filter((t) => t.status === "completed" || t.status === "failed")
        .length;

    while (!this.budget.exceeded()) {
      if (opts.signal?.aborted) break;
      tick += 1;
      const before = finished();
      await this.runToCompletion(concurrency);
      const ran = finished() - before;
      const pending = this.opts.store.list().filter((t) => t.status === "pending").length;
      opts.onTick?.({ tick, ran, pending });
      if (ran === 0) idle += 1;
      else idle = 0;
      if (idle >= maxIdle) break;
      await delay(intervalMs);
    }
    return this.opts.store.list();
  }

  private async runOne(task: Task): Promise<void> {
    try {
      const agent = this.opts.makeAgent(task);
      const result = await agent.run(task.prompt);
      this.budget.add(result.usage);
      this.budget.addTask();
      this.opts.store.complete(task.id, result.text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.opts.store.fail(task.id, message);
    }
  }
}
