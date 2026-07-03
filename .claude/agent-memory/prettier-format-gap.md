# Prettier formatting is not gated — check your changed files yourself

**Date:** 2026-07-02 · **Class:** Operational / Process

`npm run verify`, the pre-push hook, and CI run ESLint but **no Prettier check**
(`eslint-config-prettier` deliberately disables formatting rules, and
`format:check` is not wired into any gate). As of this writing, `npm run
format:check` reports dozens of non-conforming files on `main`, so a full
`npm run format` would produce a repo-wide diff unrelated to your change.

**Do:**

- Before committing, run `npx prettier --check <only the files you changed>`
  and format just those (`npx prettier --write <files>`). Markdown written by
  hand (PRDs, plans) is the usual offender — Prettier rewraps emphasis and list
  indentation.
- Do **not** run a repo-wide `npm run format` inside a feature branch; it buries
  the change under formatting noise.

**Open flag for the maintainer:** either wire `format:check` into `verify`/CI
(after a one-time repo-wide format commit) or drop the "run format before
pushing" expectation from the styling rule — today the rule and the gates
disagree.
