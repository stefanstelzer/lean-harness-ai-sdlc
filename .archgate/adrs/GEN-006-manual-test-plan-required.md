---
id: GEN-006
title: Plan files and PRs require a Manual Test Plan, and plans link their upstream PRD
status: accepted
domain: general
rules: true
---

# Plan files and PRs require a Manual Test Plan, and plans link their upstream PRD

## Context

The automated gates in this repo (archgate, lint, build, unit/smoke/e2e tests)
catch code-level regressions, but none of them can answer "did a human actually
exercise the user-visible behaviour before merge?". Without an explicit,
filled-in human-verification checklist, that question routinely goes unanswered
and reviewers have to reverse-engineer the intended behaviour from the diff.

A second, related gap: plans authored by `prd-to-plan` did not reliably link the
PRD they descend from, so the implementing agent had the plan in context but not
the requirements it was derived from.

GEN-005 establishes the automated unit layer and GEN-002 the e2e layer. This ADR
closes the remaining gap on the *manual* side of the test pyramid: every PR — and
every phase block inside a multi-phase plan — must carry a concrete,
human-executable verification checklist, and every plan must link its upstream PRD.

## Decision

Three binding rules:

1. **PR body** — every pull request's body MUST contain a top-level H2 heading
   named exactly `## Manual Test Plan`, followed by at least one filled
   `- [ ] <step>` checkbox describing a concrete, human-executable verification
   step. Placeholder tokens such as `<test or verification step>`, `<step>`, or
   `<TODO>` do not count as "filled". The `pr` skill checks this locally
   (`gh pr view --json body`) before declaring a PR ready for review, and the
   `.github/PULL_REQUEST_TEMPLATE.md` seeds the section. There is no CI-side body
   lint; the PR-body gate is author-and-reviewer discipline reinforced by the
   skills and the template.

2. **Plan-file Manual Test Plan** — every `plans/PLN-*.md` plan file that contains
   one or more phase blocks MUST embed a `Manual Test Plan` sub-section in every
   phase block, with at least one filled `- [ ] <step>` bullet (same placeholder
   prohibition). The companion archgate rule `gen006/plans-have-manual-test-plan`
   enforces this locally (`archgate check`) and in CI. To avoid silently skipping a
   plan whose markup differs slightly, the rule accepts a phase heading at **H2 or
   H3** (`## Phase …` / `### Phase …`) and a Manual Test Plan marker as an **H3/H4
   heading or a bold line** (`### Manual Test Plan` / `**Manual Test Plan**`).

3. **Plan-file upstream PRD link** — every `plans/PLN-*.md` MUST link the PRD it
   descends from — a markdown link to `prd/PRD-*.md` (the `prd-to-plan` template
   emits `**Upstream PRD:** [..](../prd/..)`). This is what lets `/tdd` load the
   plan and its PRD together, so the requirements are in context during
   implementation, not just the plan. A genuinely standalone plan with no PRD opts
   out with `upstream-prd: none` frontmatter and a reason. The companion rule
   `gen006/plans-link-upstream-prd` enforces this.

The canonical layout keeps phase titles at H2 (`## Phase N: …`) and the phase-local
Manual Test Plan at H3 (`### Manual Test Plan`); the rules tolerate the H3/bold
variants so a plausible authoring slip is still inspected rather than passing
vacuously. The PR-body heading is H2 (`## Manual Test Plan`). The `prd-to-plan`
skill writes the plan sections (Manual Test Plan and the Upstream PRD link); `pr`
writes the PR-body section. The gates are a safety net for cases where a section was
stripped or never written — they are not the primary author.

This ADR is auto-loaded by the `general-adrs` rule via the `.archgate/adrs/*.md`
glob, and its companion `.rules.ts` is enforced by `archgate check`.

## Do's and Don'ts

### Do

- Write the `## Manual Test Plan` section into the PR body before opening the PR
  for review.
- Write `### Manual Test Plan` into every phase block when authoring or amending a
  plan under `plans/`. The `prd-to-plan` skill emits this section per phase.
- Link the upstream PRD near the top of every plan
  (`**Upstream PRD:** [prd/PRD-<n>-<slug>.md](../prd/PRD-<n>-<slug>.md)`). The
  `prd-to-plan` template emits it; `/tdd` reads it so the PRD and the plan are both
  in context at implementation time.
- Use concrete, executable steps: name the command, the input, the expected
  output. Example: `- [ ] Run npm run build, then import { FeatureFlags } from the built dist, register a flag at rollout: 50, and confirm isEnabled is stable across repeated calls for the same userId.`

### Don't

- Don't ship a PR with only placeholder bullets (`<test or verification step>`,
  `<step>`, `<TODO>`).
- Don't rename `## Manual Test Plan` to anything else (e.g. `## Test plan`,
  `## Verification`, `## QA`) — reviewers and skills look for the exact heading.
- Don't fold the manual test plan into the acceptance criteria list — acceptance
  criteria are code-level outcomes; manual test plan items are the human actions
  that demonstrate them.

## Consequences

### Positive

- Every PR ships with an explicit, reviewable human-verification checklist.
- Every phase plan enumerates the manual steps up front, so the implementer knows
  what "done" looks like from the user's seat.

### Negative

- A few extra seconds of authoring effort per PR — mitigated by the skills writing
  the section automatically.

### Risks

- **PR-body discipline only**: the PR-body rule has no CI lint — it relies on the
  `pr` skill running its check and on reviewers noticing a missing section. If this
  proves insufficient in practice, a future amendment can add a CI step that fetches
  the live PR body and greps for the heading.
- **Wording drift**: a future skill iteration might emit the plan headings with a
  slightly different level or casing. For the plan-file rules this is mitigated
  structurally — the regex accepts H2/H3 phase headings and an H3/H4-or-bold Manual
  Test Plan marker, so a slip no longer makes the gate pass vacuously. The PR-body
  grep is still case-sensitive (`^## Manual Test Plan`); the `pr` skill quotes the
  exact heading.
