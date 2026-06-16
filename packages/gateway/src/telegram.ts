import type { ChannelAdapter, InboundMessage, OutboundMessage } from "./types.js";

interface TelegramUpdate {
  update_id: number;
  message?: { chat: { id: number }; text?: string; from?: { username?: string } };
}

/** Telegram Bot API adapter using long-polling over getUpdates. No SDK needed. */
export class TelegramAdapter implements ChannelAdapter {
  readonly name = "telegram";
  private offset = 0;
  private polling = false;

  constructor(
    private readonly token: string,
    private readonly api = "https://api.telegram.org",
  ) {
    if (!token) throw new Error("TelegramAdapter requires a bot token");
  }

  async start(onMessage: (message: InboundMessage) => void): Promise<void> {
    this.polling = true;
    void this.poll(onMessage);
  }

  private async poll(onMessage: (message: InboundMessage) => void): Promise<void> {
    while (this.polling) {
      try {
        const res = await fetch(
          `${this.api}/bot${this.token}/getUpdates?timeout=30&offset=${this.offset}`,
        );
        const body = (await res.json()) as { ok: boolean; result?: TelegramUpdate[] };
        for (const update of body.result ?? []) {
          this.offset = update.update_id + 1;
          const msg = update.message;
          if (msg?.text) {
            onMessage({
              channel: "telegram",
              chatId: String(msg.chat.id),
              text: msg.text,
              from: msg.from?.username,
            });
          }
        }
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  async send(message: OutboundMessage): Promise<void> {
    await fetch(`${this.api}/bot${this.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: message.chatId, text: message.text }),
    });
  }

  async stop(): Promise<void> {
    this.polling = false;
  }
}
