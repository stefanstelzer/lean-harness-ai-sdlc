<div align="center">

# 🛠️ lean-harness-ai-sdlc

### LEAN & harness-powered AI Software Development Lifecycle

A batteries-included **framework of skills, hooks, rules and pipelines** for
shipping software with AI agents — plus a runnable TypeScript demo that the
harness lints, tests, scans and ships on every change.

<br />

[![Push Pipeline](https://github.com/stefanstelzer/lean-harness-ai-sdlc/actions/workflows/push-pipeline.yml/badge.svg)](https://github.com/stefanstelzer/lean-harness-ai-sdlc/actions/workflows/push-pipeline.yml)
[![PR Pipeline](https://github.com/stefanstelzer/lean-harness-ai-sdlc/actions/workflows/pr-pipeline.yml/badge.svg)](https://github.com/stefanstelzer/lean-harness-ai-sdlc/actions/workflows/pr-pipeline.yml)
[![Nightly E2E](https://github.com/stefanstelzer/lean-harness-ai-sdlc/actions/workflows/nightly-e2e.yml/badge.svg)](https://github.com/stefanstelzer/lean-harness-ai-sdlc/actions/workflows/nightly-e2e.yml)
[![codecov](https://codecov.io/gh/stefanstelzer/lean-harness-ai-sdlc/branch/main/graph/badge.svg)](https://codecov.io/gh/stefanstelzer/lean-harness-ai-sdlc)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![Node](https://img.shields.io/badge/node-%3E%3D20-43853d.svg)](./.nvmrc)
[![Security: Trivy](https://img.shields.io/badge/security-Trivy-1904da.svg)](https://aquasecurity.github.io/trivy/)
[![Built with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-d97757.svg)](https://claude.com/claude-code)

[![GitHub last commit](https://img.shields.io/github/last-commit/stefanstelzer/lean-harness-ai-sdlc.svg)](https://github.com/stefanstelzer/lean-harness-ai-sdlc/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/stefanstelzer/lean-harness-ai-sdlc.svg)](https://github.com/stefanstelzer/lean-harness-ai-sdlc/issues)
[![GitHub stars](https://img.shields.io/github/stars/stefanstelzer/lean-harness-ai-sdlc.svg?style=social)](https://github.com/stefanstelzer/lean-harness-ai-sdlc/stargazers)

[Workflow](./WORKFLOW.md) · [Agent rules](./AGENTS.md) · [Methodology](./docs/methodology.md) · [Contributing](./CONTRIBUTING.md) · [ADRs](./docs/adr/)

</div>

---

## What is this?

`lean-harness-ai-sdlc` is an opinionated **operating model for building software
with AI agents**. It pairs two ideas:

- **LEAN** — maximize the work _not_ done, build quality in, deliver fast in
  small batches, and keep a tight feedback loop.
- **Harness** — a concrete set of _skills_ (slash commands), _rules_ (ADRs &
  `AGENTS.md`), _hooks_ (git + CI gates) and _pipelines_ that keep agents on the
  rails so velocity never costs you correctness or architecture.

Three flows cover the bulk of day-to-day work — **Change Request**, **Bug** and
**Feature** — each running the same stations from intent to merged PR.

> The methodology _is_ the product. The TypeScript package under `src/` is the
> dogfood: a tiny feature-flag library the harness uses to prove every gate
> actually runs and stays green.

## The Feature flow

![Feature flow](./docs/assets/flow-feature.png)

> Change Request and Bug flows follow the same shape — see
> [WORKFLOW.md](./WORKFLOW.md) for all three with their swimlanes.

## The harness at a glance

| Layer         | Artifacts                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Skills**    | `/goal` `/discovery` `/grill-me-with-context` `/prd-to-plan` `/tdd` `/reviewer` `/lessons-learned` `/push-pr` `/bug-analysis` |
| **Rules**     | ADRs (`docs/adr/`), `AGENTS.md`                                                                                               |
| **Docs**      | `README.md`, `WORKFLOW.md`, `AGENTS.md`                                                                                       |
| **Tests**     | Unit · Smoke · Nightly E2E                                                                                                    |
| **Pipeline**  | Pre-push · Push pipeline · PR pipeline                                                                                        |
| **Git hooks** | `commit-msg` (Conventional Commits) · `pre-push` (Archgate → Trivy → Unit tests)                                              |

### Skills (slash commands)

The skills live in [`.claude/commands/`](./.claude/commands/) and are usable in
Claude Code as `/goal`, `/tdd`, etc.

| Skill                    | Flow station      | Purpose                                             |
| ------------------------ | ----------------- | --------------------------------------------------- |
| `/goal`                  | Requirement       | Sharpen a request into a testable goal              |
| `/discovery`             | Discovery         | Explore the problem space before solutioning        |
| `/grill-me-with-context` | Requirements eng. | Interrogate the human for missing context           |
| `/prd-to-plan`           | Plan              | Turn a PRD/context into a step-by-step plan         |
| `/tdd`                   | Agent / Artifact  | Implement via strict red-green-refactor             |
| `/reviewer`              | Review (archgate) | Gate the diff on correctness, architecture, tests   |
| `/push-pr`               | Push / PR         | Run gates, push, open the PR                        |
| `/lessons-learned`       | Review (archgate) | Feed retrospective insight back into the harness    |
| `/bug-analysis`          | Bug investigation | Reproduce, isolate root cause, write a failing test |

## Quickstart

```bash
# 1. Use the right Node (see .nvmrc)
nvm use

# 2. Install deps and wire up git hooks
npm install            # runs "prepare" → installs husky hooks

# 3. Run the local gate (what pre-push enforces)
npm run verify         # lint + archgate + tests

# Individual gates
npm run lint
npm run archgate       # architecture-fitness check (see docs/adr/)
npm test               # unit + smoke + e2e
npm run test:coverage
```

### Try the demo library

```ts
import { FeatureFlags } from 'lean-harness-ai-sdlc';

const flags = new FeatureFlags([
  { key: 'new-checkout', enabled: true, rollout: 25 }, // 25% canary
]);

flags.isEnabled('new-checkout', { userId: 'user-42' }); // deterministic per user
```

## Repository layout

```text
.claude/commands/   # the 9 skills (slash commands)
.husky/             # commit-msg + pre-push git hooks
scripts/            # archgate.mjs (arch gate) + run-trivy.sh (security scan)
src/                # demo TypeScript library (the dogfood)
tests/              # unit / smoke / e2e suites
docs/               # methodology, ADRs, flow diagrams
.github/            # CI pipelines, issue/PR templates, community files
WORKFLOW.md         # the three flows in detail
AGENTS.md           # rules every agent must follow
```

## Adopting the harness in your own repo

1. Copy `.claude/commands/`, `.husky/`, `scripts/`, `docs/adr/`, `AGENTS.md` and
   `WORKFLOW.md` into your project.
2. Wire the gates into your `package.json` scripts and `.github/workflows/`.
3. Point the badges and links at your own `owner/repo` slug.
4. Start every change at `/goal` (or `/discovery` / `/bug-analysis`) and follow
   the flow to a green PR.

## Contributing

Contributions are welcome — please read [CONTRIBUTING.md](./CONTRIBUTING.md) and
our [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues: see
[SECURITY.md](./SECURITY.md).

## License

[Apache-2.0](./LICENSE) © Stefan Stelzer
