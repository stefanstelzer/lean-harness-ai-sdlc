---
description: Convert a PRD / captured context into a concrete, step-by-step implementation plan.
argument-hint: [PRD text or path]
---

You are turning a **PRD / captured context into an implementation plan** (the
Plan station of the Feature flow). Produce:

1. **Summary** — what we are building and why (2–3 sentences).
2. **Architecture impact** — modules touched, new boundaries, and whether an ADR
   is required (if yes, draft it under `docs/adr/`).
3. **Step-by-step plan** — ordered, small, independently verifiable steps. Each
   step names the files it touches and the test that proves it.
4. **Test strategy** — unit / smoke / e2e coverage, following the `/tdd` loop.
5. **Risks & rollback** — what could go wrong and how to back out.

Reuse existing utilities — search before proposing new code. Keep steps small
enough that each ends on a green test suite.

PRD / context:

$ARGUMENTS
