import type { Budget } from "./types.js";

/** Tracks token and task spend against a budget with hard-stop checks. */
export class BudgetTracker {
  private tokens = 0;
  private tasks = 0;

  constructor(private readonly budget: Budget = {}) {}

  add(usage: { inputTokens: number; outputTokens: number }): void {
    this.tokens += usage.inputTokens + usage.outputTokens;
  }

  addTask(): void {
    this.tasks += 1;
  }

  spentTokens(): number {
    return this.tokens;
  }

  tasksDone(): number {
    return this.tasks;
  }

  exceeded(): boolean {
    if (this.budget.maxTokens !== undefined && this.tokens >= this.budget.maxTokens) return true;
    if (this.budget.maxTasks !== undefined && this.tasks >= this.budget.maxTasks) return true;
    return false;
  }
}
