import { type ChildProcessByStdio, spawn } from "node:child_process";
import type { Readable, Writable } from "node:stream";

export interface Transport {
  send(msg: unknown): void;
  onMessage(cb: (msg: unknown) => void): void;
  close(): void;
}

/** Newline-delimited JSON over a child process's stdio (the MCP stdio transport). */
export class StdioTransport implements Transport {
  private readonly child: ChildProcessByStdio<Writable, Readable, null>;
  private readonly listeners: ((msg: unknown) => void)[] = [];
  private buffer = "";

  constructor(command: string, args: string[] = [], env?: Record<string, string>) {
    this.child = spawn(command, args, {
      stdio: ["pipe", "pipe", "ignore"],
      env: env ? { ...process.env, ...env } : process.env,
    });
    this.child.stdout.on("data", (chunk: Buffer) => this.onData(chunk.toString("utf8")));
  }

  private onData(text: string): void {
    this.buffer += text;
    let newline = this.buffer.indexOf("\n");
    while (newline !== -1) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (line) {
        try {
          const msg = JSON.parse(line);
          for (const listener of this.listeners) listener(msg);
        } catch {
          // ignore malformed line
        }
      }
      newline = this.buffer.indexOf("\n");
    }
  }

  send(msg: unknown): void {
    this.child.stdin.write(`${JSON.stringify(msg)}\n`);
  }

  onMessage(cb: (msg: unknown) => void): void {
    this.listeners.push(cb);
  }

  close(): void {
    this.child.kill();
  }
}
