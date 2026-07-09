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

`.agents/` splits into two canonical roots: `.agents/skills/<name>/SKILL.md` for
knowledge/reference the agent consults, and `.agents/commands/<name>.md` for a
workflow station a human explicitly invokes (see `AGENTS.md` › Skills Layout /
Commands Layout). Both feed the same generator — a command is not a second
pipeline, just a second glob root into the existing one.

## Decision

`.agents/` — skills under `.agents/skills/<name>/SKILL.md`, commands under
`.agents/commands/<name>.md`, plus `AGENTS.md` and `WORKFLOW.md` — is the
**single source of truth** for plugin distribution. The per-tool artefacts are
**generated** by `scripts/build-plugins.mjs` and MUST NOT be hand-edited:

- `plugins/lean-harness/skills/<name>/` — Claude Code plugin skills, projected
  from `.agents/skills/<name>/SKILL.md`.
- `plugins/lean-harness/commands/<name>.md` — Claude Code plugin commands,
  projected from `.agents/commands/<name>.md`. This path is **shared** with the
  hand-authored `plugins/lean-harness/commands/init-harness.md` (below): every
  generated file here carries a `# GENERATED from .agents/commands/<name>.md …`
  marker comment as the first line inside its YAML frontmatter, and the generator
  only creates, rewrites, or removes-as-stale files carrying that marker — a file
  without it (`init-harness.md`) is never touched.
- `commands/lean/<name>.toml` — Gemini CLI custom commands (invoked
  `/lean:<name>`), sourced from whichever root (`.agents/skills/` or
  `.agents/commands/`) contains `<name>`.
- `GEMINI.md` — Gemini CLI context, projected from `AGENTS.md`.

The generator wipes and rebuilds the fully-managed paths
(`plugins/lean-harness/skills/`, `commands/lean/`, `GEMINI.md`) on every run, so
deletions in the source propagate and no stale artefacts survive.
`plugins/lean-harness/commands/` is only *partially* managed — marker-comment
files only, per above. A small set of manifests is **hand-authored** and left
untouched by the generator: `.claude-plugin/marketplace.json`,
`plugins/lean-harness/.claude-plugin/plugin.json`, `gemini-extension.json`, and
`plugins/lean-harness/commands/init-harness.md`.

Sync is enforced mechanically: `scripts/check-plugins.sh` (`npm run check:plugins`)
re-runs the generator and fails if the generated tree differs from a fresh build.
It is wired into `npm run verify`, the pre-push hook, and CI (`ci.yml`),
mirroring how `check:skills` / `check:rules` / `check:commands` enforce the
`.agents/` → `.claude/` symlink invariant. This ADR is `rules: false`: the gate
is the `check:plugins` script plus pre-push/CI discipline, not an executable
archgate rule.

## Do's and Don'ts

### Do

- Edit skills only under `.agents/skills/<name>/`, and commands only under
  `.agents/commands/<name>.md`, then run `npm run build:plugins` and commit the
  regenerated artefacts alongside the source change.
- Edit harness context only in `AGENTS.md` (which `GEMINI.md` is projected from),
  then regenerate.
- Edit the hand-authored manifests (`marketplace.json`, `plugin.json`,
  `gemini-extension.json`, `init-harness.md`) directly — they are not generated.
- Run `npm run check:plugins` (or `npm run verify`) before pushing to confirm the
  generated tree is in sync.

### Don't

- Don't hand-edit any managed path: `plugins/lean-harness/skills/`,
  `commands/lean/`, `GEMINI.md`, or a marker-comment file under
  `plugins/lean-harness/commands/`. Changes there are overwritten on the next
  build and will fail `check:plugins`.
- Don't add a tool-specific copy of a skill or command outside `.agents/` —
  author it once in the canonical source and let the generator project it.
- Don't commit a skill, command, or `AGENTS.md` change without re-running
  `npm run build:plugins`; the CI sync check will fail otherwise.
- Don't rely on directory-wipe semantics inside `plugins/lean-harness/commands/`
  when extending the generator — it is shared with a hand-authored file, so any
  new logic there MUST filter by the marker comment, never blanket-delete the
  directory the way `plugins/lean-harness/skills/` is wiped.

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
- `plugins/lean-harness/commands/` mixes generated and hand-authored files in one
  directory, unlike every other managed path in this ADR (which are exclusively
  generated). A generator bug that omits the marker-comment check could delete or
  clobber `init-harness.md`. **Mitigation:** the marker-comment filter is the
  single mechanism gating every write/delete in that directory — any change to
  the Claude Code command projection MUST preserve it, and `check:plugins`
  re-running the generator and diffing against git is the backstop that catches
  a regression before it merges.
