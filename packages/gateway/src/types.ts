export interface InboundMessage {
  channel: string;
  chatId: string;
  text: string;
  from?: string;
}

export interface OutboundMessage {
  chatId: string;
  text: string;
}

/** A messaging backend (Telegram, Slack, …). Adapters are sandboxed and pluggable. */
export interface ChannelAdapter {
  readonly name: string;
  start(onMessage: (message: InboundMessage) => void): Promise<void>;
  send(message: OutboundMessage): Promise<void>;
  stop(): Promise<void>;
}
