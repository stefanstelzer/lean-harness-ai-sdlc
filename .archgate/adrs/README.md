# Architecture Decision Records (ADRs)

This directory is the single source of truth for the architectural and process
decisions that govern this repository. Each ADR is a short Markdown file; most
ADRs ship with an executable archgate rule that turns the decision into an
automated fitness function.

ADRs are loaded by the workspace rules in `.agents/rules/` (routed by `domain`)
and enforced by `archgate` (run via `npx -y archgate check` or
`node scripts/archgate-ci.mjs`).

## File layout

```text
.archgate/adrs/
  <ID>-<slug>.md         # the decision (required)
  <ID>-<slug>.rules.ts   # the executable archgate rule(s) (optional)
  README.md              # this file
```

- `<ID>` is the domain prefix + number: `ARCH-NNN` (architecture) or
  `GEN-NNN` (general / cross-cutting tooling and process).
- `<slug>` is a short kebab-case summary of the title.
- If an ADR has `rules: true` in its frontmatter, it MUST have a matching
  `.rules.ts`. If `rules: false`, it has no rule file (enforcement is a skill, a
  workflow, or human discipline — say which in the Decision section).

## Frontmatter

Every ADR starts with YAML frontmatter:

```yaml
---
id: GEN-008
title: Short imperative title
status: accepted        # proposed | accepted | superseded
domain: general         # general | architecture
rules: true             # true if a <ID>-<slug>.rules.ts exists
---
```

## Body sections

Keep the same section order across all ADRs:

1. `# <Title>` (matches frontmatter title)
2. `## Context` — the forces and the problem.
3. `## Decision` — what was decided, stated as binding invariants.
4. `## Do's and Don'ts` — `### Do` and `### Don't` bullet lists.
5. `## Consequences` — `### Positive`, `### Negative`, `### Risks`.

Write in English (enforced repo-wide). Be concrete: name the file, the flag, the
script, the command.

## Writing the rule (`<ID>-<slug>.rules.ts`)

Rules are TypeScript modules type-checked against `../rules.d.ts`. Start every
rule file with the triple-slash reference and export a default `RuleSet`:

```ts
/// <reference path="../rules.d.ts" />

export default {
  rules: {
    "gen008/some-invariant": {
      description: "One line describing what this rule checks",
      severity: "error", // "error" | "warning" | "info"
      async check(ctx) {
        // ctx.glob(pattern), ctx.grep(file, re), ctx.grepFiles(re, glob),
        // ctx.readFile(path), ctx.readJSON("package.json")
        // report with ctx.report.violation / .warning / .info
        const files = await ctx.glob("src/**/*.ts");
        if (files.length === 0) {
          ctx.report.violation({
            message: "…",
            file: "src/",
            fix: "…",
          });
        }
      },
    },
  },
} satisfies RuleSet;
```

Rule-id convention: `"<id-lowercased>/<short-key>"`, e.g. `"gen003/tsconfig-strict"`.

Choose severity deliberately: `error` blocks the gate; `warning`/`info` nudge
without failing CI. Author rules so they PASS on the current tree — a rule that is
red the day it lands trains the team to ignore the gate.

## Index

| ID | Title | Domain | Rules |
| --- | --- | --- | --- |
| ARCH-001 | Layered source architecture with a one-way dependency direction | architecture | yes |
| GEN-001 | Conventional Commits across every flow | general | yes |
| GEN-002 | End-to-end tests exist and run in CI | general | yes |
| GEN-003 | TypeScript strict mode | general | yes |
| GEN-004 | TDD discipline — red, green, refactor | general | yes |
| GEN-005 | Vitest as the unit-test runner | general | yes |
| GEN-006 | Every PR and every plan-file phase requires a Manual Test Plan | general | no |
| GEN-007 | Versioning and release from Conventional Commits | general | yes |

## ADR template

Copy this into `<ID>-<slug>.md` to start a new ADR:

```markdown
---
id: GEN-00X
title: <imperative title>
status: accepted
domain: general
rules: false
---

# <imperative title>

## Context

<the forces and the problem this decision addresses>

## Decision

<what was decided, as binding invariants>

## Do's and Don'ts

### Do
- <do this>

### Don't
- <not that>

## Consequences

### Positive
- <upside>

### Negative
- <cost>

### Risks
- <what could still go wrong, and the mitigation>
```
