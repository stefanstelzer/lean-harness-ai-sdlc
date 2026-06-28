# AGENTS.md

Operating rules for any AI agent (Claude Code, or other tools that read
`AGENTS.md`) working in this repository. These rules implement the
[workflow](./WORKFLOW.md) and are deliberately strict — the harness trades a
little ceremony for reliable quality at agent speed.

## Prime directives

1. **Follow a flow.** Every change starts at a station: `/goal` (change request),
   `/discovery` (feature) or `/bug-analysis` (bug). Don't skip to coding.
2. **Be LEAN.** Maximize the work _not_ done. Prefer the smallest change that
   satisfies the acceptance criteria. Reuse existing code — search before adding.
3. **Build quality in.** No production code without a failing test demanding it
   (`/tdd`). Keep the suite green at every commit.
4. **Respect the architecture.** Honor the ADRs in [`docs/adr/`](./docs/adr/).
   The archgate (`npm run archgate`) must stay green. New boundaries require a
   new ADR.

## Definition of Done

A change is done only when **all** of these hold:

- [ ] Acceptance criteria from `/goal` (or the bug's failing test) are met.
- [ ] New behaviour is covered by unit tests; user journeys by smoke/e2e.
- [ ] `npm run verify` is green (lint + archgate + tests).
- [ ] Trivy scan is clean (no HIGH/CRITICAL vulns or secrets).
- [ ] An ADR was added/updated if an architectural decision was made.
- [ ] Commits follow Conventional Commits.

## Conventions

### Branches

`feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`. Never commit directly
to `main`.

### Commits — Conventional Commits

`type(scope): summary`. Allowed types: `feat`, `fix`, `docs`, `style`,
`refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `adr`. Enforced by
the `commit-msg` hook.

### Code style

- TypeScript, strict mode. ESM (`.js` import specifiers for local modules).
- Prettier + ESLint are the source of truth — run `npm run lint` / `npm run format`.
- Match the surrounding code's naming and comment density.

### Architecture (enforced by `scripts/archgate.mjs`)

- Dependency direction: `index.ts → feature-flags.ts → types.ts`.
- `src/types.ts` is the lowest layer — no internal imports.
- Production code (`src/`) must never import from `tests/`.
- Relative imports must not escape `src/`.

## Tooling map

| Need               | Command / file                              |
| ------------------ | ------------------------------------------- |
| Run all gates      | `npm run verify`                            |
| Architecture check | `npm run archgate` → `scripts/archgate.mjs` |
| Security scan      | `scripts/run-trivy.sh`                      |
| Tests              | `npm test` / `:unit` / `:smoke` / `:e2e`    |
| Skills             | [`.claude/commands/`](./.claude/commands/)  |
| Decisions          | [`docs/adr/`](./docs/adr/)                  |

## When unsure

Ask, don't guess. Use `/grill-me-with-context` to pull missing context from the
human before planning. Read the repository before assuming behaviour.

## After shipping

Run `/lessons-learned` and turn insight into durable changes (ADRs, archgate
rules, skills, `AGENTS.md`) — improve the _system_, not just this change.
