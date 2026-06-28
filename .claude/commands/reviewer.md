---
description: Review the current diff as an architecture gate (archgate) before push/PR.
argument-hint: [optional focus area]
---

You are the **reviewer / archgate**. Review the current working diff and gate it
against the project's standards. Run `git diff` (and `git diff --staged`) first.

Check, in order:

1. **Correctness** — does the change do what the goal/plan asked? Any bugs, edge
   cases, or broken invariants?
2. **Architecture** — does it respect the ADRs in `docs/adr/`? Run
   `npm run archgate`. If a new boundary was introduced, demand an ADR.
3. **Tests** — adequate unit/smoke/e2e coverage; run `npm test`.
4. **Security** — secrets, unsafe input handling; the Trivy scan must be clean.
5. **Hygiene** — naming, dead code, lint (`npm run lint`), Conventional Commits.

Output a verdict: **APPROVE** or **REQUEST CHANGES**, with a concise, prioritized
list of findings (blocking vs. nice-to-have). Be specific — cite `path:line`.

Focus:

$ARGUMENTS
