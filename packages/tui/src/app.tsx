import { Agent } from "@anomalithic/core";
import type { Message, Provider } from "@anomalithic/providers";
import { Box, Text, useApp } from "ink";
import TextInput from "ink-text-input";
import { useCallback, useState } from "react";

export interface TuiProps {
  provider: Provider;
  model: string;
  ads?: boolean;
}

interface Line {
  id: number;
  role: "user" | "assistant" | "system";
  text: string;
}

let counter = 0;
function nextId(): number {
  counter += 1;
  return counter;
}

const roleColor = (role: Line["role"]): string =>
  role === "user" ? "cyan" : role === "system" ? "gray" : "white";

const rolePrefix = (role: Line["role"]): string =>
  role === "user" ? "› " : role === "system" ? "· " : "";

/** The full-screen Anomalithic terminal UI. */
export function App({ provider, model, ads }: TuiProps) {
  const { exit } = useApp();
  const [lines, setLines] = useState<Line[]>([
    { id: nextId(), role: "system", text: `Anomalithic · ${model} · type /exit to quit` },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [ad, setAd] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);

  const submit = useCallback(
    async (value: string) => {
      const text = value.trim();
      if (!text) return;
      if (text === "/exit" || text === "/quit") {
        exit();
        return;
      }
      setInput("");
      setBusy(true);
      const assistantId = nextId();
      setLines((l) => [
        ...l,
        { id: nextId(), role: "user", text },
        { id: assistantId, role: "assistant", text: "" },
      ]);

      const convo: Message[] = [...history, { role: "user", content: [{ type: "text", text }] }];
      const agent = new Agent({ provider, model });
      let acc = "";
      agent.bus.on("thinking.start", () => {
        setThinking(true);
        if (ads) setAd("💡 anomalithic.vercel.app/earn");
      });
      agent.bus.on("thinking.end", () => setThinking(false));
      agent.bus.on("text", (e) => {
        acc += e.text;
        setLines((l) => l.map((ln) => (ln.id === assistantId ? { ...ln, text: acc } : ln)));
      });

      try {
        const result = await agent.run(convo);
        setHistory(result.messages);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setLines((l) => [...l, { id: nextId(), role: "system", text: `error: ${message}` }]);
      }
      setAd(null);
      setThinking(false);
      setBusy(false);
    },
    [provider, model, ads, history, exit],
  );

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor="yellow" paddingX={1} marginBottom={1}>
        <Text bold color="yellow">
          ⬡ Anomalithic
        </Text>
        <Text color="gray"> · {model}</Text>
      </Box>
      {lines.map((ln) => (
        <Box key={ln.id} marginBottom={ln.role === "assistant" ? 1 : 0}>
          <Text color={roleColor(ln.role)}>
            {rolePrefix(ln.role)}
            {ln.text}
          </Text>
        </Box>
      ))}
      {thinking ? <Text color="gray">✦ thinking…</Text> : null}
      {ad ? <Text color="yellow">{ad}</Text> : null}
      {busy ? null : (
        <Box>
          <Text color="cyan">› </Text>
          <TextInput value={input} onChange={setInput} onSubmit={submit} placeholder="message" />
        </Box>
      )}
    </Box>
  );
}
