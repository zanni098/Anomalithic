# Level 2 — Write the loop yourself

When you want control — over the standard, the checks, the stopping bar — write the loop as a prompt. This 5-step framework is the skeleton. Paste it into Claude or ChatGPT and it runs itself.

## The five steps

1. **GOAL** — define "done" before anything else. Write the success condition the way a machine can check it: observable (you can verify it), binary (pass/fail, not "mostly"), bounded (a finite outcome). A vague goal means the loop drifts forever.
2. **PLAN** — state the single next step. Force the model to name one move before it acts. Stops it from spraying changes and losing the thread.
3. **DO** — produce or improve the work. Execute that one step: make the thing, or fix the weakest part of the thing from last round.
4. **VERIFY** — check it honestly (most important). Score the work against the goal as a hostile critic trying to fail it. Best of all, have it run a real check — a test, a script, a second agent — and report what the check says, not what it thinks.
5. **DECIDE** — loop or stop. Goal met → print `FINAL` and stop. Not met → print `ITERATING`, fix the weakest point first, go back to PLAN. Cap it with a max number of passes so it can't spin forever.

## Copy-paste loop — works in Claude or ChatGPT

```text
You will work in a loop until the task meets the bar.

TASK: [describe exactly what you want produced]

GOAL / SUCCESS CRITERIA (strict, checkable, no soft passes):
- [criterion 1]
- [criterion 2]
- [criterion 3]

LOOP — repeat every turn:
1. PLAN   state the single next step.
2. DO     produce or improve the work.
3. VERIFY score 1-10 per criterion. Act as a HOSTILE critic
          trying to FAIL it. Quote the exact weak line. Where
          possible run a real check and report its output, not
          your opinion. No 8+ without evidence.
4. DECIDE all criteria 8+ -> print "FINAL" and stop.
          else -> print "ITERATING", fix the lowest score first.

RULES:
- Max 5 passes. If not all 8+ by then, ship the best version + a
  "STILL WEAK" list. Never fake a FINAL.
- Don't ask me questions. Assume, note the assumption, continue.

Begin. Run the loop until FINAL.
```

## Tuning it

- **Tighten the criteria** until each is something you could check yourself in 30 seconds.
- **Raise or lower the bar** (8+ is a good default; use 9+ for high-stakes).
- **Increase max passes** only after you've seen it converge — more passes = more spend.
