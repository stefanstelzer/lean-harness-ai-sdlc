# Product Requirements Documents (PRDs)

Product Requirements Documents for features, one per file:
`PRD-<n>-<slug>.md` (or `<topic>/PRD-<n>-<slug>.md` in larger modular codebases), where `<n>` is the number of the PRD's GitHub tracking issue.

Every PRD has one, and states it in its header line as `**Tracking issue:** #<n>`;
`gen006/prd-has-tracking-issue` (`GEN-006`) fails `archgate check` when the line is missing
or names another number than the file. A number is used once across the project (`gen006/prd-plan-ids-unique`).

- Authored by the **`/discovery`** skill at the front of the Feature flow
  (see [`WORKFLOW.md`](../WORKFLOW.md)).
- Pressure-tested by **`/grill-me-with-context`** in the PRD review.
- Turned into an implementation plan under [`../plans/`](../plans/) by **`/prd-to-plan`**;
  that plan links back here as its **Upstream PRD** (`GEN-006`), so implementation has
  both the requirements and the plan in context.

A PRD that embeds non-English domain terms declares `english-only: ignore` frontmatter with a one-line justification (see [`AGENTS.md`](../AGENTS.md) › Language and `GEN-002`).
