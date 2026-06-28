---
id: GEN-001
title: Conventional Commits across every flow
status: accepted
domain: general
rules: true
---

# Conventional Commits across every flow

## Context

This repo derives its changelog and its release version mechanically from commit
history (see GEN-007). That only works if every commit subject follows a
predictable grammar. Humans and AI agents both write commits here, so the
convention has to be enforced by a hook, not by memory.

## Decision

Every commit on every branch follows the
[Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

- Allowed types are pinned in `commitlint.config.cjs`: `feat`, `fix`, `docs`,
  `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, and the
  project-specific `adr` (for ADR authoring/amendment commits).
- A breaking change is signalled with `!` after the type/scope or a
  `BREAKING CHANGE:` footer — this raises the SemVer floor to a major bump.
- `commitlint.config.cjs` extends `@commitlint/config-conventional` and runs from
  the Husky `commit-msg` hook, so non-conforming messages are rejected locally.

## Do's and Don'ts

### Do

- Write `feat(flags): add percentage rollout` — type, optional scope, imperative
  description.
- Use `fix:` for bug fixes, `feat:` for new capabilities, `chore:`/`build:`/`ci:`
  for tooling.
- Mark breaking changes with `!` or a `BREAKING CHANGE:` footer.

### Don't

- Don't write free-form subjects like `updated stuff` — the `commit-msg` hook
  rejects them.
- Don't invent new types; add them to `type-enum` in `commitlint.config.cjs`
  first if a genuinely new category is needed.
- Don't bypass the hook with `--no-verify` to land a non-conforming message.

## Consequences

### Positive

- The changelog and the release version are generated deterministically from
  history (GEN-007).
- Commit history reads as a structured log of intent.

### Negative

- A small upfront discipline cost; mitigated by the local hook catching mistakes
  immediately.

### Risks

- If the repo ever switches to squash-merge, the squash subject must itself be a
  Conventional Commit, or the floor computation loses signal.
