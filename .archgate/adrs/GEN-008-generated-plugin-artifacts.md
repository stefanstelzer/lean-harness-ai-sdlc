---
id: GEN-008
title: Generated plugin artefacts are projected from .agents, never hand-edited
status: accepted
domain: general
rules: false
files:
  - ".agents/**"
  - "plugins/**"
  - "commands/**"
  - "GEMINI.md"
  - "AGENTS.md"
  - "WORKFLOW.md"
---

# Generated plugin artefacts are projected from .agents, never hand-edited

## Context

The harness ships to multiple agent tools (Claude Code, Gemini CLI, Antigravity),
each of which expects skills and context in its own native layout. Maintaining a
hand-written copy per tool would guarantee drift: a skill edited in one place and
forgotten in the others. This repo already solves the same problem for the
`.claude/` views with the symlink invariant — `.agents/` is the single source of
truth and `.claude/` holds only symlinks into it (see the Skills/Rules Layout in
`AGENTS.md`).

Some target formats cannot be expressed as a plain symlink: Gemini CLI wants
single-file `.toml` commands with the supporting docs folded into one prompt, and
a `GEMINI.md` context file derived from `AGENTS.md`. So the same "author once,
project into every tool" philosophy is implemented one level up by a generator
(`scripts/build-plugins.mjs`, run via `npm run build:plugins`) instead of a
symlink. Without a binding rule, the generated tree would be hand-edited and drift
from the canonical source exactly as the unguarded copies would.

## Decision

`.agents/` (skills under `.agents/skills/<name>/SKILL.md`, plus `AGENTS.md` and
`WORKFLOW.md`) is the **single source of truth** for plugin distribution. The
per-tool artefacts are **generated** by `scripts/build-plugins.mjs` and MUST NOT
be hand-edited:

- `plugins/lean-harness/skills/<name>/` — Claude Code plugin skills.
- `commands/lean/<name>.toml` — Gemini CLI custom commands (invoked `/lean:<name>`).
- `GEMINI.md` — Gemini CLI context, projected from `AGENTS.md`.

The generator wipes and rebuilds these managed paths on every run, so deletions in
the source propagate and no stale artefacts survive. A small set of manifests is
**hand-authored** and left untouched by the generator:
`.claude-plugin/marketplace.json`,
`plugins/lean-harness/.claude-plugin/plugin.json`, `gemini-extension.json`, and
`plugins/lean-harness/commands/init-harness.md`.

Sync is enforced mechanically: `scripts/check-plugins.sh` (`npm run check:plugins`)
re-runs the generator and fails if the generated tree differs from a fresh build.
It is wired into `npm run verify`, the pre-push hook, and CI (`ci.yml`),
mirroring how `check:skills` / `check:rules` enforce the `.agents/` → `.claude/`
symlink invariant. This ADR is `rules: false`: the gate is the
`check:plugins` script plus pre-push/CI discipline, not an executable archgate rule.

## Do's and Don'ts

### Do

- Edit skills only under `.agents/skills/<name>/`, then run `npm run build:plugins`
  and commit the regenerated artefacts alongside the source change.
- Edit harness context only in `AGENTS.md` (which `GEMINI.md` is projected from),
  then regenerate.
- Edit the hand-authored manifests (`marketplace.json`, `plugin.json`,
  `gemini-extension.json`, `init-harness.md`) directly — they are not generated.
- Run `npm run check:plugins` (or `npm run verify`) before pushing to confirm the
  generated tree is in sync.

### Don't

- Don't hand-edit any managed path: `plugins/lean-harness/skills/`,
  `commands/lean/`, or `GEMINI.md`. Changes there are overwritten on the next
  build and will fail `check:plugins`.
- Don't add a tool-specific copy of a skill outside `.agents/` — author it once in
  the canonical source and let the generator project it.
- Don't commit a skill or `AGENTS.md` change without re-running
  `npm run build:plugins`; the CI sync check will fail otherwise.

## Consequences

### Positive

- One canonical source for skills and context; every tool sees the same set with
  no copy drift, mirroring the symlink invariant.
- Adding or changing a skill is a single edit plus a regenerate step; new targets
  can be added by extending the generator rather than by hand-maintaining copies.

### Negative

- A regenerate-and-commit step is required after any skill or `AGENTS.md` change;
  forgetting it produces a failing (but clearly diagnosed) CI check.

### Risks

- The generator and the hand-authored manifests can fall out of step (e.g. the
  skill list in `marketplace.json` / `plugin.json` is not auto-generated). Keep
  those descriptions in sync by hand when the skill set changes.
