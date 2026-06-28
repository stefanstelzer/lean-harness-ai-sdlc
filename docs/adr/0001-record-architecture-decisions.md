# 0001. Record architecture decisions

- Status: Accepted
- Date: 2026-06-28
- Deciders: Stefan Stelzer

## Context and Problem Statement

In an AI-assisted SDLC, agents and humans both make architectural decisions
quickly. Without a durable, reviewable record, that context is lost and future
agents repeat or contradict past decisions.

## Considered Options

- Use Architecture Decision Records (ADRs) in the repository
- Track decisions in an external wiki / ticket system
- Don't record decisions explicitly

## Decision Outcome

Chosen option: **"Use ADRs in the repository"**, because decisions live next to
the code, are versioned with it, and can be read by both humans and agents (the
harness references `docs/adr/` directly).

### Consequences

- Good: Decisions are versioned, reviewable, and discoverable by agents.
- Good: Mechanical rules can be enforced by the archgate.
- Bad: Requires the discipline to write an ADR when decisions are made — handled
  by the `/reviewer` and `/lessons-learned` skills which prompt for one.
- Enforcement: PR template includes an "ADR added/updated?" checklist item.

## Links

- [MADR](https://adr.github.io/madr/)
- WORKFLOW.md — "Rules / ADR" lane
