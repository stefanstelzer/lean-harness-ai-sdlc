# Contributing

Thanks for your interest in improving **lean-harness-ai-sdlc**! This project
practices what it preaches: contributions follow one of the three flows in
[WORKFLOW.md](./WORKFLOW.md), and the same gates apply to everyone.

## Getting started

```bash
nvm use            # Node from .nvmrc
npm install        # installs deps + git hooks (husky)
npm run verify     # lint + archgate + tests — should be green
```

## Pick a flow

| You want to…                     | Flow           | Start with      |
| -------------------------------- | -------------- | --------------- |
| Add a capability                 | Feature        | `/discovery`    |
| Fix something broken             | Bug            | `/bug-analysis` |
| Make a scoped, understood change | Change request | `/goal`         |

(The slash commands live in [`.claude/commands/`](./.claude/commands/) for use
with Claude Code, but you can follow the same stations by hand.)

## Ground rules

- **Branch** off `main`: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- **Test-first.** No production code without a failing test (`/tdd`). Keep the
  suite green at every commit.
- **Respect the architecture.** Honor the ADRs in [`.archgate/adrs/`](./.archgate/adrs/);
  `npm run archgate` must pass — it runs [archgate](https://archgate.dev), the
  external architecture-governance CLI (see the
  [README](./README.md#architecture-governance)). New boundaries need a new ADR.
- **Conventional Commits.** Enforced by the `commit-msg` hook. Example:
  `feat(flags): add percentage rollout`.
- **Run the gate before pushing.** `npm run verify`. The `pre-push` hook also
  runs archgate, Trivy and unit tests.

## Opening a pull request

1. Push your branch and open a PR against `main`.
2. Fill in the PR template checklist (it mirrors the archgate Definition of Done).
3. CI runs the **PR pipeline** (full suite + Trivy + coverage). Keep it green.
4. A maintainer reviews via the `/reviewer` lens. Address findings, then merge.

## Code style

Prettier + ESLint are the source of truth. Run `npm run format` and
`npm run lint:fix` before pushing. Match the surrounding code.

## Reporting bugs & requesting features

Use the [issue templates](./.github/ISSUE_TEMPLATE/). For security issues, follow
[SECURITY.md](./SECURITY.md) — do **not** open a public issue.

By contributing, you agree your contributions are licensed under the project's
[Apache-2.0](./LICENSE) license and that you follow our
[Code of Conduct](./CODE_OF_CONDUCT.md).
