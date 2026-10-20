---
description: Test execution standards and background process prevention. Governs how test commands must be run during development, TDD, and debugging.
---

# Test Execution & Process Management

## 1. Scoped Test Execution

- Scope test execution to the specific file(s) under development.
- Do not run full test suites during incremental TDD.
- **Syntax:**
  - Single spec: `npm test -- <test-file> --reporter=verbose`
  - Scoped suite: `npm run test:unit`, `npm run test:smoke`, or `npm run test:e2e`

## 2. Single-Run Mode & Task Cleanup

- Run tests strictly in single-run mode (`vitest run`, `--run`, `--watch=false`). Watch mode is prohibited.
- Before launching a new test command, inspect active background tasks via `manage_task(Action='list')` and terminate any stale test processes (`manage_task(Action='kill')`).
