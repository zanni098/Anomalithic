import type { ChannelAdapter, InboundMessage, OutboundMessage } from "./types.js";

interface DiscordMessage {
  channel_id?: string;
  content?: string;
  author?: { id?: string; bot?: boolean };
}

/**
 * Discord adapter. Outbound via the bot REST API; inbound is gateway/webhook-driven —
 * feed a message-create payload to {@link DiscordAdapter.ingest}.
 */
export class DiscordAdapter implements ChannelAdapter {
  readonly name = "discord";
  private handler?: (message: InboundMessage) => void;

  constructor(
    private readonly botToken: string,
    private readonly apiBase = "https://discord.com/api/v10",
  ) {}

  async start(onMessage: (message: InboundMessage) => void): Promise<void> {
    this.handler = onMessage;
  }

  async send(message: OutboundMessage): Promise<void> {
    await fetch(`${this.apiBase}/channels/${message.chatId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bot ${this.botToken}` },
      body: JSON.stringify({ content: message.text }),
    });
  }

  /** Dispatch an inbound message from a Discord MESSAGE_CREATE payload. */
  ingest(message: DiscordMessage): void {
    if (message.author?.bot || !message.content || !message.channel_id) return;
    this.handler?.({
      channel: "discord",
      chatId: message.channel_id,
      text: message.content,
      from: message.author?.id,
    });
  }

  async stop(): Promise<void> {
    this.handler = undefined;
  }
}
