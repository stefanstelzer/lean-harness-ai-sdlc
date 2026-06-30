---
name: tdd
description: Test-driven development — build a feature or fix a bug test-first with Vitest, red → green → refactor in vertical slices. Use when implementing or changing code (mandatory per GEN-004), or when the user mentions red-green or test-first.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(git:*), Bash(npm:*), Bash(archgate:*)
user-invocable: true
---

# Test-Driven Development

Drive the implementation from a failing test. The loop is **red → green → refactor**, taken one **vertical slice** at a time: one test, then the minimal code to pass it, then the next. Predictability comes from the loop, not from you — write the test, watch it go red, make it green.

## Philosophy

Tests verify **behaviour through public interfaces**, not implementation details. Code can change entirely; the tests shouldn't.

- **Good tests** read like a specification — "rejects an empty name", "makes the user retrievable" — and exercise real code paths through the public API. They survive refactors because they don't care about internal structure.
- **Low-value tests** couple to internals: they mock your own collaborators, assert on call counts, or verify through a side channel (querying the store directly instead of the interface). The warning sign: the test breaks when you rename an internal function though behaviour is unchanged.

See [`tests.md`](tests.md) for good/bad examples and [`mocking.md`](mocking.md) for where to draw the mock boundary.

## One slice at a time

**Do not write all the tests first, then all the code** — that is a **horizontal slice**, and it produces tests of _imagined_ behaviour: they pin the _shape_ of things, pass when behaviour breaks, and fail when it doesn't. You outrun your headlights, committing to a test structure before you understand the implementation.

Go **vertical**: one test → its implementation → repeat. Each slice responds to what the last one taught you.

```
horizontal (avoid):  test1 test2 test3 … → impl1 impl2 impl3 …
vertical (do this):  test1→impl1, test2→impl2, test3→impl3, …
```

## In this repo

- **Runner: Vitest** (`GEN-005`). Stub with `vi.mock(...)`, never another runner's API. Run the suite with `npm test` (and `npm run build` to typecheck).
- **TDD is mandatory** (`GEN-004`): every module under `src/` (except `index.ts` and pure type files) has a matching test — `<module>.test.ts` beside `<module>.ts`, or a spec under `tests/`. The archgate rule warns on a `src/*.ts` that has no `*.test.ts` / `tests/**` counterpart.
- **The red gate is checkable**: at least one new test must be **failing** before you write implementation. A test that passes with no implementation is dead weight — tighten it until it fails. A compile error is **not** red — fix the TypeScript first, then read the result.

## Workflow

### 1. Branch, and land the spec first

`/tdd` is where the git work starts — it is the first skill to touch the repo, so it opens the branch the feature will live on.

- **Create the feature branch off `main`** — `git checkout -b feat/<slug>` (use `fix/<slug>` for a bug). Never work on `main` (`AGENTS.md` › Branch Policy).
- **Make the first commit the spec.** Commit the PRD (`prd/PRD-<n>-*.md`) and the plan (`plans/PLN-<n>-*.md`) that `/discovery` and `/prd-to-plan` produced — e.g. `docs(plan): add the PRD + plan for <feature>` — before any test or implementation. Landing the agreed contract first makes every later diff reviewable against it. (For a standalone change with no PRD/plan, still branch off `main` first; there is simply no spec commit to make.)
- **Load the plan _and_ its upstream PRD.** Open the plan and follow its `**Upstream PRD:**` link (`GEN-006` requires every plan to carry one); keep both in context as you implement, so each phase is built against the requirements it descends from, not the plan alone.

**Done when** the branch exists off `main` and — when a PRD/plan exist — its first commit contains them and nothing else.

### 2. Confirm the slice — with the human

This repo is **human-in-the-loop**. Before writing code, agree the shape with the user:

- Read the ADRs that govern the area you're touching (routed by the `*-adrs` rules) and match that domain vocabulary in test names.
- Confirm the public interface and which behaviours matter — you can't test everything, so focus on critical paths and the validation contract, not every edge case.
- List the **behaviours** to test (not implementation steps) and get the user's approval.

### 3. Tracer bullet

Write ONE test for the first behaviour and watch it go **red**, then write the minimal code to turn it **green**. This proves the path end-to-end.

### 4. Incremental loop

For each remaining behaviour: red (next test fails) → green (minimal code passes). One test at a time; only enough code to pass the current test; don't anticipate the next one. Re-run scoped to the file you're driving, with verbose output, to read exactly which assertion fails:

```
npm test -- <test-file> --reporter=verbose
```

Everything after `--` is forwarded to Vitest, so the `<test-file>` filter scopes the run to the slice you're on. Use the inner loop's `npm test` (which runs **without** coverage), not `npm run test:coverage`: a single-file run only covers a few percent of the suite, so running it under the global coverage threshold would exit non-zero **even when your tests pass** — making a real red indistinguishable from a coverage-threshold red. The coverage gate belongs to the whole-net run in step 5.

Adjust the **implementation, never the test**. A pre-existing test going red is a regression — fix it before continuing. Never weaken a test to make it pass; if a test is genuinely wrong, change the specification explicitly and rewrite it from scratch.

### 5. Refactor — only while green

Once every test passes, look for [refactor candidates](refactoring.md): extract duplication, deepen shallow modules, move logic to where the data lives. Run the suite after each step. **Never refactor while red** — get to green first.

Then verify the whole net is green before calling it done — this is where the coverage threshold (`vitest.config.ts`, `GEN-005`) is meant to gate, so run the full suite **with** coverage:

```
npm run test:coverage
npm run archgate
```

A unit with two passing tests and one failing test is not done.

## Checklist per cycle

```
[ ] Test describes behaviour, not implementation
[ ] Test goes through the public interface only
[ ] Test would survive an internal refactor
[ ] Validation / error-handling behaviour covered, not just the happy path
[ ] Confirmed red before implementing
[ ] Code is minimal for this test; nothing speculative added
```
