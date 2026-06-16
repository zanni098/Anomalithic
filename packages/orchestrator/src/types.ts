export type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

export interface Task {
  id: string;
  title: string;
  prompt: string;
  status: TaskStatus;
  owner?: string;
  /** Ids of tasks that must complete before this one can be checked out. */
  blockedBy: string[];
  result?: string;
  error?: string;
  /** ISO timestamp. */
  createdAt: string;
}

export interface Budget {
  maxTokens?: number;
  maxTasks?: number;
}
