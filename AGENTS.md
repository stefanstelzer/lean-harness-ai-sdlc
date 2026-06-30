# AGENTS.md

Operating rules for any AI agent (Claude Code, Cursor, Copilot, Aider, or any
other tool that reads `AGENTS.md`) working in this repository. These rules
implement the [workflow](./WORKFLOW.md) and are deliberately strict — the harness
trades a little ceremony for reliable quality at agent speed.

The workflow is **human-in-the-loop (HITL)** and **non-subagentic** by design: a
human drives and reviews every stage; skills assist, but no autonomous subagent
owns a stage end-to-end. Read [`WORKFLOW.md`](./WORKFLOW.md) before starting work.

## Prime directives

1. **Follow a flow.** Every change starts at an entry point: `/discovery`
   (feature), `/bug-analysis` (bug), or `/goal` (change request). Don't skip to
   coding.
2. **Be LEAN.** Maximize the work _not_ done. Prefer the smallest change that
   satisfies the acceptance criteria. Reuse existing code — search before adding.
3. **Build quality in.** No production code without a failing test demanding it
   (`/tdd`). Keep the suite green at every commit (`GEN-004`, `GEN-005`).
4. **Respect the architecture.** Honor the ADRs in
   [`.archgate/adrs/`](./.archgate/adrs/). The archgate (`npm run archgate`) must
   stay green. New boundaries require a new ADR — author it with `/adr-author`.

## Language

The primary language of this project is **English**. All code, documentation, and
communication are in English.

**Written artifacts MUST be in English regardless of the language of the user
prompt.** This applies to every file, every commit message, and every code
comment. The only exception is content that is part of the product itself (e.g.
user-facing UI strings, translation files, domain terminology that has no
established English equivalent). When in doubt, write English.

ADRs in `.archgate/adrs/` and any other governance or process documentation
(READMEs, PRDs, plans, ADRs themselves) MUST be authored in English. The
product-content exception above does **not** extend to these files.

## Skills Layout

Agent skills live in `.agents/skills/<name>/SKILL.md` as the single source of
truth. `.claude/skills/<name>` must be a symlink pointing to
`../../.agents/skills/<name>` so every agent tool on the team sees the same skill
set.

When adding a new skill:

1. Create it under `.agents/skills/<name>/` (never directly under `.claude/skills/`).
2. Create the symlink: `ln -s ../../.agents/skills/<name> .claude/skills/<name>`.
3. Commit both the skill directory and the symlink.

When removing a skill, delete both the real directory and the symlink.

`scripts/check-skill-symlinks.sh` (`npm run check:skills`) enforces this
invariant and runs in the pre-push hook and CI. Symlinks require
`git config core.symlinks=true` (default on macOS/Linux); Windows development is
not supported, so no copy-based fallback is maintained.

## Rules Layout

Agent workspace rules (persistent instructions loaded automatically on startup)
live in `.agents/rules/<name>.md` as the single source of truth, mirroring the
skills layout. `.claude/rules/<name>.md` must be a symlink pointing to
`../../.agents/rules/<name>.md`.

When adding a new rule:

1. Create it under `.agents/rules/<name>.md` (never directly under `.claude/rules/`).
2. Create the symlink: `ln -s ../../.agents/rules/<name>.md .claude/rules/<name>.md`.
3. Commit both the rule file and the symlink.

When removing a rule, delete both the real file and the symlink.

`scripts/check-rule-symlinks.sh` (`npm run check:rules`) enforces this invariant
and runs in the pre-push hook and CI. The rule files are short ADR routers
(`general-adrs.md`, `architecture-adrs.md`) plus `styling-consistency.md`; they
point agents to the binding ADRs by domain rather than duplicating their content.

## Skill & Rule Authoring

