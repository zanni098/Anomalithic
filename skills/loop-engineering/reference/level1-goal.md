# Level 1 — The easy loop (`/goal`)

No framework, no code. The agent tools already ship with a built-in loop; you give it a goal and walk away.

## What it does

Instead of you re-prompting after every step, `/goal` keeps the agent running turn after turn. After each turn a **separate, smaller checker model** asks "is the goal actually met yet?" — so the agent that did the work isn't the one grading it. It only stops when the answer is yes.

## Copy this — the whole loop is one line

```text
/goal "Fix every failing test in this repo. Keep going until `npm test`
 passes with zero failures. Don't ask me questions — make a sensible
 call, note it, and continue."
```

Close the laptop. It plans, edits, runs the tests, reads the result, fixes what broke, re-runs — on repeat — and stops when the tests are green. You wake up to a finished, verified result.

## How to write a good `/goal`

- **Name the exact check.** "until `npm test` passes with zero failures", "until `ruff check .` is clean", "until the file `dist/report.pdf` exists and opens".
- **Make it binary.** No "improve" or "polish". Pass/fail only.
- **Remove yourself from the loop.** Add: "Don't ask me questions — assume, note the assumption, continue."
- **Add a brake** (most tools support a turn cap, e.g. `--max-turns 20`).

## Why this beats a normal prompt

A normal prompt gives you one attempt. The Goal feature gives you as many attempts as it takes, with a built-in checker deciding when to stop. Same effort from you — completely different output quality.

## Watch & read

- Claude Code — Best Practices (Anthropic, official)
- "How to write AI agent loops in Claude Code & Codex" — Lenny's Newsletter (Brian Grinstead)
- "Loop Engineering: the /goal command + Routines" — sabrina.dev
