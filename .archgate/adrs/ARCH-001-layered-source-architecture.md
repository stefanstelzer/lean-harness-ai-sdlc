---
id: ARCH-001
title: Layered source architecture with a one-way dependency direction
status: accepted
domain: architecture
rules: true
---

# Layered source architecture with a one-way dependency direction

## Context

The codebase is changed by humans and AI agents together. Without an explicit,
machine-checkable dependency direction, modules drift into a tangle of circular
imports and the public surface of the package becomes impossible to reason about.
A clear layering also gives the archgate a concrete fitness function to enforce —
demonstrating how an ADR becomes an automated check rather than a wish in a wiki.

## Decision

`src/` is layered with a strict, one-way dependency direction:

```text
index.ts          (public barrel — re-exports only)
   └── <domain>.ts (domain logic, e.g. feature-flags.ts)
          └── types.ts (lowest layer — no internal imports)
```

Binding invariants:

- **`src/index.ts` is a barrel and contains re-exports only.** It re-exports the
  package's public surface (`export … from './…'`, `export type … from './…'`).
  It MUST NOT define logic, classes, or runtime values of its own.
- **`src/types.ts` is the lowest layer.** It MUST NOT import from any other
  module under `src/`. Types flow upward; nothing flows down into them.
- **Production code never imports from tests.** No file under `src/` may import
  from `tests/` (or any `*.test.ts` / `*.spec.ts`).
- **Source stays inside `src/`.** Modules under `src/` must not reach outside the
  package source tree with `../` escapes into `tests/`, `scripts/`, or siblings.

## Do's and Don'ts

### Do

- Keep `src/index.ts` to re-export statements only — add a new public symbol by
  re-exporting it here.
- Put shared, dependency-free domain types in `src/types.ts`.
- Import types and helpers downward (barrel → domain → types).

### Don't

- Don't add runtime logic to `src/index.ts`; put it in a domain module and
  re-export it.
- Don't import another `src/` module from `src/types.ts` — that inverts the
  layering and risks an import cycle.
- Don't import test code from production code.

## Consequences

### Positive

- A predictable, cycle-free dependency graph; `types.ts` stays portable.
- The public API is visible at a glance in one barrel file.
- The layering is enforced automatically by `ARCH-001-layered-source-architecture.rules.ts`.

### Negative

- Slight ceremony for very small modules — acceptable for the demonstration and
  cheap insurance as the package grows.

### Risks

- A re-export-only barrel can hide an accidental wide export; review the public
  surface when adding symbols to `index.ts`.