Skills and workspace rules are shared by every agent on the team. They MUST be
written **agent-agnostic** and MUST NOT reference a specific agent vendor,
product, or model (e.g. "Claude", "Claude Code", "GPT", "Copilot", "Cursor").
Write from the team's perspective — use neutral terms like "the agent", "the
team", "you", or simply describe the task in the imperative. This applies to the
`description` frontmatter, body copy, examples, and any bundled reference files.
When updating an existing skill or rule, remove any vendor-specific phrasing you
encounter. The meta-skill `/write-better-skill` documents how to author skills
for this harness.

Each `SKILL.md` opens with YAML frontmatter. Declare only the tools the skill
actually uses:

```yaml
---
name: <name>
description: <one line — when to use>
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(archgate:*), Edit, Write, Agent
user-invocable: <true|false>
---
```

**No autonomous subagents.** Skills assist a human-driven stage; they do not
delegate a whole stage to an autonomous subagent. A human stays in the loop at
each stage (see [`WORKFLOW.md`](./WORKFLOW.md)).

## Plugin distribution

The harness is distributed to three agent tools, but `.agents/` stays the single
source of truth (`GEN-008`). `scripts/build-plugins.mjs` (`npm run build:plugins`)
projects the canonical skills and `AGENTS.md` into each tool's native format —
the same "author once" philosophy as the `.claude/` symlinks, one level up.

**Never hand-edit the generated artefacts.** They are wiped and rebuilt on every
run: `plugins/lean-harness/skills/` (Claude Code plugin skills), `commands/lean/`
(Gemini CLI commands, invoked `/lean:<name>`), and `GEMINI.md` (Gemini context
from `AGENTS.md`). Edit `.agents/skills/<name>/` or `AGENTS.md`, then run
`npm run build:plugins` and commit the result. `npm run check:plugins` (in
`verify`, pre-push and CI) fails if the generated tree drifts.

The three distribution targets:

- **Claude Code** — a plugin + marketplace (`.claude-plugin/marketplace.json`,
  `plugins/lean-harness/`); skills appear as `/lean-harness:<skill>`, plus
  `/lean-harness:init-harness` to scaffold the full harness.
- **Gemini CLI** — an extension (`gemini-extension.json`) of `/lean:<skill>`
  commands with `GEMINI.md` as context.
- **Antigravity** — no packaging; it consumes `.agents/skills/` and `AGENTS.md`
  natively, so the repo is used directly as a workspace template.

The manifests listed above plus `plugins/lean-harness/commands/init-harness.md`
are hand-authored and not generated — edit them directly.

## Branch Policy

**Never commit directly to `main`.** Committing on `main` is strictly prohibited,
regardless of how trivial the change appears. This rule has no exceptions for
humans or agents. If the user explicitly requests a commit on `main`, refuse and
explain this rule, then offer to create a branch and commit there instead.

- Branch names: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- The **first commit on a feature branch is the spec** — the PRD
  (`prd/PRD-<n>-<slug>.md`) and plan (`plans/PLN-<n>-<slug>.md`) — landed by
  `/tdd` before any production code.

There are **no exceptions** — not even for releases. Versioning is manual and
goes through the normal branch → PR → merge flow like any other change: bump
`package.json`, update `CHANGELOG.md`, and tag `vX.Y.Z` on a branch, then open a
PR (see `GEN-007`). No machine writes to `main`.

## PR Descriptions

Every PR MUST have a non-empty body that surfaces the commits it contains. GitHub
does not auto-populate the PR body from commit messages — you must opt in.

- **Every PR body MUST include exactly these three H2 sections, in this order**:
  `## Summary`, `## Commits`, and `## Manual Test Plan` (the last with at least one
  filled `- [ ]` step — `GEN-006`).
- **`gh pr create --fill` / `--fill-verbose` populate the body from commit
  subjects/bodies and ignore `.github/PULL_REQUEST_TEMPLATE.md`** — so they do **not**
  add a `## Manual Test Plan` on their own. Use them only to seed `## Commits` (keeping
  the commit messages and any `Co-Authored-By` trailers visible), then add the Manual
  Test Plan explicitly with `--body-file` or a follow-up `gh pr edit --body-file`.
