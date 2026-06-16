import type { Agent } from "@anomalithic/core";
import { BudgetTracker } from "./budget.js";
import type { TaskStore } from "./store.js";
import type { Budget, Task } from "./types.js";

export interface OrchestratorOptions {
  store: TaskStore;
  makeAgent: (task: Task) => Agent;
  budget?: Budget;
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
