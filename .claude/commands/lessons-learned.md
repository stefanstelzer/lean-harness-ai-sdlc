---
description: Capture lessons learned after a unit of work and feed them back into the harness.
argument-hint: [what was just shipped]
---

You are running a **lessons-learned** retrospective (the closing archgate of the
flow). After a change ships, reflect and turn insight into durable artifacts:

1. **What went well / what hurt** — short, honest bullets.
2. **Root causes** — for anything that hurt, why did it happen?
3. **Harness improvements** — concretely propose updates to:
   - `AGENTS.md` rules (so agents avoid the issue next time)
   - a new or updated **ADR** in `docs/adr/`
   - a skill in `.claude/commands/` or an archgate rule in `scripts/archgate.mjs`
   - tests that would have caught the problem earlier
4. **Action items** — owner + concrete next step for each.

Prefer changing the _system_ over reminding people to be careful. Where you
propose a doc/rule change, draft the exact edit.

Context:

$ARGUMENTS
