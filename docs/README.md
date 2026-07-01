# Documentation

Technical and methodology documentation for **lean-harness-ai-sdlc** — the LEAN &
harness-powered AI Software Development Lifecycle. The harness _is_ the product;
the TypeScript library under [`src/`](../src) is the dogfood it ships.

## Contents

1. **[Methodology](./methodology.md)** — the _why_ behind the workflow: LEAN
   principles applied to an agentic SDLC, what "harness" means, and the feedback
   loop.
2. **[Source Layout](./source-layout.md)** — a "where do I put X?" tour of the
   repository and the demo library.
3. **[Distribution](./distribution.md)** — how the harness ships to Claude Code,
   Gemini CLI and Antigravity from one `.agents/` source, and how to install it.
4. **[Enforcement coverage](./enforcement-coverage.md)** — the per-ADR map of what
   is hard-enforced (archgate rules, CI gates) vs. prompt-only / human review.

## Start here

- **[AGENTS.md](../AGENTS.md)** — the binding operating rules for every agent
  (language, symlink invariants, branch policy, PR descriptions, definition of
  done). Read this first.
- **[WORKFLOW.md](../WORKFLOW.md)** — the three flows (Feature / Bug /
  Change-Request) and the shared delivery spine, with a per-phase table.
- **[Architecture Decision Records](../.archgate/adrs/)** — the binding
  architectural decisions (`ARCH-001`, `GEN-001`…`GEN-008`), enforced by
  [archgate](https://archgate.dev) — the external architecture-governance CLI — on
  every push and in CI. See [`.archgate/adrs/README.md`](../.archgate/adrs/README.md)
  for the authoring guide, template, and index.

## Diagrams

The flow is illustrated in [`assets/`](./assets/): the full deck
[`ai_sdlc.pdf`](./assets/ai_sdlc.pdf) and per-flow boards `flow-feature.png`,
`flow-bug.png`, `flow-change-request.png`. `WORKFLOW.md` is authoritative where
the diagrams differ.

---

*Maintained alongside the harness — update docs in the same PR as the code they
describe (see `AGENTS.md` › README-Maintenance).*
