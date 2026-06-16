import type { ChannelAdapter, InboundMessage, OutboundMessage } from "./types.js";

interface SlackEvent {
  channel?: string;
  text?: string;
  user?: string;
  bot_id?: string;
}

/**
 * Slack adapter. Outbound via chat.postMessage; inbound is webhook-driven — feed
 * your Events API payload's `event` object to {@link SlackAdapter.ingest}.
 */
export class SlackAdapter implements ChannelAdapter {
  readonly name = "slack";
  private handler?: (message: InboundMessage) => void;

  constructor(private readonly botToken: string) {}

  async start(onMessage: (message: InboundMessage) => void): Promise<void> {
    this.handler = onMessage;
  }

  async send(message: OutboundMessage): Promise<void> {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.botToken}` },
      body: JSON.stringify({ channel: message.chatId, text: message.text }),
    });
  }

  /** Dispatch an inbound message from a Slack Events API `event` payload. */
  ingest(event: SlackEvent): void {
    if (event.bot_id || !event.text || !event.channel) return;
    this.handler?.({ channel: "slack", chatId: event.channel, text: event.text, from: event.user });
  }

  async stop(): Promise<void> {
    this.handler = undefined;
  }
}
