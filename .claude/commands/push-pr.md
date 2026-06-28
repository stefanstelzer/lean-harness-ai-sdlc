---
description: Run pre-push checks, push the branch, and open a pull request.
argument-hint: [PR title]
---

You are executing the **push & PR** station of the flow. Steps:

1. Ensure work is committed with Conventional Commit messages. If on `main`,
   create a topic branch first (`feat/...`, `fix/...`, `chore/...`).
2. Run the local gate before pushing: `npm run verify` (lint + archgate + tests).
   Do not push if it is red — fix or report.
3. Push the branch. The `pre-push` hook re-runs archgate, Trivy and unit tests.
4. Open the PR with `gh pr create`, filling the PULL_REQUEST_TEMPLATE checklist:
   - Link the goal/issue.
   - Confirm tests added, archgate green, ADR added/updated if needed.
   - Write a crisp summary of _what_ changed and _why_.
5. Report the PR URL and the CI status once the PR pipeline starts.

Only push and open PRs when the working tree reflects the intended change —
confirm with `git status` / `git diff` first.

PR title (optional):

$ARGUMENTS
