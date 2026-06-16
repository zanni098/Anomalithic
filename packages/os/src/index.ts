export { Kernel, type KernelOptions } from "./kernel.js";

// Re-export the most-used building blocks so consumers can depend on one package.
export { Agent, ToolRegistry, type Tool } from "@anomalithic/core";
export { createProvider, type Provider } from "@anomalithic/providers";
export { discoverSkills, type Skill } from "@anomalithic/skills";
export { HookRegistry } from "@anomalithic/hooks";
export { FileMemoryStore, recall, type MemoryFact } from "@anomalithic/memory";
export { Orchestrator, TaskStore, type Task } from "@anomalithic/orchestrator";
export { PermissionPolicy, redactSecrets } from "@anomalithic/security";
