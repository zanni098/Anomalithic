# Level 3 — The 24/7 system

A loop that runs truly unattended isn't one long prompt — it's a small system. Five capabilities, plus one spine that remembers state between runs. This is the Addy Osmani / Claude Code blueprint.

## The six parts

1. **Automations** — scheduled triggers (daily issue triage, CI-failure review, a morning briefing). The loop wakes itself up on a cadence; you don't press start.
2. **Worktrees** — isolated copies of the project so several agents work in parallel without colliding on the same files.
3. **Skills** — your conventions written once in a `SKILL.md` (build steps, rules, context) that the agent re-reads each run instead of you re-explaining.
4. **Connectors (MCP)** — plug the agent into real tools — GitHub, your DB, Slack, Notion — so the loop can act in the real world, not just edit files.
5. **Sub-agents** — split the roles: one drafts, another verifies. The maker–checker separation, built into the system.
6. **Persistent state (the spine)** — a markdown file or a board (e.g. Linear) that holds progress between runs, because models forget everything between sessions. This is what makes it a *loop* and not just a one-off.

## Don't skip the spine

Five capabilities are flashy. The sixth — persistent state — is what lets a loop pick up tomorrow where it left off today. Without it you just have five clever one-shots that forget each other.

## Stop conditions (write all three)

- **Success** — the goal is verifiably met. Exit clean.
- **Failure** — an error it can't fix after 2–3 tries. Stop and report the reason; don't thrash.
- **Budget** — hit the max turns / cost / time cap. Halt immediately, even if not done.

## Cost control

- **Cap the turns.** A hard max (e.g. `--max-turns 15-25` for focused tasks). No infinite loops.
- **Tier your models.** A cheap fast model for routine steps; a strong model only for the hard reasoning and the verify.
- **Estimate first.** Expected iterations × tokens per iteration ≈ your bill. Know it before you walk away.

## The blueprint, in full

- Loop Engineering — the original framework — Addy Osmani (coined the term)
- "The Claude Code lead who ditched prompting for loops" — The New Stack
- loop-engineering — starters, patterns & CLI tools (GitHub, open source)
