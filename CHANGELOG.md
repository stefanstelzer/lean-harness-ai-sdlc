# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial scaffold of the LEAN & harness-powered AI SDLC framework.
- Nine agent skills (slash commands) in `.claude/commands/`.
- Architecture-fitness gate (`scripts/archgate.mjs`) enforcing ADR layering.
- Git hooks: `commit-msg` (Conventional Commits) and `pre-push`
  (archgate → Trivy → unit tests).
- CI pipelines: push, PR (full suite + Trivy + coverage), nightly e2e, release.
- TypeScript demo library (`FeatureFlags`) with unit, smoke and e2e tests.
- Community health files, issue/PR templates, ADRs and methodology docs.

[Unreleased]: https://github.com/stefanstelzer/lean-harness-ai-sdlc/commits/main
