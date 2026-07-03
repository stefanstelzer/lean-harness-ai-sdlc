# Enforcement coverage

Two layers enforce the ADRs in [`.archgate/adrs/`](../.archgate/adrs/), and they
share one source of truth — the ADR `.md` files:

- **Soft (authoring time).** The `*-adrs` router rules in `.agents/rules/` load the
  matching ADRs at runtime; an agent about to break a `Decision` or a Do/Don't
  refuses and cites the ADR. Broad, but probabilistic — it depends on the rules
  being loaded and the agent following them.
- **Hard (push & CI).** archgate runs each ADR's paired `<id>.rules.ts`, and the
  surrounding toolchain (`tsc`, Vitest, commitlint, ESLint, Trivy, the
  symlink/plugin checks) runs in the pre-push hook and CI behind the required
  `Verify` check. Narrow, but unconditional.

This page is the map between them. **"archgate green" means the structural checks
below passed — not that an ADR's full intent is satisfied.** Use it to see which
clauses are mechanically blocking and which rest on the soft layer plus human
review.

Severity: an archgate `error` blocks the push/merge; a `warning` is surfaced but
does not block.

| ADR | Hard / blocking | Soft / advisory only |
| --- | --- | --- |
| **ARCH-001** layering | archgate `arch001/index-only-reexports`, `…/types-is-lowest-layer`, `…/no-imports-from-tests`, `…/no-src-escape` (all `error`); `tsc` typechecks the boundaries | "review the public surface for an accidental wide export"; the deep-module intent |
| **GEN-001** commits | **commitlint** at the `commit-msg` hook rejects non-conforming messages; archgate `gen001/commitlint-config-present` (`error`) + `…/commit-msg-hook-present` (`warning`) check the machinery is wired | message quality; squash-merge subject discipline. The hook is **local and not re-checked in CI** (bypassable with `--no-verify`) |
| **GEN-002** e2e | archgate `gen002/e2e-tests-exist` + `…/e2e-script-present` (`error`) — the suite exists and is runnable in one command | the suite is **not run in CI** (by design); that it passes and meaningfully exercises the API is "run on demand / before release" |
| **GEN-003** strict TS | **`tsc --noEmit`** (pre-push + CI build); archgate `gen003/tsconfig-strict` (`error`) pins the flag set; `…/no-ts-ignore` (`warning`) | "no `any` from exported functions", thin wrappers for weak typings — beyond what `tsc` catches |
| **GEN-004** TDD | archgate `gen004/src-module-has-test` (**`warning`**, name-based heuristic) | test-**first** ordering and test meaningfulness cannot be machine-checked — they rest on `/tdd`, `/reviewer`, and review |
| **GEN-005** unit tests | **Vitest** runs unit + smoke (pre-push + CI); the **80% coverage threshold** gates the `--coverage` run; archgate `gen005/vitest-config-present` + `…/unit-tests-exist` (`error`), `…/single-unit-runner` (`warning`) | "meaningful assertions over raw percentage" |
| **GEN-006** Manual Test Plan | archgate `gen006/plans-have-manual-test-plan` + `…/plans-link-upstream-prd` (`error`) for plan files; **CI step `check-pr-body.mjs`** for the PR body | the *quality* of each manual step (concrete, executable) — `/prd-to-plan`, `/pr`, review |
| **GEN-007** versioning | archgate `gen007/changelog-present` + `…/semver-floor-script-present` (`error`); branch protection blocks direct `main` writes; `semver-floor.mjs` makes the bump *level* deterministic | cutting the release is a manual maintainer action; `/decide-semver` may raise (never lower) the floor |
| **GEN-008** generated artefacts | **not archgate** (`rules: false`) — `scripts/check-plugins.sh` (`check:plugins`) + the symlink checks (`check:links`), pre-push + CI | keeping the hand-authored manifests' skill lists in sync (manual, per the ADR's Risks) |

## Cross-cutting hard gates (not per-ADR archgate rules)

- **ESLint** — `npm run lint`, in CI.
- **Trivy** — `scripts/run-trivy.sh`; hard-fail in CI, soft-skip locally if Trivy is
  not installed.
- **Prettier** — `format:check` is available; a `PostToolUse` hook formats `.ts` on
  edit.
- **Symlink invariants** (`check:links`) and **plugin sync** (`check:plugins`) —
  pre-push + CI.

The full gate order is in [`WORKFLOW.md`](../WORKFLOW.md) (§7–§8) and
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

---

_Keep this table in sync when adding or changing an ADR `.rules.ts` or a CI gate._
