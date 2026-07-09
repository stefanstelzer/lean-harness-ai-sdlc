---
name: pr
description: Commit the work, open the PR, then watch the PR run and drive it green by fixing root causes. Use at the end of a change to commit, raise the PR, and resolve CI failures.
allowed-tools: Read, Bash(git:*), Bash(gh:*), Bash(npm:*), Bash(node:*), Bash(trivy:*)
---

# Open the PR and drive it green

The last leg of the flow (see `WORKFLOW.md`): commit the work, open the PR, then watch CI and fix any failure at its **root cause** until the run is green. Always on the feature branch — never `main` (`AGENTS.md` › Branch Policy).

## 1. Commit the work

On the feature branch (the one `/tdd` opened), commit every outstanding change with Conventional-Commits messages (`GEN-001`); group related changes into coherent commits. The spec commit (PRD + plan) and the implementation commits should already be in history.

**Done when** `git status` is clean and `git log` tells the story of the change.

## 2. Open the PR

Push the branch, then open the PR per `AGENTS.md` › PR Descriptions (binding). The body
MUST carry three H2 sections — `## Summary`, `## Commits`, `## Manual Test Plan` — and the
Manual Test Plan needs at least one real, human-runnable `- [ ]` step (`GEN-006` — no
placeholders, no auto-derived branch-name title).

`--fill`/`--fill-verbose` populate the body from commit subjects/bodies and **ignore
`.github/PULL_REQUEST_TEMPLATE.md`**, so on their own they produce a body with **no**
`## Manual Test Plan` — which fails `GEN-006`. Author the body explicitly instead:

- Write the three sections to a file (seed `## Commits` from
  `git log --format='- %s' main..HEAD`), then
  `gh pr create --title <t> --body-file <file>`.
- Or, if you started from `--fill`/`--fill-verbose` to capture the commit bodies, add the
  missing `## Manual Test Plan` with `gh pr edit <n> --body-file <file>` before review.
- Verify after creating: `gh pr view <n> --json title,body` — confirm a non-empty body, a
  real title, and that `## Manual Test Plan` is present with a filled step.

**Done when** the PR exists with a body carrying all three sections and a filled Manual Test Plan.

## 3. Watch the run, fix the root cause

Drive CI green:

- Watch the run: `gh pr checks <n> --watch`. (The push already ran the pre-push gates locally — symlink checks, archgate, Trivy, tests — so most failures surface before CI.)
- On a failure, read the failing logs: `gh run view <run-id> --log-failed`.
- **Reproduce locally** with the same command the job runs (`node scripts/archgate-ci.mjs`, `npm test`, `npm run build`, `trivy fs …`). The PR pipeline mirrors the local gates, so a red check is almost always reproducible without a CI round-trip.
- **Fix the root cause, not the symptom.** Make the check pass by fixing what it caught — never by silencing it: do not weaken or delete a failing test, add a real vulnerability to `.trivyignore`, drop `english-only: ignore` onto genuinely non-English prose, or skip a job. When the real fix is unclear or would change a contract, surface it to the user rather than guess — this repo is human-in-the-loop.
- Confirm the fix locally, commit it with a message naming the root cause, and push; CI re-runs.

Repeat until **green**.

**Done when** the PR is open with a compliant body and every required check is green.
