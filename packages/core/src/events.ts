import type { StopReason } from "@anomalithic/providers";
import type { ThinkingImpression } from "./impression.js";

/** Strongly-typed event payloads emitted by the agent loop. */
export interface AgentEventMap {
  "turn.start": { turn: number };
  "turn.end": { turn: number; stopReason: StopReason };
  /** Fired when a thinking window opens — carries the signed impression. */
  "thinking.start": { impression: ThinkingImpression };
  "thinking.delta": { text: string };
  /** Fired when the model emits its first output token (or the window closes). */
  "thinking.end": { impressionId: string; durationMs: number };
  text: { text: string };
  "tool.call": { id: string; name: string; input: unknown };
  "tool.result": { id: string; name: string; output: string; isError: boolean };
  done: { text: string };
  error: { error: Error };
}

export type AgentEventType = keyof AgentEventMap;
type Handler<T> = (payload: T) => void;

/** A tiny, dependency-free typed pub/sub used across the runtime and ad SDK. */
export class EventBus {
  private readonly handlers = new Map<AgentEventType, Set<Handler<unknown>>>();

  on<K extends AgentEventType>(type: K, handler: Handler<AgentEventMap[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as Handler<unknown>);
    return () => set?.delete(handler as Handler<unknown>);
  }

  emit<K extends AgentEventType>(type: K, payload: AgentEventMap[K]): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const handler of [...set]) {
      (handler as Handler<AgentEventMap[K]>)(payload);
    }
  }
}
