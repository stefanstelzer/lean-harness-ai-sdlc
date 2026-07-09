# Distribution model

How the harness ships to multiple agent tools from a single source of truth. The
binding decision is [`GEN-008`](../.archgate/adrs/GEN-008-generated-plugin-artifacts.md);
this document is the practical guide.

## Two layers

The harness splits into two layers with different distribution mechanics:

1. **Portable skills and commands** — the 11 agent skills under
   `.agents/skills/<name>/` (knowledge an agent consults) and the 1 agent command
   under `.agents/commands/<name>.md` (an action a human explicitly invokes; see
   `AGENTS.md` › Skills Layout / Commands Layout). Both are self-contained
   instructions that any tool can run. They are *projected* into each tool's
   native format and distributed as a plugin/extension, so you can use them in a
   repo that does not otherwise adopt the harness.
2. **Repo-bound machinery** — the canonical `.agents/` source, [archgate](https://archgate.dev) governance
   (`.archgate/`), CI (`.github/`), git hooks (`.husky/`), and the helper scripts.
   This layer makes the workflow in `WORKFLOW.md` actually *run* and is installed
   into a repo with `/init-harness` (see below), not via the plugin system.

## The generator

`.agents/` is the single source of truth. `scripts/build-plugins.mjs`
(`npm run build:plugins`) reads it and projects each skill, each command, plus
`AGENTS.md` into every tool's native layout. This is the same "author once,
project everywhere" philosophy as the `.claude/` symlinks (`.agents/` →
`.claude/`), one level up: some target formats (Gemini `.toml` commands,
`GEMINI.md`) cannot be expressed as a plain symlink, so a generator does the
projection instead.

The fully-managed generated paths (`plugins/lean-harness/skills/`,
`commands/lean/`, `GEMINI.md`) are wiped and rebuilt on every run, so deletions
in the source propagate and no stale artefacts survive.
`plugins/lean-harness/commands/<name>.md` is a special case — it shares its
directory with the hand-authored `init-harness.md`, so the generator only
creates, rewrites, or removes-as-stale files carrying a
`# GENERATED from .agents/commands/...` marker comment, never touching a file
without one. `scripts/check-plugins.sh` (`npm run check:plugins`) re-runs the
generator and fails if the tree drifts; it is wired into `npm run verify`, the
pre-push hook, and CI (`ci.yml`).

## File map: managed vs hand-authored

| Path | Status | Produced by / role |
| --- | --- | --- |
| `.agents/skills/<name>/SKILL.md` | **Canonical source** | Single source of truth for skills (knowledge) |
| `.agents/commands/<name>.md` | **Canonical source** | Single source of truth for commands (actions) |
| `AGENTS.md`, `WORKFLOW.md` | **Canonical source** | Harness rules and flows |
| `plugins/lean-harness/skills/<name>/` | Generated (managed) | Claude Code plugin skills |
| `plugins/lean-harness/commands/<name>.md` | Generated (managed, marker-comment files only) | Claude Code plugin commands |
| `commands/lean/<name>.toml` | Generated (managed) | Gemini CLI commands (`/lean:<name>`), from either canonical source |
| `GEMINI.md` | Generated (managed) | Gemini CLI context, from `AGENTS.md` |
| `.claude-plugin/marketplace.json` | Hand-authored | Claude Code marketplace manifest |
| `plugins/lean-harness/.claude-plugin/plugin.json` | Hand-authored | Claude Code plugin manifest |
| `gemini-extension.json` | Hand-authored | Gemini CLI extension manifest |
| `plugins/lean-harness/commands/init-harness.md` | Hand-authored | Claude Code `/init-harness` command |

Never hand-edit a managed path — the next build overwrites it (or, for the
marker-comment files in `plugins/lean-harness/commands/`, is indistinguishable
from a stale file and gets pruned) and `check:plugins` fails either way. Edit the
hand-authored manifests directly.

## Adding or changing a skill or command

1. Edit (or add) the skill under `.agents/skills/<name>/` (`SKILL.md` plus any
   supporting docs) or the command at `.agents/commands/<name>.md` (a single
   flat file — a command should point at a skill for any knowledge it needs
   rather than bundling its own reference docs). This is the only place you
   author skill or command content.
2. Run `npm run build:plugins` to regenerate the per-tool artefacts.
3. If the *set* of skills or commands changed, update the hand-authored lists in
   `.claude-plugin/marketplace.json` and `plugins/lean-harness/.claude-plugin/plugin.json`
   (these are not auto-generated).
4. Commit the source change together with the regenerated artefacts. `npm run verify`
   (and CI) will reject a commit where the two are out of sync.

## Per-tool install and consumption

### Claude Code

```text
/plugin marketplace add stefanstelzer/lean-harness-ai-sdlc
/plugin install lean-harness@lean-harness
```

Claude Code reads `.claude-plugin/marketplace.json`, installs the plugin under
`plugins/lean-harness/`, and exposes each generated skill as `/lean-harness:<skill>`
and each generated command as `/lean-harness:<command>`. Skills stay as separate
files (`SKILL.md` plus supporting docs); commands are single files
(`<name>.md`) — both match Claude Code's native layouts.

### Gemini CLI

```bash
gemini extensions install https://github.com/stefanstelzer/lean-harness-ai-sdlc
```

Gemini CLI reads `gemini-extension.json`, loads the `commands/lean/*.toml` files as
custom commands (`/lean:<name>`, e.g. `/lean:tdd`, `/lean:pr`), and uses `GEMINI.md`
as context. Because a Gemini command is a single prompt, the generator folds each
skill's supporting docs into the one `.toml` prompt so the command is
self-contained; a canonical command source has no supporting docs to fold.

### Antigravity

Clone or use this repo as a workspace template. Antigravity consumes
`.agents/skills/`, `.agents/commands/`, and `AGENTS.md` natively — no packaging
step is required, because the repo already provides them. Add any MCP servers
via `~/.gemini/config/mcp_config.json` if needed.

## `/init-harness`

The Claude Code plugin ships only the *skills and commands* layer. To install the
*repo-bound machinery* into a target repo, run `/lean-harness:init-harness`
(defined in `plugins/lean-harness/commands/init-harness.md`). It fetches the
harness with `npx degit stefanstelzer/lean-harness-ai-sdlc`, copies in `.agents/`,
`.archgate/`, `.husky/`, `AGENTS.md`, `WORKFLOW.md`, CI and config, recreates the
`.claude/` symlinks, merges the gate scripts into `package.json`, and runs the
verify gates — without overwriting the user's own `src/`, `tests/`, or
`package.json`.
