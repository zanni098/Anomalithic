/** Minimal Server-Sent Events parser over a fetch ReadableStream. */
export async function* parseSSE(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<{ event?: string; data: string }> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE records are separated by a blank line.
      while (true) {
        const sep = buffer.indexOf("\n\n");
        if (sep === -1) break;
        const record = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        let event: string | undefined;
        const dataLines: string[] = [];
        for (const line of record.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
        }
        if (dataLines.length > 0) yield { event, data: dataLines.join("\n") };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return res.statusText;
  }
}
