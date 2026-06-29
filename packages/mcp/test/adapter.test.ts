import { describe, expect, test, vi } from "vitest"
import { type McpCaller, adaptMcpTools, flattenContent } from "../src/adapter.js"

describe("flattenContent", () => {
  test("joins text parts and labels non-text", () => {
    expect(
      flattenContent([{ type: "text", text: "a" }, { type: "image" }, { type: "text", text: "b" }]),
    ).toBe("a\n[image]\nb")
    expect(flattenContent([])).toBe("(no content)")
  })
})

describe("adaptMcpTools", () => {
  test("prefixes names and forwards calls, flattening the result", async () => {
    const caller: McpCaller = {
      callTool: vi.fn(async (name, args) => ({
        content: [{ type: "text", text: `${name}:${JSON.stringify(args)}` }],
      })),
    }
    const tools = adaptMcpTools(
      [{ name: "read", description: "Read a thing", inputSchema: { type: "object" } }],
      caller,
      "fs",
    )
    expect(tools[0]!.name).toBe("fs__read")
    expect(tools[0]!.description).toBe("Read a thing")
    const result = await tools[0]!.execute({ path: "x" }, { sessionId: "t" })
    expect(result.output).toBe('read:{"path":"x"}')
    expect(caller.callTool).toHaveBeenCalledWith("read", { path: "x" })
  })

  test("marks tool errors in metadata", async () => {
    const caller: McpCaller = {
      callTool: async () => ({ content: [{ type: "text", text: "boom" }], isError: true }),
    }
    const [tool] = adaptMcpTools([{ name: "fail" }], caller)
    const result = await tool!.execute({}, { sessionId: "t" })
    expect(result.metadata?.isError).toBe(true)
  })
})
