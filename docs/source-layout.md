# Source Layout

A "where do I put X?" tour of this repository. The harness machinery lives at the
repo root; the demo TypeScript library lives under [`src/`](../src) and follows
[`ARCH-001`](../.archgate/adrs/) (layered source architecture).

## Top-level structure

```
.
├── .agents/                 # single source of truth for the harness (tool-agnostic)
│   ├── skills/<name>/        #   12 agent skills (SKILL.md + sub-docs)
│   └── rules/<name>.md        #   workspace rules (ADR routers + style)
├── .claude/                 # per-tool view — symlinks into .agents/ + agent-memory/
├── .archgate/               # architecture governance (ADRs + executable rules)
├── scripts/                 # symlink checks, archgate-ci, semver-floor, trivy
├── src/                     # demo TypeScript library (the dogfood)
├── tests/                   # unit / smoke / e2e suites (Vitest)
├── prd/                     # PRDs (PRD-<n>-<slug>.md), written by /discovery
├── plans/                   # plans (PLN-<n>-<slug>.md), written by /prd-to-plan
├── docs/                    # methodology, docs index, this file, diagrams
├── .husky/                  # commit-msg + pre-push git hooks
└── .github/                 # CI workflows, rulesets, issue/PR templates
```

## The demo library (`src/`)

Layered per `ARCH-001` — the dependency direction flows in one direction only:

```
src/
├── index.ts          # public surface — re-exports only (no logic)
├── feature-flags.ts  # implementation layer
└── types.ts          # lowest layer — no internal imports
```

`index.ts → feature-flags.ts → types.ts`. `src/types.ts` imports nothing
internal; production code in `src/` must never import from `tests/`; relative
imports must not escape `src/`. The archgate rule
`.archgate/adrs/ARCH-001-layered-source-architecture.rules.ts` enforces this.

### Where to put what

| You are adding…                  | Put it in…                                                        |
| :------------------------------- | :--------------------------------------------------------------- |
| A new public type or interface   | `src/types.ts` (the lowest layer)                                |
| New behaviour / logic            | `src/feature-flags.ts` (or a new sibling impl module)            |
| A new public export              | re-export it from `src/index.ts` — never put logic there         |
| A unit test                      | `tests/unit/*.test.ts` (`GEN-005`)                               |
| A public-surface smoke test      | `tests/smoke/*.test.ts`                                          |
| An end-to-end / journey test     | `tests/e2e/*.test.ts` (`GEN-002`)                                |

Every `src/*.ts` (except `index.ts` / `types.ts`) should have a matching test —
`GEN-004` (TDD discipline) warns when one is missing.

## Tests (`tests/`)

All suites run under **Vitest** (`vitest.config.ts`):

| Suite              | Command            | Purpose                                  |
| :----------------- | :----------------- | :--------------------------------------- |
| `tests/unit/`      | `npm run test:unit`  | fast logic tests (`GEN-005`)           |
| `tests/smoke/`     | `npm run test:smoke` | the public API surface                  |
| `tests/e2e/`       | `npm run test:e2e`   | journeys; runs in CI (`GEN-002`)        |
| all                | `npm test`         | everything; `npm run test:coverage` adds coverage |

## Harness machinery

| Path                                   | Purpose                                                                 |
| :------------------------------------- | :--------------------------------------------------------------------- |
| [`.agents/skills/`](../.agents/skills) | The 12 skills, each a `<name>/SKILL.md` (single source of truth).      |
| [`.agents/rules/`](../.agents/rules)   | Workspace rules: `general-adrs.md`, `architecture-adrs.md`, `styling-consistency.md`. |
| `.claude/skills/<name>`                | Symlink → `../../.agents/skills/<name>` (per-tool view).               |
| `.claude/rules/<name>.md`              | Symlink → `../../.agents/rules/<name>.md`.                             |
| `.claude/agent-memory/`                | Durable learnings written by `/lessons-learned`.                      |
| [`.archgate/adrs/`](../.archgate/adrs) | ADRs (`<ID>-<slug>.md` + `<ID>-<slug>.rules.ts`) + authoring guide.    |
| `.archgate/rules.d.ts`                 | Generated rule type defs (do not edit).                               |
| [`scripts/`](../scripts)               | `check-skill-symlinks.sh`, `check-rule-symlinks.sh`, `archgate-ci.mjs`, `semver-floor.mjs`, `run-trivy.sh`. |
| [`.husky/`](../.husky)                 | `commit-msg` (commitlint) + `pre-push` (symlink checks → archgate → trivy → tests). |
| [`.github/workflows/`](../.github/workflows) | `ci.yml` — the single push/PR pipeline.                       |

The symlink invariant (`.agents/` ↔ `.claude/`) is enforced by
`npm run check:links` in the pre-push hook and CI. See [`AGENTS.md`](../AGENTS.md)
for the full authoring rules.

## See also

- [Methodology](./methodology.md)
- [WORKFLOW.md](../WORKFLOW.md)
- [Architecture Decision Records](../.archgate/adrs/)
