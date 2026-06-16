import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscordAdapter } from "../src/discord.js";
import { SlackAdapter } from "../src/slack.js";

afterEach(() => vi.unstubAllGlobals());

describe("channel adapters", () => {
  it("Slack sends via chat.postMessage and ingests human messages only", async () => {
    const calls: { url: string; body: string }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
      calls.push({ url, body: init.body });
      return { ok: true } as Response;
    });
    const slack = new SlackAdapter("xoxb-test");
    const got: string[] = [];
    await slack.start((m) => got.push(m.text));

    await slack.send({ chatId: "C1", text: "hi" });
    expect(calls[0]?.url).toContain("chat.postMessage");
    expect(calls[0]?.body).toContain("hi");

    slack.ingest({ channel: "C1", text: "hello", user: "U1" });
    slack.ingest({ channel: "C1", text: "ignored", bot_id: "B1" });
    expect(got).toEqual(["hello"]);
  });

  it("Discord sends to the channel and ignores bot authors", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(String(url));
      return { ok: true } as Response;
    });
    const discord = new DiscordAdapter("token");
    const got: string[] = [];
    await discord.start((m) => got.push(m.text));

    await discord.send({ chatId: "123", text: "yo" });
    expect(urls[0]).toContain("/channels/123/messages");

    discord.ingest({ channel_id: "123", content: "hey", author: { id: "u" } });
    discord.ingest({ channel_id: "123", content: "botmsg", author: { bot: true } });
    expect(got).toEqual(["hey"]);
  });
});
