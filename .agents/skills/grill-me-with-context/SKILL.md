---
name: grill-me-with-context
description: A relentless, context-aware interview that pressure-tests a PRD or plan — find the core ambiguities, resolve them one by one, and write the decisions back. Use to stress-test a PRD or plan before building, or on any "grill" trigger.
allowed-tools: Read, Glob, Grep, Edit, Write, Skill, Bash(git:*)
user-invocable: true
---

# Grill Me — with context

Relentlessly interview the user to sharpen the artifact under review — the **PRD** (after `/discovery`) or the **plan** (after `/prd-to-plan`) — until you reach shared understanding. This is the human **Review** step of those phases in `WORKFLOW.md`.

"With context" is the discipline: before asking, load the repo's context and **explore the codebase instead of asking when the answer is already there** — the artifact under review, the binding ADRs (routed by the `*-adrs` rules), and the project's domain vocabulary and methodology docs in `docs/`. Grill only the genuine gaps.

## 1. Find the core ambiguities

Read the artifact against the code and the ADRs and surface the **core ambiguities** — the unresolved decisions that actually change the design or the build, especially the architectural ones (module boundaries, seams, data shape, contracts). A core ambiguity is one where the wrong default forces rework. Skip anything the code, the ADRs, or the artifact already answer.

## 2. Grill to resolution

Walk the **design tree** one branch at a time, resolving the dependencies between decisions in order.

- **One question at a time.** Wait for the answer before the next — asking several at once is bewildering.
- **Give your recommended answer** with each question, grounded in the code and the ADRs.
- Prefer exploring the codebase to asking; only ask what the repo cannot answer.

Continue until every core ambiguity is resolved and you and the user share the same picture.

## 3. Write the decisions back

A resolved decision that lives only in the chat is lost. Fold each one back:

- **Into the artifact** — update the PRD's _Implementation Decisions_ / the plan's _Architectural decisions_ (and any phase it changes) so the artifact now states the decision.
- **Into an ADR when it's architectural** — a decision that binds future work (a seam, a module boundary, a contract, a layering rule) belongs in `.archgate/adrs/`. Use the `/adr-author` skill to write or update it; architectural ADRs are binding constraints (the `*-adrs` rules), so this is how the decision becomes enforceable, not merely recorded.

**Done when** every core ambiguity is resolved, the artifact reflects the decisions, and each architectural decision is captured as an ADR.
