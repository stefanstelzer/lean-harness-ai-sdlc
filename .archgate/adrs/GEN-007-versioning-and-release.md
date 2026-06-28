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
land changes here, the version cannot depend on someone remembering to bump it —
it has to be derived mechanically from the commit history that GEN-001 already
guarantees is Conventional-Commits-formatted.

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
   lower it. The release workflow takes `max(floor, agent)`, so the number stays
   reproducible regardless of what the agent returns. `decide-semver` runs only
   when an `ANTHROPIC_API_KEY` is available; otherwise the deterministic floor
   stands alone.

4. **Release on merge to main.** `release.yml` computes the next version, bumps
   `package.json`, updates `CHANGELOG.md`, and cuts a `vX.Y.Z` git tag plus a
   GitHub Release in a single `chore(release): …` commit. The release commit is
   marked so it does not re-trigger the release workflow.

5. **Changelog.** `CHANGELOG.md` follows Keep a Changelog and is the
   human-readable record of each release, grouped by the Conventional-Commit
   types that produced it.

This is the one documented exception to the "never commit to main" policy
(AGENTS.md § Branch Policy): only the release pipeline may push to `main`.

## Do's and Don'ts

### Do

- Let the pipeline own the version bump — derive it with
  `node scripts/semver-floor.mjs --print`.
- Keep `CHANGELOG.md` present and current; let the release step append to it.
- Write Conventional Commits (GEN-001) so the floor computation has signal.

### Don't

- Don't hand-edit `package.json` `version` except for a deliberate one-time seed.
- Don't lower a bump the agent or the floor computed.
- Don't author any other automated commit to `main` — the exception is
  release-pipeline-only.

## Consequences

### Positive

- The version and changelog are reproducible from history; releases are boring and
  automatic.
- A breaking change cannot ship as a patch — the floor (or the agent) catches it.

### Negative / Risks

- The pipeline commits to `main` (one bot commit per release); guarded by the
  no-re-trigger marker on the release commit.
- Assumes commit subjects survive merge. If the repo switches to squash-merge, the
  squash subject must itself be a Conventional Commit or the floor loses signal.
