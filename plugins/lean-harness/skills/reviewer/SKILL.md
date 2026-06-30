---
name: reviewer
description: Code review skill. Validates the working-tree diff against the project's ADRs before committing, in a single pass — gather the changed files and their ADR briefings, then verify each against the binding constraints. Invoke after code modifications to ensure ADR compliance.
allowed-tools: Read, Glob, Grep, AskUserQuestion, Bash(git:*), Bash(archgate:*), Bash(npm run archgate:*)
---
# Reviewer Skill

Validate the change against the project's ADRs **before it is committed** — the local
ADR-compliance review of the Commit phase (see `WORKFLOW.md`). This repo is
human-in-the-loop and **non-subagentic**: run the review in one pass, in this context.
Do **not** spawn sub-agents. `archgate review-context` packages the changed files and the
ADR briefings in a single call; you read the files and check them here.

## Step 1: Gather the diff and the ADR briefings

The agent writes files with Write/Edit, which do **not** `git add`. New files are therefore
*untracked*, and whether `archgate review-context` sees them depends on local archgate
config — so make the change diffable first:

```
git add -A -N          # intent-to-add: makes new files appear in the diff, stages no content
archgate review-context --run-checks
```

(`npm run archgate` runs the bare `archgate check` gate if you only need the automated
result.) `review-context` returns JSON:

- **`allChangedFiles`** — every changed file (working tree vs the configured base branch).
- **`domains`** — changed files grouped by domain (`architecture`, `general`, …), each with
  the applicable ADR briefings (the **Decision** and **Do's and Don'ts** sections).
- **`checkSummary`** — the automated ADR-compliance check results.

## Step 2: Trust the diff — neither empty nor over-broad

Cross-check against git so a misconfiguration never reads as "nothing to review" — and so
the branch's unmerged history is never reviewed as if it were the current change:

- If `allChangedFiles` is **empty but `git status --porcelain` shows changes**, archgate's
  base is not resolving (commonly a missing `.archgate/config.json` / `baseBranch` on a
  fresh checkout). **Do not report APPROVED.** Say the review context is misconfigured, then
  fall back to reviewing `git diff origin/main...` (or the appropriate base) directly,
  reading each changed file against the ADRs you load from `.archgate/adrs/`.
- If `allChangedFiles` is **much larger than the change under review**, the configured
  `baseBranch` resolves but the branch is *ahead of it* — it carries prior, already-agreed
  commits (or unmerged scaffolding) that are **not** part of this change. `review-context`
  diffs the whole branch-vs-base delta, so it conflates them. Reviewing that whole set wastes
  effort on settled code and can raise stale findings. **Scope to the actual change**: take
  the working-tree edits (`git status --porcelain`) plus the commits unique to this piece of
  work, e.g. `git diff $(git merge-base origin/main HEAD)...HEAD` for the branch's own
  commits, or just the working tree if nothing is committed yet. Review that intersection;
  mention that you narrowed the context and why. (`checkSummary` still reflects the full
  automated run — keep honoring it.)
- If `git status` is genuinely clean **and** `allChangedFiles` is empty, there is nothing to
  review — report that.

## Step 3: Block on automated failures

If `checkSummary.pass === false`, **BLOCK immediately**: list the failing rules (rule id,
file, message) and stop. Fix the violations before re-running — don't proceed to the manual
pass on a red tree.

## Step 4: Manual review, in this context

For each domain in `domains`, read every changed source file and verify it follows the
**Do's** and avoids the **Don'ts** of the applicable ADRs (the briefings are in the JSON;
read the full ADR from `.archgate/adrs/<id>.md` when a briefing is ambiguous). Always
include the General/Process angle (file structure, naming, error handling, dependency
boundaries) even when no domain-specific ADR matches. Skip non-source files (docs, markdown,
config) unless an ADR governs them (e.g. `GEN-006` for `plans/`). When a changed file
matches no ADR, note it as an uncovered area — not a violation.

For a large diff, read the highest-risk files first — the public surface (`src/index.ts`),
the lowest-layer types (`src/types.ts`), and anything that crosses a dependency boundary
(`ARCH-001`) — and say so if you have to prioritise.

## Step 5: Report

Keep it short (under ~20 lines):

```
## Reviewer: APPROVED | BLOCKED
- Automated checks: PASS/FAIL (N/N)
- <domain>: PASS/FAIL  (one line per affected domain, incl. General/Process)
- Violations: <count> | Warnings: <count>
[each violation on one line: ADR-ID file:line issue → fix]
[each warning on one line: ADR-ID file warning]
```

- **APPROVED** = `checkSummary.pass === true` and every domain passes (warnings allowed).
- **BLOCKED** = any automated check fails or any ADR violation is found.
- **ESCALATE** = the change is sound but no ADR covers it well, or it contradicts an existing
  ADR. Flag the gap for `/lessons-learned` rather than silently approving or blocking.

**Always surface warnings.** A warning is non-blocking but the user must see every one
(ADR id + file + what drifted) to decide — never drop them silently.

<example>

```
## Reviewer: APPROVED
- Automated checks: PASS (3/3)
- Architecture: PASS_WITH_WARNINGS
- Violations: 0 | Warnings: 1
⚠ ARCH-001 src/index.ts — Re-export block also defines a helper inline; not a violation but drifts from the "index only re-exports" pattern.
```

</example>

## Rules

- ADR violations are **hard blockers** — do not approve non-compliant code. Reference the ADR
  id, the file (and line when possible), what's wrong, and how to fix it.
- ADRs with `files` globs apply only to matching files.
- Never weaken or disable a rule to get to green — fix the cause. When the right fix would
  change a contract or is unclear, surface it to the user (HITL).

