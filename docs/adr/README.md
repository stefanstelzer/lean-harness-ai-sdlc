# Architecture Decision Records (ADRs)

This directory captures **significant architecture decisions** for the project.
ADRs are a first-class artifact in the AI-SDLC workflow: whenever an agent or a
human makes a decision that constrains the architecture, it is recorded here and
enforced automatically by the **archgate** (`scripts/archgate.mjs`).

## Rules

- One decision per file, numbered sequentially: `NNNN-short-title.md`.
- Use the [template](./template.md) ([MADR](https://adr.github.io/madr/) format).
- An ADR is immutable once `Accepted`. To change a decision, add a new ADR that
  supersedes the old one and update the old one's status to `Superseded by NNNN`.
- Any rule with a mechanical consequence (layering, forbidden imports, required
  tooling) should be reflected in `scripts/archgate.mjs` so it is checked on
  every push and PR.

## Index

| ADR                                             | Title                         | Status   |
| ----------------------------------------------- | ----------------------------- | -------- |
| [0001](./0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](./0002-layered-source-architecture.md)   | Layered source architecture   | Accepted |

## When to write one

Write an ADR when a decision is **costly to reverse** or **affects multiple
parts of the system**: choice of a framework, a public API contract, a layering
rule, a security boundary, a data format. Skip ADRs for easily reversible,
local choices.
