import type { ChannelAdapter, InboundMessage, OutboundMessage } from "./types.js";

/** In-memory adapter for tests and local development. */
export class MockAdapter implements ChannelAdapter {
  readonly name = "mock";
  readonly sent: OutboundMessage[] = [];
  private handler?: (message: InboundMessage) => void;

  async start(onMessage: (message: InboundMessage) => void): Promise<void> {
    this.handler = onMessage;
  }

  /** Simulate an inbound message from a user. */
  receive(text: string, chatId = "test"): void {
    this.handler?.({ channel: "mock", chatId, text });
  }

  async send(message: OutboundMessage): Promise<void> {
    this.sent.push(message);
  }

  async stop(): Promise<void> {
    this.handler = undefined;
  }
}
