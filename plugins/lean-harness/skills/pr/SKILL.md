---
name: pr
description: Commit the work, merge main down, link the tracking issue so the merge closes it, open the PR, then watch CI and drive it green. Use at the end of a change to commit, raise the PR, and resolve CI failures.
allowed-tools: Read, Bash(git:*), Bash(gh:*), Bash(npm:*), Bash(node:*), Bash(trivy:*)
---
# Open the PR and drive it green

The last leg of the flow (see `WORKFLOW.md`): commit the work, merge `main` down, find the issue the change closes, open the PR, then watch CI and fix any failure at its **root cause** until the run is green. Always on the feature branch — never `main` (`AGENTS.md` › Branch Policy).

## 1. Commit the work

On the feature branch (the one `/tdd` opened), commit every outstanding change with Conventional-Commits messages (`GEN-001`); group related changes into coherent commits. The spec commit (PRD + plan) and the implementation commits should already be in history.

**Done when** `git status` is clean and `git log` tells the story of the change.

## 2. Merge `main` down

A branch that has drifted from `main` pushes green and still lands conflicted: the conflict surfaces on the PR, where the reviewer inherits it instead of you. Merge `main` down before the **first** push (§4) and again before **every** follow-up push (§5) — `main` moves while CI runs:

```bash
git fetch origin main
git merge origin/main
```

- **Resolve conflicts by reading both sides.** Never resolve wholesale (`-X ours` / `-X theirs`), and never discard files uninspected. Regenerate a conflicted lockfile (`npm install`) rather than hand-editing it. When resolution requires a product decision, stop and consult the user.
- **A merge invalidates the local gates.** Even a clean merge can break code semantically. Re-run `npm test` and `npm run build` before pushing.

**Done when** `git merge-base --is-ancestor origin/main HEAD` exits 0, the working tree is clean, and re-run gates are green.

## 3. Find the issue the PR closes

Nearly every PR belongs to an issue: it gives the change a rationale, allows project boards to track progress, and closes itself on merge. A merged PR that never named its issue leaves it open indefinitely:

1. **Read the PRD**: Check the PRD's header for `**Tracking issue:** #<n>` (`GEN-006`).
2. **Branch or commit context**: If working without a PRD, check the branch name or commit messages for an issue reference (`#<n>`).
3. **Ask the user**: For ad-hoc changes with no issue, ask the user: name an issue, open one via `gh issue create`, or explicitly record `No tracking issue — <reason>`.

**Done when** the issue number is in hand, or it is explicitly recorded that none exists.

## 4. Open the PR

Push the branch, then open the PR per `AGENTS.md` › PR Descriptions (binding):

- Multi-commit branch: `gh pr create --fill-verbose`. Single-commit: `gh pr create --fill`.
- The body requires three H2 sections — `## Summary`, `## Commits`, `## Manual Test Plan` (`GEN-006` — at least one filled, non-placeholder step). When `/walkthrough` ran, its walked script is that section: passed steps ticked (`- [x]`), the rest open (`- [ ]`).
- **Link the issue** on a dedicated line: `Closes #<n>`. For ad-hoc work with no issue, state `No tracking issue — <reason>`.
- Verify after creating — check the resolved issue link:

  ```bash
  gh pr view <n> --json title,body
  gh pr view <n> --json closingIssuesReferences --jq '.closingIssuesReferences[].number'
  ```

**Done when** the PR exists with a compliant body, `closingIssuesReferences` names the issue (or states none), and GitHub reports it mergeable.

## 5. Watch the run, fix the root cause

Drive CI green:

- Watch the run: `gh pr checks <n> --watch`. (The push already ran the pre-push gates locally — symlinks, archgate, Trivy, tests.)
- On a failure, read the failing logs: `gh run view <run-id> --log-failed`.
- **Reproduce locally** with the same command the job runs (`node scripts/archgate-ci.mjs`, `npm test`, `npm run build`, `npm run check:plugins`).
- **Fix the root cause, not the symptom.** Make the check pass by fixing what it caught — never by weakening a test or silencing a legitimate check.
- Confirm the fix locally, commit it with a message naming the root cause, **merge `main` down again (§2)**, and push; CI re-runs.

Repeat until **green**.

**Done when** the PR is open with a compliant body, `origin/main` is an ancestor of the branch head, and every required check is green.

