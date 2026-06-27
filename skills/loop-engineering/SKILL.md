---
name: loop-engineering
description: Turn a babysat prompt into an autonomous loop that runs itself to a verified bar. Use when a task should run unattended until a checkable goal is met — fixing every failing test, iterating a draft until it clears a standard, or building 24/7 self-checking agent systems. Covers the one-line /goal feature, a copy-paste 5-step loop, honest verification (maker–checker), stop/cost controls, and the 6-part unattended system.
---

# Loop Engineering

Stop prompting. Start writing loops.

A **prompt** is you talking to the model one message at a time: ask → it answers → you read → you correct → you ask again. *You* are the loop, babysitting every turn.

A **loop** takes you out of the chair. You write the instructions once — the goal, how to check the work, and when to stop — and the model runs the ask–answer–correct cycle on its own, dozens of times, until the work clears the bar. You come back to a finished, verified output instead of a half-baked first draft.

> Prompt engineering = writing the answer request.
> Loop engineering = writing the system that keeps requesting until the answer is right.
> You stop being the worker. You become the manager who wrote the SOP.

## When to use this skill

Reach for a loop whenever the task is **observable, checkable, and finite** and you'd otherwise sit there re-prompting:

- Fix every failing test until `npm test` (or `pytest`, `cargo test`) passes with zero failures.
- Iterate a draft (essay, spec, landing copy, query) until it clears a written rubric.
- Refactor until the linter / type-checker is clean.
- Run an unattended job on a schedule (issue triage, CI-failure review, a morning briefing).

If a single answer is enough, just prompt. Loops earn their keep when *"try, check, fix, repeat"* is the actual shape of the work.

## The 3 ingredients every loop needs

Every working loop has exactly these three. Miss one and the loop stops too early (lazy output), never stops (burns tokens forever), or lies to you about being done.

1. **A goal the model can check itself against** — observable, binary (pass/fail, not "mostly"), bounded (a finite outcome).
2. **A verify step** — an honest check after every attempt. This is the whole game (see below).
3. **A stop condition** — when to declare done, when to give up, when it's burning money.

## Three levels

Pick the level that matches how much control you need. Full detail for each is in the `reference/` files.

### Level 1 — the easy loop (`/goal`)

The agent tools already ship with a built-in loop. You give it a goal and walk away. In Claude Code (or Codex), state the goal once and a *separate, smaller checker model* decides after each turn whether the goal is actually met — so the agent that did the work isn't the one grading it. It only stops when the answer is yes.

```text
/goal "Fix every failing test in this repo. Keep going until `npm test`
 passes with zero failures. Don't ask me questions — make a sensible
 call, note it, and continue."
```

That's the whole loop, one line. It plans, edits, runs the tests, reads the result, fixes what broke, re-runs — on repeat — and stops when the tests are green. Full guidance: `reference/level1-goal.md`.

### Level 2 — write the loop yourself

When you want control over the standard, the checks, and the stopping bar, write the loop as a prompt. Five steps form the skeleton:

1. **GOAL** — define "done" the way a machine can check it, before anything else.
2. **PLAN** — state the single next step. (Stops the model from spraying changes.)
3. **DO** — execute that one step, or fix the weakest part of the last result.
4. **VERIFY** — score the work as a hostile critic; run a *real* check and report its output, not an opinion.
5. **DECIDE** — all criteria pass → print `FINAL` and stop. Otherwise → print `ITERATING`, fix the lowest score first, return to PLAN. Cap the passes.

The full copy-paste template (works in Claude or ChatGPT) lives in `reference/level2-loop.md`.

### Level 3 — the 24/7 unattended system

A loop that runs truly unattended isn't one long prompt — it's a small system of six parts (the Addy Osmani / Claude Code blueprint): **automations** (scheduled triggers), **worktrees** (isolated parallel copies), **skills** (your conventions in a `SKILL.md`), **connectors / MCP** (real tools — GitHub, DB, Slack), **sub-agents** (maker–checker split), and the **spine: persistent state** (a markdown file or board that holds progress between runs). Skip the spine and you just have five clever one-shots that forget each other. Full blueprint: `reference/level3-system.md`.

## The Verify step — the whole game

Steps 1, 2, 3, and 5 are easy. **Verify is where every loop dies.** Get it right and a mediocre loop ships great work; get it wrong and a clever loop confidently hands you garbage.

The core problem: *the agent that wrote the work is a terrible judge of it.* Ask the same model "is this good?" and it will say yes — it wrote it, and it wants to escape the loop. It quietly declares an 8/10 just to stop. This is **grade inflation**, and it kills more loops than any bug.

Three ways to make Verify honest (stack them for high-stakes work):

- **Separate the checker from the maker.** One agent builds; a *different* one — ideally a stronger model with different instructions — verifies. It has no ego in the work, so it grades straight.
- **Check against reality, not opinion.** Make verification something the model can actually run: a test suite, a script, a linter, "does the file exist," "did the command exit 0." Report what the check says, not what the model believes. Run the tests, paste the exact output.
- **Make it adversarial.** Tell the verifier its job is to *break* the work, quote the exact weak line, and default to fail when unsure. An 8+ must be earned with evidence, never claimed.

The three-layer check for serious loops: **action check** (did this step succeed — file written, exit 0?), **iteration check** (a quick test after every pass), and **terminal check** (run the full success condition before accepting "done"). Cheap checks often, the expensive check once at the end. More in `reference/verify.md`.

## Make it stop. Make it cheap.

An unsupervised loop with no brakes is a money fire. Write **all three** stop reasons into the prompt — never just "stop when done":

- **Success** — the goal is verifiably met (tests pass). Exit clean.
- **Failure** — an error it can't fix after 2–3 tries. Stop and report the reason; don't thrash.
- **Budget** — hit the max turns / cost / time cap. Halt immediately, even if not done.

Cost control: **cap the turns** (a hard max, e.g. 15–25 for focused tasks), **tier your models** (a cheap fast model for routine steps, a strong model only for hard reasoning and the verify), and **estimate first** (expected iterations × tokens per iteration ≈ your bill — know it before you walk away).

## 5 mistakes that kill loops

1. **No success condition** — it drifts forever. Define observable, binary, bounded "done" first.
2. **No turn limit** — it loops till your wallet's empty. Always cap max passes.
3. **Trusting self-assessment** — it grades its own homework and inflates. Use an external check or a second agent.
4. **One model for everything** — expensive and slow. Cheap model for routine, strong model for reasoning.
5. **Letting it move its own goalposts** — keep the stop logic out of the agent's reach; it will loosen the bar to escape.

---

*Methodology adapted from the Loop Engineering field guide (Level 1 → 3), Anthropic's "Building Effective Agents" and Claude Code best practices, the Reflexion self-reflection pattern, and Addy Osmani's loop-engineering framework.*
