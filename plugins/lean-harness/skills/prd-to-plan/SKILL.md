---
name: prd-to-plan
description: Turn a reviewed PRD into an implementation plan under plans/, decomposed into risk-first, deep-module phases that /tdd can implement directly. Use after the PRD is agreed, or when the user wants a feature broken into TDD phases.
allowed-tools: Read, Glob, Grep, Write, Bash(git:*)
---
# PRD to Plan

Take the reviewed PRD (`prd/PRD-<n>-*.md`, after `/discovery` and the PRD review with `/grill-me-with-context`) and produce an implementation plan `plans/PLN-<n>-<slug>.md` whose phases are good enough to hand straight to `/tdd`. The plan is the **Plan** phase of the Feature flow (see `WORKFLOW.md`): a human reviews it, so present it for review and confirm the architecture and phase boundaries before it is accepted; pressure-test it with `/grill-me-with-context`.

Match the [Plan format](#plan-format) below.

## What makes a phase

A phase is **one deep module** — a small interface over a deep implementation — that `/tdd` can drive red → green on its own. Order the phases **risk-first**: Phase 1 is the riskiest or most uncertain module, the **tracer bullet** that proves the hardest path; the rest follow in dependency order.

Every phase carries the contract `/tdd` needs:

- **Seam + interface** — the test boundary and the public signature being introduced or changed. This is what `/tdd` writes its test against.
- **Red behaviour list** — the behaviours to drive red → green, highest-risk first; include the validation and error-handling contract, not just the happy path.
- **Modules touched** — the files/modules the phase changes, named. **No code snippets** (they go stale; the exception is a prototype-derived snippet that encodes a decision more precisely than prose — a schema, type, or state machine).
- **Manual Test Plan** — a `### Manual Test Plan` sub-section (H3) inside the phase, with a checklist of concrete, human-runnable steps, e.g. `- [ ] npm test -- <pattern> is green; …`. **Required on every phase by `GEN-006`**, which matches the H2 phase heading (`## Phase N: …`) and the H3 `### Manual Test Plan` heading below — never omit it, and keep the headings at these levels so the gate actually inspects the phase.
- **Binding ADRs** — name the ADRs the phase must satisfy (routed by the `*-adrs` rules), so the constraints are explicit.
- _Acceptance criteria_ (recommended) — the done-bar for the phase.

## Guardrails

Before finalising, check every phase:

- **Deep module.** The phase exposes a small interface over a deep implementation. Flag shallow modules and leaky interfaces — split or deepen them. A deep pure core with I/O at the edges is what lets the unit tests run without live infrastructure (`GEN-005`).
- **Cites its binding ADRs.** No phase touches an ADR-governed area without naming the ADR it must satisfy.

## Process

1. **Read the PRD and explore.** Pull the architectural decisions out of the PRD and the code: the deep modules to build or modify, their **seams**, and the ADRs that bind the area. Use the project's domain vocabulary and the methodology docs in `docs/`.
2. **Decompose into deep-module phases, risk-first.** One deep module per phase; Phase 1 is the riskiest module (the tracer bullet); order the rest by dependency. **Stop and confirm the module set and the phase boundaries with the user before writing the detail** — wait for explicit confirmation; do not start writing the phases on your own.
3. **Write each phase's contract** — seam + interface, red behaviour list (highest-risk behaviour first), modules touched (no code), Manual Test Plan (`GEN-006`), binding ADRs, and acceptance criteria.
4. **Run the guardrail pass** — deep-module check and ADR-citation check on every phase.
5. **Write `plans/PLN-<n>-<slug>.md`** in the plan format below — including the mandatory `**Upstream PRD:**` link (`GEN-006`) — then present it for human review.

A plan is **done** when every phase is a deep module with its full `/tdd` contract (Manual Test Plan included), the plan links its upstream PRD, the guardrails pass, and the human has reviewed it.

## Plan format

`<n>` is the related tracking-issue number (or the source PRD's number). Add `english-only: ignore` frontmatter if the plan legitimately embeds non-English domain loanwords (per `AGENTS.md` › Language).

```
# Plan: PLN-<n> <title>

**Upstream PRD:** [prd/PRD-<n>-<slug>.md](../prd/PRD-<n>-<slug>.md)
Branch: <feature-branch> off main

## Context
Why this work, and what the plan delivers.

## Architectural decisions
The design layer: the deep modules, their seams and public interfaces, the
decoupling, and the binding ADRs — as a bulleted list.

## Phases (TDD red→green)

## Phase 1: <riskiest deep module> (tracer bullet)
<what the module is; its seam + public interface>

### Modules touched
<files, no code>

### Binding ADRs
<ids>

### Red behaviours
- <behaviour> (highest-risk / validation contract first)
- …

### Manual Test Plan
- [ ] npm test -- <pattern> is green; <observable outcome>

### Acceptance criteria
- <done-bar>

## Phase 2: <next deep module>
…

## Out of scope
What the plan deliberately does not cover.

## Verification
The end-to-end checks: build, the test suites, archgate, README consistency.
```

The phase title is **H2** (`## Phase N: …`) and `### Manual Test Plan` is **H3** — this is
the exact markup the `gen006/plans-have-manual-test-plan` rule inspects, so authoring to this
template keeps the gate effective. The **Upstream PRD** link is mandatory
(`gen006/plans-link-upstream-prd`): it is what lets `/tdd` load the PRD and the plan together
at implementation time. For a genuinely standalone plan with no PRD, add `upstream-prd: none`
frontmatter with a one-line reason instead of the link.

## Hand-off

Next: pressure-test the plan with `/grill-me-with-context`; once the user approves it, implement it phase by phase with `/tdd`.

