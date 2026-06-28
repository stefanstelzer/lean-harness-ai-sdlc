---
name: decide-semver
description: Decide the semantic-version bump for the release by reviewing the changes since the last tag against the Conventional-Commits floor, raising it only when the diff proves the messages understate the impact. Use during release to set or confirm the version bump.
allowed-tools: Read, Glob, Grep, Bash(git:*), Write
---
# Decide SemVer

Decide the release's version bump for this single package (`GEN-007`). The release pipeline already computes a **floor** from the Conventional-Commits since the last tag (`scripts/semver-floor.mjs`); this skill reviews the actual diff and may only **raise** that floor when the changes prove the commit messages understated the impact. It never lowers it.

## Process

1. **Establish the range.** The window is the last release tag to `HEAD`:

   ```bash
   git describe --tags --abbrev=0 --match 'v[0-9]*'   # last version tag, e.g. v0.1.0
   ```

   The review range is `<last-tag>..HEAD` (or the full history if no tag exists yet).

2. **Review the changes** over that range:

   ```bash
   git log <range> --no-merges --format='%h %s'
   git diff <range> --stat
   ```

   Then read the diffs of any files that look API-relevant (exported symbols in `src/index.ts` and the public surface it re-exports, function/type signatures, public contracts — `ARCH-001`).

3. **Decide the level** using these definitions:

   - **major** — a backward-incompatible change to a public contract: a removed or renamed export, a changed function or type signature, a breaking data-shape change, or any commit marked `!:` / `BREAKING CHANGE`.
   - **minor** — a new, backward-compatible capability (a `feat:`): a new exported function, option, or feature behind a flag.
   - **patch** — bug fixes, refactors, performance, docs, tests, build/CI, or internal-only changes with no public-surface impact.

   Be **conservative**: only choose a level *above* the floor when the diff shows concrete evidence the messages under-state the impact. When in doubt, do not raise.

4. **Write the decision** to `.semver-decision.json` at the repo root, and nothing else to it:

   ```json
   { "bump": "minor", "reason": "Adds a new exported parser option (feat); no public API removed or changed." }
   ```

   Keep `reason` to one sentence citing the concrete evidence. Then state the same object as your final message.