- **Manual `--body` / `--body-file`**: write all three H2 sections directly. This is
  the reliable path, since it does not depend on the template being applied.
- **`## Manual Test Plan`**: this section MUST contain at least one filled
  `- [ ] <step>` checklist bullet describing a concrete, human-executable
  verification step. Placeholder bullets (`<step>`, `<TODO>`, …) are not
  acceptable. See `.archgate/adrs/GEN-006-manual-test-plan-required.md` for the
  binding rule (auto-loaded via the `general-adrs` rule) and
  [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md).

Empty bodies and auto-derived-from-branch-name titles are not acceptable. After
creating or updating a PR, verify with `gh pr view <n> --json title,body`. The
`/pr` skill drives this end-to-end (commit → push → PR → CI green).

## Conventions

### Commits — Conventional Commits

`type(scope): summary`. Allowed types: `feat`, `fix`, `docs`, `style`,
`refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `adr`. Enforced by
the `commit-msg` hook (commitlint) and required by `GEN-001` — it drives
versioning (`GEN-007`).

### Code style

- TypeScript, strict mode (`GEN-003`). ESM (`.js` import specifiers for local
  modules).
- Prettier + ESLint are the source of truth — run `npm run lint` / `npm run format`.
- Match the surrounding code's naming and comment density. See
  `.agents/rules/styling-consistency.md`.

### Architecture (enforced by archgate, `ARCH-001`)

These rules are checked by [archgate](https://archgate.dev) — the external
architecture-governance CLI run via `npm run archgate`; see the
[README](./README.md#architecture-governance) for what it is and how it's pulled in.

- `src/index.ts` only re-exports; dependency direction flows
  `index.ts → feature-flags.ts → types.ts`.
- `src/types.ts` is the lowest layer — no internal imports.
- Production code (`src/`) must never import from `tests/`.
- Relative imports must not escape `src/`.

## Definition of Done

A change is done only when **all** of these hold:

- [ ] Acceptance criteria from `/goal` / `/discovery` (or the bug's failing test)
      are met.
- [ ] New behaviour is covered by unit tests; user journeys by smoke/e2e
      (`GEN-004`, `GEN-005`, `GEN-002`).
- [ ] **Archgate is green** (`npm run archgate`) — all ADRs satisfied.
- [ ] **Tests are green** and `npm run verify` passes (lint + symlink checks +
      archgate + tests).
- [ ] **Symlinks are in sync** (`npm run check:links`).
- [ ] Trivy scan is clean (no HIGH/CRITICAL vulns or secrets).
- [ ] An ADR was added/updated (via `/adr-author`) if an architectural decision
      was made.
- [ ] Commits follow Conventional Commits and the PR body meets the rules above.

## Tooling map

| Need               | Command / file                                          |
| ------------------ | ------------------------------------------------------- |
| Run all gates      | `npm run verify`                                        |
| Architecture check | `npm run archgate` / `npm run archgate:ci`              |
| Symlink invariants | `npm run check:links` (`check:skills` + `check:rules`)  |
| Security scan      | `scripts/run-trivy.sh`                                  |
| Tests              | `npm test` / `:unit` / `:smoke` / `:e2e`                |
| Skills             | [`.agents/skills/`](./.agents/skills/)                  |
| Rules              | [`.agents/rules/`](./.agents/rules/)                    |
| Decisions          | [`.archgate/adrs/`](./.archgate/adrs/)                  |

## When unsure

Ask, don't guess. Use `/grill-me-with-context` to pull missing context from the
human before planning. Read the repository before assuming behaviour.

## After shipping

Run `/lessons-learned` and turn insight into durable changes (ADRs via
`/adr-author`, archgate rules, skills, `AGENTS.md`) — improve the _system_, not
just this change.

## README-Maintenance

After every code change, check the relevant README for consistency with the
current code and update it as needed (new features, changed API, removed
functions, modified setup). Don't ask for confirmation; make the update right
away.
