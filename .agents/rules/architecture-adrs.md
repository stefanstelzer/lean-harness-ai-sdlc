---
description: Architectural constraints for this repo, authored as ADRs in `.archgate/adrs/` with frontmatter `domain: architecture`. MUST be consulted and followed whenever the team plans or modifies module boundaries, the public API surface (`src/index.ts`), the dependency direction between source layers, or any code that affects how the package is structured and what it exports. Load and enforce these ADRs before proposing or applying changes in those areas. This is a binding constraint layer.
---

# Architecture ADR Constraint Layer

Architectural decisions for this project are authored as ADRs in `.archgate/adrs/`.
ADRs whose YAML frontmatter contains `domain: architecture` are **binding
architectural constraints** and take precedence over stylistic preferences or
convenience.

This workspace rule is a thin routing layer. It deliberately does **not** duplicate
ADR content. Always read the ADRs at runtime — the `.md` files in `.archgate/adrs/`
are the single source of truth.

## How to use this rule

When you detect you are about to plan or edit code in any of the trigger areas below:

1. **Discover** all architecture ADRs dynamically:
   - Glob `.archgate/adrs/*.md`.
   - For each file, read the YAML frontmatter and keep only those with `domain: architecture`.
   - Do **not** hardcode ADR filenames — new ADRs with this domain must take effect without editing this rule.

2. **Load** the full text of every matching ADR. Treat the `Decision`, `Do's and Don'ts`, and `Consequences` sections as hard constraints.

3. **Apply** the constraints to your plan and edits. If multiple ADRs apply, satisfy all of them.

4. **Cite** the ADR id (e.g. `ARCH-001`) in your reasoning whenever a constraint from it shapes your decision, so the user can trace the rule.

## Enforcement (hard refusal)

If a requested change would violate any `domain: architecture` ADR:

- **Refuse** to implement it.
- Quote the specific rule (e.g. a bullet from `Do's and Don'ts` or a sentence from `Decision`) and name the ADR id.
- Explain concisely why the requested change violates it.
- Offer the user two paths forward:
  1. Reformulate the task so it complies with the ADR, or
  2. First amend the ADR (update `.archgate/adrs/<id>.md`) — after which the new version becomes the binding constraint.

Do not silently work around the rule. Do not ask for confirmation to violate it. Do not apply a partial change that breaks the invariant.

## Trigger areas (non-exhaustive)

You should consider this rule active whenever the work touches:

- The public barrel `src/index.ts` and what the package exports (`ARCH-001`).
- The dependency direction between source layers (barrel → domain → types).
- The lowest-layer types module (`src/types.ts`) and its imports.
- Any import that crosses the `src/` ⇄ `tests/` boundary.
- Introducing, splitting, or merging modules under `src/`.

When in doubt whether an edit is architecture-adjacent, load the ADRs and check —
the cost of reading them is low, the cost of breaking an invariant is high.

## Maintenance

- New ADRs with `domain: architecture` are picked up automatically via the glob — no edit to this rule required.
- If an ADR is removed or its domain changes, it simply stops being loaded.
- Do **not** copy ADR text into this file. Keep it as a routing layer only.
