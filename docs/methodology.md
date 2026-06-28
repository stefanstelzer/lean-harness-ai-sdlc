# Methodology — LEAN & harness-powered AI SDLC

This document explains the _why_ behind the [workflow](../WORKFLOW.md). The short
version: AI agents make software cheap to write, which makes the **feedback loop
and the guardrails** the real bottleneck. LEAN supplies the philosophy; the
harness supplies the mechanism.

## The problem

Agents can produce a lot of plausible code very fast. Without structure, speed
turns into:

- scope creep (building more than the goal needs),
- architectural drift (each change ignores the last),
- regressions (no failing test pinned the behaviour),
- and lost context (decisions made and forgotten).

## LEAN principles applied to an agentic SDLC

| LEAN principle             | How it shows up here                                              |
| -------------------------- | ----------------------------------------------------------------- |
| Eliminate waste            | `/goal` cuts scope; "maximize the work not done" is rule #2.      |
| Build quality in           | TDD (`/tdd`); the archgate, Trivy and tests gate every push.      |
| Amplify learning           | `/lessons-learned` turns each change into durable rules/ADRs.     |
| Decide as late as possible | Discovery & ADRs defer commitment until the trade-offs are clear. |
| Deliver fast               | Small batches, short flows, automated gates → quick green PRs.    |
| Respect people             | Humans own intent & review; agents own the mechanical grind.      |
| Optimize the whole         | One flow from intent to merge, not local per-step optimisation.   |

## What "harness" means

A harness is everything that keeps a fast agent on the rails:

- **Skills** — repeatable, named procedures (`.claude/commands/`) so each station
  is executed the same way every time.
- **Rules** — `AGENTS.md` (how to work) and ADRs (what was decided).
- **Hooks & pipelines** — automated gates (`commit-msg`, `pre-push`, CI) that
  make the right thing the easy thing and the wrong thing impossible to merge.
- **Tests** — the executable specification: unit for logic, smoke for the public
  surface, e2e for journeys.

## The feedback loop

```text
intent → plan → implement (TDD) → gate (archgate/Trivy/tests) → review → merge
   ↑                                                                      │
   └──────────────────── lessons-learned feeds the harness ◄─────────────┘
```

The loop is deliberately tight: a failing gate stops the change _before_ it
spreads, and the retrospective improves the system so the same failure can't
recur. The harness gets stronger with every change that runs through it.

## Why three flows

Most work is one of: a **feature** (needs discovery), a **bug** (needs root-cause

- a regression test), or a **change request** (scoped, understood). Matching the
  ceremony to the work avoids both under- and over-process — itself a LEAN move.

See [WORKFLOW.md](../WORKFLOW.md) for the station-by-station detail.
