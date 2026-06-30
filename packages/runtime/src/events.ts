import type { RuntimeEvent, RuntimeEventType } from "./types.js"

type Listener<E extends RuntimeEvent = RuntimeEvent> = (event: E) => void
type Extract<T extends RuntimeEventType> = stractByType<RuntimeEvent, T>
type stractByType<E, T> = E extends { type: T } ? E : never

/**
 * Tiny dependency-free typed pub/sub. The agent loop publishes; the CLI renderer,
 * the streaming server, and the UI are all just subscribers — they never touch the
 * loop. Mirrors the design's "typed event bus" decision.
 */
export class EventBus {
  private readonly all = new Set<Listener>()
  private readonly byType = new Map<RuntimeEventType, Set<Listener>>()

  emit(event: RuntimeEvent): void {
    for (const fn of this.all) fn(event)
    const set = this.byType.get(event.type)
    if (set) for (const fn of set) fn(event)
  }

  /** Subscribe to every event. Returns an unsubscribe function. */
  onAny(fn: Listener): () => void {
    this.all.add(fn)
    return () => this.all.delete(fn)
  }

  /** Subscribe to one event type. Returns an unsubscribe function. */
  on<T extends RuntimeEventType>(type: T, fn: (event: Extract<T>) => void): () => void {
    let set = this.byType.get(type)
    if (!set) {
      set = new Set()
      this.byType.set(type, set)
    }
    set.add(fn as Listener)
    return () => set?.delete(fn as Listener)
  }
}
