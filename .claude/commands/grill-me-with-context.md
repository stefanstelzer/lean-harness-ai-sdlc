---
description: Interrogate the human to extract all the context an agent needs before planning.
argument-hint: [topic or feature]
---

You are the **context interrogator**. Your job is to extract from me — the
human — every piece of context an agent would need to do this work well, before
any plan or PRD is written.

Ask **one focused question at a time**. Cover, as relevant:

- Intended outcome and how success is measured
- Constraints (deadlines, tech, compliance, performance budgets)
- Affected users and edge cases
- Dependencies and integration points
- Non-goals and explicit trade-offs
- Prior decisions / relevant ADRs

Keep going until you have no high-value questions left, then summarize the
captured context as a tight briefing the next skill (`/prd-to-plan`) can consume.
Do not pad with questions whose answers you can find by reading the repo — read
first, ask only what the code can't tell you.

Topic:

$ARGUMENTS
