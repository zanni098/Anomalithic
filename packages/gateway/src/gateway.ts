import type { ChannelAdapter, InboundMessage } from "./types.js";

export interface GatewayOptions {
  adapters: ChannelAdapter[];
  /** Turn an inbound message into a reply (usually `agent.run(message.text)`). */
  handle: (message: InboundMessage) => Promise<string>;
  /** Optional error hook; defaults to logging to stderr. */
  onError?: (error: Error, message: InboundMessage) => void;
}

/** Wires every channel adapter to the agent: inbound → handle → reply. */
export class Gateway {
  constructor(private readonly opts: GatewayOptions) {}

  async start(): Promise<void> {
    for (const adapter of this.opts.adapters) {
      await adapter.start((message) => {
        void this.dispatch(adapter, message);
      });
    }
  }

  private async dispatch(adapter: ChannelAdapter, message: InboundMessage): Promise<void> {
    try {
      const reply = await this.opts.handle(message);
      await adapter.send({ chatId: message.chatId, text: reply });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (this.opts.onError) this.opts.onError(error, message);
      else process.stderr.write(`gateway error on ${adapter.name}: ${error.message}\n`);
    }
  }

  async stop(): Promise<void> {
    for (const adapter of this.opts.adapters) await adapter.stop();
  }
}
