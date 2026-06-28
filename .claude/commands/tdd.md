---
description: Implement a step using a strict red-green-refactor TDD loop.
argument-hint: <the step / behaviour to implement>
---

You are implementing the behaviour below using **strict TDD**. Follow the loop
and do not skip steps:

1. **Red** — write the smallest failing test that captures the next slice of
   behaviour. Run it; confirm it fails for the right reason.
2. **Green** — write the minimum code to make it pass. Run the suite; confirm green.
3. **Refactor** — clean up code and tests while staying green. Run the suite again.
4. Repeat until the behaviour is fully covered.

Rules:

- Never write production code without a failing test demanding it.
- Keep each cycle tiny; commit (Conventional Commits) at green checkpoints.
- Respect the architecture (see `docs/adr/`); the archgate must stay green.

Behaviour to implement:

$ARGUMENTS
