---
name: discovery
description: Discovery — turn the feature discussion and codebase understanding into a PRD under prd/, framing the problem, scope, and test seams before planning. Use at the start of a feature, or when the user wants a PRD / requirements written up.
allowed-tools: Read, Glob, Grep, Write, Bash(git:*)
user-invocable: true
---

# Discovery

Discovery is the front of the Feature flow (see `WORKFLOW.md`): turn the problem discussion and codebase understanding into a **PRD**, which the PRD phase then reviews (`/grill-me-with-context`) and `/prd-to-plan` turns into a plan under `plans/`.

Synthesize what is already known — do not run a full interview. Ask only the targeted questions that close a real gap (the problem, the scope, the success criteria, or the test **seams**); when the discussion and the code already answer them, just write.

## Process

1. **Explore, and speak the domain.** Understand the current state of the code in the area you're touching (`src/`). Use the project's domain vocabulary and the methodology docs in `docs/` throughout, and respect the ADRs that govern the area (routed by the `*-adrs` rules).

2. **Find the seams.** Sketch the **seams** at which the feature will be tested — the public boundaries where behaviour is observable, the repo's native unit for this (the public exports of a module under `src/`, not its internals). Prefer existing seams to new ones, use the highest seam possible, and keep them few — one is ideal. **Confirm the seams with the user** before writing.

3. **Write the PRD.** Write `prd/PRD-<n>-<slug>.md` with the template below (`<n>` is the related tracking-issue number, or the next free PRD number). If the PRD legitimately embeds non-English domain loanwords, add `english-only: ignore` frontmatter with a one-line justification (per `AGENTS.md` › Language). The PRD is **done** when every template section is filled and the seams are confirmed — it is the artefact handed to the PRD review.

<prd-template>

## Problem Statement

The problem the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A long, numbered list of user stories, each in the form:

1. As an `<actor>`, I want `<feature>`, so that `<benefit>`.

Cover all aspects of the feature; be extensive.

## Implementation Decisions

The decisions that were made — modules built or modified and their interfaces, technical clarifications, architectural decisions, data shape changes, API contracts, specific interactions.

Do NOT include specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (a state machine, reducer, schema, or type shape), inline just the decision-rich part and note it came from a prototype.

## Testing Decisions

- What makes a good test here: it exercises external behaviour **at the seam**, not implementation details (see the `/tdd` skill, `GEN-004`, `GEN-005`).
- Which seams/modules will be tested, and the contracts each must honour (input validation, error handling).
- Prior art: similar tests already in the codebase.

## Out of Scope

What this PRD deliberately does not cover.

## Further Notes

Anything else worth recording about the feature.

</prd-template>
