---
id: GEN-007
title: Versioning and release from Conventional Commits
status: accepted
domain: general
rules: true
---

# Versioning and release from Conventional Commits

## Context

This is a single npm package. Its version must move predictably and its changelog
must stay in sync with what actually shipped. Because humans and AI agents both
land changes here, the *level* of a version bump cannot depend on someone's
judgement alone — it has to be derivable mechanically from the commit history that
GEN-001 already guarantees is Conventional-Commits-formatted. Cutting the release
itself, however, is a deliberate maintainer action: this repo runs no automated
release pipeline, so versioning flows through the same branch → PR → merge path as
every other change.

## Decision

1. **Single source of truth.** The package version lives in `package.json`
   `version`. There are no per-app versions — this is not a monorepo.

2. **Deterministic SemVer floor.** `scripts/semver-floor.mjs` computes the bump
   level from the Conventional Commits since the last `v*` git tag:
   - `fix:` / `perf:` / anything → patch
   - `feat:` → minor
   - `<type>!:` or a `BREAKING CHANGE:` footer → major

   The floor is reproducible from history alone (`--print`); `--apply <level>`
   prints the resulting version.

3. **The agent may only raise.** The optional `decide-semver` skill may read the
   diff and *raise* the bump (e.g. flag an undeclared breaking change), never
   lower it. A release takes `max(floor, agent)`, so the number stays reproducible
   regardless of what the agent returns. `decide-semver` is a manual helper run on
   demand; when it is not used the deterministic floor stands alone.

4. **Release is manual — there is no automated release pipeline.** A maintainer
   cuts a release deliberately: compute the level with
   `node scripts/semver-floor.mjs` (optionally refined by `/decide-semver`), bump
   `package.json`, update `CHANGELOG.md`, and tag `vX.Y.Z` — all through the
   normal branch → PR → merge flow. Nothing bumps the version or pushes to `main`
   on its own.

5. **Changelog.** `CHANGELOG.md` follows Keep a Changelog and is the
   human-readable record of each release, grouped by the Conventional-Commit
   types that produced it.

Versioning claims no exception to the "never commit to main" policy
(AGENTS.md § Branch Policy): like every other change, a release lands via a PR.

## Do's and Don'ts

### Do

- Derive the bump level mechanically — `node scripts/semver-floor.mjs --print` —
  rather than eyeballing it.
- Keep `CHANGELOG.md` present and current; update it as part of the release PR.
- Write Conventional Commits (GEN-001) so the floor computation has signal.

### Don't

- Don't bump `package.json` `version` outside a deliberate release; let the floor
  decide the level.
- Don't lower a bump the agent or the floor computed.
- Don't commit a release straight to `main` — it goes through the normal PR flow
  like everything else (AGENTS.md § Branch Policy).

## Consequences

### Positive

- The version and changelog are reproducible from history; the *level* of a bump
  is boring and mechanical even though cutting the release is a manual step.
- A breaking change cannot ship as a patch — the floor (or the agent) catches it.
- No machine writes to `main`; the branch-protection model has no carve-out.

### Negative / Risks

- Because releases are manual, a maintainer must remember to cut them; the
  deterministic floor keeps the *level* honest but does not trigger the release.
- Assumes commit subjects survive merge. If the repo switches to squash-merge, the
  squash subject must itself be a Conventional Commit or the floor loses signal.
