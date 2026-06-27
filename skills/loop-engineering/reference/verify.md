# The Verify step — the whole game

Steps 1, 2, 3, and 5 are easy. **Verify is where every loop dies.** Get this right and a mediocre loop ships great work. Get it wrong and a clever loop confidently hands you garbage.

## The core problem

The agent that wrote the work is a terrible judge of it. Ask the same model "is this good?" and it will say yes — it wrote it, and it wants to escape the loop. It will quietly declare an 8/10 just to stop. This is **grade inflation**, and it kills more loops than any bug.

## 3 ways to make Verify actually honest

Use as many as the task allows — stack them for high-stakes work.

### 1. Separate the checker from the maker (maker–checker)

One agent builds, a *different* one — ideally a stronger model with different instructions — verifies. It has no ego in the work, so it grades straight. In a system, this is two sub-agents with different system prompts and (ideally) different models.

### 2. Check against reality, not opinion

Make verification an external thing the model can run:

- a test suite (`npm test`, `pytest`, `cargo test`)
- a linter / type-checker (`ruff`, `eslint`, `tsc --noEmit`)
- a script that asserts the outcome ("does the file exist", "did the command exit 0")

The agent reports what the script says, not what it believes. **Run the tests, paste the exact output.**

### 3. Make it adversarial

Tell the verifier its job is to *break* the work: quote the exact weak line, and default to fail when unsure. An 8+ must be earned with evidence, never claimed.

## The three-layer check (for serious loops)

1. **Action check** — did this one step succeed? (file written, command exit 0)
2. **Iteration check** — a quick test after every pass.
3. **Terminal check** — run the full success condition before you accept "done".

Cheap checks often, the expensive check once at the end.

## Go deeper

- "How to Build an Agentic Loop: Verification, Cost & Stopping" — MindStudio
- Reflexion — agents that self-reflect & improve in a loop (arXiv)
- "Building Effective Agents" — Anthropic (official patterns)
