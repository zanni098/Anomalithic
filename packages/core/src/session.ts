import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Message } from "@anomalithic/providers";
import type { ThinkingImpression } from "./impression.js";

/** A persisted agent session — enough to resume a run after a restart. */
export interface SessionState {
  id: string;
  model?: string;
  messages: Message[];
  impressions: ThinkingImpression[];
  turns: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  id: string;
  turns: number;
  updatedAt: string;
}

/** File-backed session store: one JSON file per session, resumable across restarts. */
export class SessionStore {
  constructor(private readonly dir: string) {}

  private path(id: string): string {
    return join(this.dir, `${id}.json`);
  }

  save(state: SessionState): void {
    mkdirSync(this.dir, { recursive: true });
    writeFileSync(this.path(state.id), JSON.stringify(state, null, 2), "utf8");
  }

  load(id: string): SessionState | undefined {
    try {
      return JSON.parse(readFileSync(this.path(id), "utf8")) as SessionState;
    } catch {
      return undefined;
    }
  }

  list(): SessionSummary[] {
    let names: string[] = [];
    try {
      names = readdirSync(this.dir);
    } catch {
      return [];
    }
    const out: SessionSummary[] = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const state = this.load(name.slice(0, -5));
      if (state) out.push({ id: state.id, turns: state.turns, updatedAt: state.updatedAt });
    }
    return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
