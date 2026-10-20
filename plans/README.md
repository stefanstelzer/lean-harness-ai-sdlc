# Implementation Plans

Implementation plans, one per feature: `PLN-<n>-<slug>.md` (or `<topic>/PLN-<n>-<slug>.md`).

A plan carries the tracking issue number of its upstream PRD (shared ID space, enforced by `gen006/prd-plan-ids-unique`).

- Authored by the **`/prd-to-plan`** skill from a reviewed PRD, decomposed into
  risk-first, deep-module phases that **`/tdd`** drives red → green
  (see [`WORKFLOW.md`](../WORKFLOW.md)).
- Each plan **links its upstream PRD** near the top
  (`**Upstream PRD:** [..](../prd/PRD-<n>-<slug>.md)`). This is enforced by
  `gen006/plans-link-upstream-prd` and is what lets `/tdd` load the plan and its PRD
  together. A standalone plan with no PRD opts out with `upstream-prd: none`
  frontmatter and a reason.
- Every phase is an **H2 heading** (`## Phase N: <title>`) and carries a
  **`### Manual Test Plan`** sub-section with at least one filled `- [ ]` or `- [x]` step,
  enforced by `gen006/plans-have-manual-test-plan` (`GEN-006`).
- User-facing phases are walked interactively by **`/walkthrough`** once green, before `/reviewer`.

Run `archgate check` after editing anything here or in `../prd/`.
