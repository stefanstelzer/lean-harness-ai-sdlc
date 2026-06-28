---
description: Investigate a bug — reproduce, isolate root cause, and write a failing test before fixing.
argument-hint: <bug report / symptom>
---

You are running **bug analysis** (the entry station of the Bug flow). Resist the
urge to patch symptoms. Proceed scientifically:

1. **Reproduce** — establish reliable, minimal reproduction steps. If you can't
   reproduce, gather the missing information first.
2. **Isolate** — bisect the code path; cite `path:line`. State the root cause as
   a single clear sentence.
3. **Failing test** — write a test that fails _because of_ the bug. This becomes
   the regression guard.
4. **Fix** — make the minimal change to turn the test green via the `/tdd` loop.
5. **Blast radius** — what else could the same root cause affect? Add tests if so.
6. **Prevention** — note anything for `/lessons-learned` (an ADR? an archgate rule?).

Do not close the loop until the failing test exists and now passes.

Bug:

$ARGUMENTS
