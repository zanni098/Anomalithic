import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import type { Task } from "./types.js";

/** A durable task store with atomic checkout so no task is run twice. */
export class TaskStore {
  private readonly tasks = new Map<string, Task>();

  constructor(private readonly persistPath?: string) {
    if (persistPath) this.load();
  }

  create(input: { title: string; prompt: string; blockedBy?: string[] }): Task {
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      prompt: input.prompt,
      status: "pending",
      blockedBy: input.blockedBy ?? [],
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    this.persist();
    return task;
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  list(): Task[] {
    return [...this.tasks.values()];
  }

  /** Atomically claims the first ready task (all blockers completed). */
  checkout(owner: string): Task | undefined {
    for (const task of this.tasks.values()) {
      if (task.status !== "pending") continue;
      const ready = task.blockedBy.every((id) => this.tasks.get(id)?.status === "completed");
      if (!ready) continue;
      const claimed: Task = { ...task, status: "in_progress", owner };
      this.tasks.set(task.id, claimed);
      this.persist();
      return claimed;
    }
    return undefined;
  }

  complete(id: string, result: string): void {
    this.update(id, { status: "completed", result });
  }

  fail(id: string, error: string): void {
    this.update(id, { status: "failed", error });
  }

  update(id: string, patch: Partial<Task>): void {
    const task = this.tasks.get(id);
    if (!task) return;
    this.tasks.set(id, { ...task, ...patch });
    this.persist();
  }

  private persist(): void {
    if (!this.persistPath) return;
    writeFileSync(this.persistPath, JSON.stringify(this.list(), null, 2), "utf8");
  }

  private load(): void {
    if (!this.persistPath) return;
    try {
      const tasks = JSON.parse(readFileSync(this.persistPath, "utf8")) as Task[];
      for (const task of tasks) this.tasks.set(task.id, task);
    } catch {
      // no existing persisted file
    }
  }
}
