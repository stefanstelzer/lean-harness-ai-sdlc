# 0002. Layered source architecture

- Status: Accepted
- Date: 2026-06-28
- Deciders: Stefan Stelzer

## Context and Problem Statement

The demo package needs a clear dependency direction so that the archgate has a
concrete, machine-checkable rule to enforce, demonstrating how ADRs become
automated fitness functions.

## Considered Options

- Layered architecture with a strict dependency direction
- Flat module structure with no enforced boundaries

## Decision Outcome

Chosen option: **"Layered architecture"** with this dependency direction:

```text
index.ts  (public barrel)
   └── feature-flags.ts  (domain logic)
          └── types.ts   (lowest layer — no internal imports)
```

### Consequences

- Good: Clear, testable boundary; `types.ts` stays dependency-free.
- Good: Production code (`src/`) may never import from `tests/`.
- Bad: Slight ceremony for tiny modules — acceptable for the demonstration.
- Enforcement: `scripts/archgate.mjs` rules `types-is-lowest-layer`,
  `no-imports-from-tests`, and `no-escape-src`.

## Links

- scripts/archgate.mjs
- [0001](./0001-record-architecture-decisions.md)
