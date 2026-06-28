---
id: GEN-006
title: Every PR and every plan-file phase requires a Manual Test Plan
status: accepted
domain: general
rules: false
---

# Every PR and every plan-file phase requires a Manual Test Plan

## Context

The automated gates in this repo (archgate, lint, build, unit/smoke/e2e tests)
catch code-level regressions, but none of them can answer "did a human actually
exercise the user-visible behaviour before merge?". Without an explicit,
filled-in human-verification checklist, that question routinely goes unanswered
and reviewers have to reverse-engineer the intended behaviour from the diff.

GEN-005 establishes the automated unit layer and GEN-002 the e2e layer. This ADR
closes the remaining gap on the *manual* side of the test pyramid: every PR — and
every phase block inside a multi-phase plan — must carry a concrete,
human-executable verification checklist.

## Decision

Two binding rules, both enforced by human-in-the-loop discipline reinforced by
the skills and the PR template (this ADR is `rules: false` — there is no archgate
rule; the gate is the PR template plus the `tdd`/`pr` skills):

1. **PR body** — every pull request's body MUST contain a top-level H2 heading
   named exactly `## Manual Test Plan`, followed by at least one filled
   `- [ ] <step>` checkbox describing a concrete, human-executable verification
   step. Placeholder tokens such as `<test or verification step>`, `<step>`, or
   `<TODO>` do not count as "filled". The `pr` skill checks this locally
   (`gh pr view --json body`) before declaring a PR ready for review, and the
   `.github/PULL_REQUEST_TEMPLATE.md` seeds the section.

2. **Plan file** — every `plans/PLN-*.md` plan file that contains one or more
   `## Phase N: <Title>` blocks MUST embed a `### Manual Test Plan` sub-section in
   every phase block, with at least one filled `- [ ] <step>` bullet (same
   placeholder prohibition). The `prd-to-plan` skill emits this section per phase.

The PR-body heading is H2 (`##`); the plan-file phase-local heading is H3 (`###`).
The skills are responsible for *writing* the section; the PR template and reviewer
discipline are the safety net.

## Do's and Don'ts

### Do

- Write the `## Manual Test Plan` section into the PR body before opening the PR
  for review.
- Write `### Manual Test Plan` into every phase block when authoring or amending a
  plan under `plans/`.
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

- This is defense-by-discipline (no CI lint on the PR body). If it proves
  insufficient in practice, a future amendment can add a CI step that fetches the
  live PR body and greps for the heading.
