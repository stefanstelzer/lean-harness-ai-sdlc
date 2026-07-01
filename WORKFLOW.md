# Development Workflow

This document describes the recommended **human-in-the-loop (HITL),
non-subagentic** workflow for delivering changes in this repository. A human
drives and reviews every stage; skills assist, but no autonomous subagent owns a
stage end-to-end.

There are three entry points — **Feature**, **Bug**, and **Change-Request** —
that all converge on the same delivery **spine**:

```
Agent → Artefact → Commit ┃ Hooks → Push → PR
```

The `┃` marks the **local/remote boundary**: everything up to and including
Commit happens on the developer's machine; from the pre-push hook onward the work
crosses into shared CI. Two iteration loops keep the work honest:

- **Inner loop** `Agent ⇄ Artefact ⇄ Commit` — implement, test, refine until the
  slice is green.
- **Outer loop** `PR → Agent` — review feedback re-enters implementation.

## Overview

```mermaid
flowchart LR
  classDef front fill:#e3f2fd,stroke:#1976d2,color:#0d47a1;
  classDef bug fill:#ffebee,stroke:#e53935,color:#b71c1c;
  classDef chg fill:#fffde7,stroke:#f9a825,color:#f57f17;
  classDef spine fill:#e8f5e9,stroke:#43a047,color:#1b5e20;
  classDef gate fill:#fff3e0,stroke:#fb8c00,color:#e65100;
  classDef rel fill:#fce4ec,stroke:#d81b60,color:#880e4f;

  subgraph FE["🟦 Feature front"]
    direction TB
    d1["Discovery<br/>/discovery"] --> d2["PRD<br/>/grill-me-with-context"]
    d2 --> d3["Plan<br/>/prd-to-plan"]
  end
  subgraph BG["🟥 Bug front"]
    direction TB
    b1["Bug<br/>/bug-analysis"] --> b2["Prompt<br/>/goal"]
  end
  subgraph CR["🟨 Change-Request front"]
    direction TB
    c1["Requirement"] --> c2["Prompt<br/>/goal"]
  end

  d3 --> A
  b2 --> A
  c2 --> A

  subgraph SPINE["🟩 Shared delivery spine"]
    direction LR
    A["Agent<br/>/tdd"] --> AR["Artefact<br/>refactor"]
    AR --> CO["Commit<br/>/reviewer · /lessons-learned · /pr"]
    CO -.->|"local ┃ remote"| HK["Hooks<br/>pre-push"]
    HK --> PU["Push<br/>ci.yml"]
    PU --> PR["PR<br/>ci.yml · review"]
  end

  A -.->|"inner loop"| AR
  AR -.->|"inner loop"| A
  PR -.->|"outer rework loop"| A
  PR ==>|"approved"| MG(["merged to main"])

  class d1,d2,d3 front;
  class b1,b2 bug;
  class c1,c2 chg;
  class A,AR,CO spine;
  class HK,PU,PR gate;
  class MG spine;
```

> The same diagram as a presentation deck lives in
> [`docs/assets/ai_sdlc.pdf`](docs/assets/ai_sdlc.pdf); rendered per-flow boards
> are in [`docs/assets/`](docs/assets/) (`flow-feature.png`, `flow-bug.png`,
> `flow-change-request.png`). This document is authoritative.

## The lanes

Every phase is described across the same lanes:

| Lane          | Meaning                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| **Phase**     | The step in the flow (left → right).                                   |
| **Skills**    | The skill that assists the phase (`.agents/skills/<name>/`, run as `/<name>`). |
| **Key ADRs**  | Binding constraints — the ADRs in `.archgate/adrs/`, routed via `.agents/rules/*-adrs.md`. |
| **Documents** | Project docs that inform or are updated in the phase.                  |
| **Tests**     | The automated tests that run.                                         |
| **Pipeline**  | The CI/hook stage that gates the phase.                                |
| **Git**       | The git action (branch, pre-push, push).                              |

> **Hard vs. soft enforcement.** The Key-ADRs column lists the constraints that
> bind each phase, but not every ADR clause is machine-checked. archgate and the CI
> gates verify structure and presence; the rest rests on the soft `*-adrs` routing
> plus human review. See [`docs/enforcement-coverage.md`](docs/enforcement-coverage.md)
> for the per-ADR map of what is hard-enforced vs. prompt-only.

## Feature flow

The Feature flow is the full flow; Bug and Change-Request are documented as
variants below. `/pr` spans **Commit → Hooks → Push → PR** (it commits, pushes,
opens the PR, and drives CI green).

```mermaid
flowchart TD
  classDef front fill:#e3f2fd,stroke:#1976d2,color:#0d47a1;
  classDef build fill:#e8f5e9,stroke:#43a047,color:#1b5e20;
  classDef gate fill:#fff3e0,stroke:#fb8c00,color:#e65100;
  classDef doc fill:#f3e5f5,stroke:#8e24aa,color:#4a148c;
  classDef rel fill:#fce4ec,stroke:#d81b60,color:#880e4f;

  start(["Need identified"]) --> P1

  subgraph FRONT["Frame the work"]
    direction TB
    P1["1 · Discovery<br/>/discovery"] --> P2["2 · PRD<br/>/grill-me-with-context → /adr-author"]
    P2 --> P3["3 · Plan<br/>/prd-to-plan → /grill-me-with-context"]
  end

  P1 -.-> docPRD["📄 prd/PRD-n-slug.md"]
  P3 -.-> docPLN["📄 plans/PLN-n-slug.md"]
  P3 -->|"open feat/ branch · spec = first commit"| P4

  subgraph BUILD["Build · inner loop  (red → green → refactor)"]
    direction LR
    P4["4 · Agent<br/>/tdd · red → green"] <-->|"refine"| P5["5 · Artefact<br/>refactor while green"]
  end
  P5 --> P6["6 · Commit<br/>/reviewer → /lessons-learned → /pr"]

  P6 -.->|"local ┃ remote"| G7{{"7 · Hooks · pre-push<br/>symlinks · archgate · trivy · tests"}}
  G7 -->|"fail"| P4
  G7 -->|"pass"| G8{{"8 · Push · ci.yml<br/>lint · check:links · archgate:ci · build · test"}}
  G8 --> P9["9 · PR<br/>/pr · ci.yml · human review"]
  P9 -->|"changes requested"| P4
  P9 ==>|"approved · merge to main"| MG(["merged to main"])

  class P1,P2,P3 front;
  class P4,P5 build;
  class G7,G8 gate;
  class docPRD,docPLN doc;
  class MG build;
```

| #   | Phase     | Skills                                                  | Key ADRs                                  | Documents                          | Tests                          | Pipeline                  | Git                                  |
| --- | --------- | ------------------------------------------------------ | ----------------------------------------- | ---------------------------------- | ------------------------------ | ------------------------- | ------------------------------------ |
| 1   | Discovery | `/discovery`                                           | `*-adrs` (read); English-only             | writes `prd/PRD-<n>-<slug>.md`     | —                              | —                         | —                                    |
| 2   | PRD       | `/grill-me-with-context` → `/adr-author`               | all `*-adrs`                              | `AGENTS.md`, `WORKFLOW.md`, `README.md` | —                          | —                         | —                                    |
| 3   | Plan      | `/prd-to-plan`, then `/grill-me-with-context`          | `*-adrs`; `GEN-006` per phase             | writes `plans/PLN-<n>-<slug>.md`   | —                              | —                         | —                                    |
| 4   | Agent     | `/tdd` (red → green)                                    | `GEN-004`, `GEN-005`, `GEN-003`, `ARCH-001` | PRD + plan                        | **Unit** (`tests/unit/`)       | —                         | opens `feat/<slug>`; **spec = first commit** |
| 5   | Artefact  | `/tdd` (refactor while green)                           | `ARCH-001`, area ADRs                      | updated docs                       | Unit                           | —                         | —                                    |
| 6   | Commit    | `/reviewer` → `/lessons-learned` → `/pr` (commit)      | archgate = all ADRs; `GEN-001`            | ADRs / agent-memory                | Unit                           | local archgate            | Conventional-Commits commit          |
| 7   | Hooks     | `/pr` (push fires the hook)                             | symlink invariants, archgate, `GEN-005`   | —                                  | Unit · Smoke                   | `.husky/pre-push`         | pre-push gate                        |
| 8   | Push      | `/pr`                                                   | `GEN-005`                                  | —                                  | Unit · Smoke (`tests/smoke/`)  | `ci.yml`                  | branch pushed                        |
| 9   | PR        | `/pr` + human review                                    | `AGENTS.md` PR Descriptions, `GEN-006`     | PR body (Summary/Commits/Manual Test Plan) | — (e2e run on demand, `GEN-002`) | `ci.yml`                | PR opened, merged on green           |

Support skills outside the loop: `/write-better-skill` (when authoring skills),
`/adr-author` (invoked by `/grill-me-with-context` to write decisions back as
ADRs), and `/decide-semver` (a manual release helper, see Versioning).

### 1. Discovery

- **Goal:** Frame the problem and gather requirements before any solution shape.
- **Human:** Requirements engineering — clarify the need, scope, and constraints.
- **Skill:** `/discovery` — explores the problem space, finds test seams, and
  writes a PRD to `prd/PRD-<n>-<slug>.md`.
- **Done when:** The problem, scope, and success criteria are written down and
  agreed.

### 2. PRD

- **Goal:** Turn discovery into a Product Requirements Document.
- **Skill:** `/grill-me-with-context` — adversarially pressure-test the PRD
  against the codebase and the ADRs; invoke `/adr-author` to record any
  architectural decision back as an ADR before acceptance.
- **Documents:** `AGENTS.md`, `WORKFLOW.md`, `README.md` are the context the PRD
  must stay consistent with.
- **Done when:** The PRD survives the grilling and the human approves it.

### 3. Plan

- **Goal:** Derive an executable implementation plan from the approved PRD.
- **Skills:** `/prd-to-plan` (generate the plan into `plans/PLN-<n>-<slug>.md`),
  then `/grill-me-with-context` (pressure-test it).
- **Done when:** The plan is reviewed, grilled, and approved.

### 4. Agent (implement)

- **Goal:** Implement the plan on a feature branch.
- **Skill:** `/tdd` — write the failing test first, then minimal implementation
  (red → green), in vertical slices.
- **Tests:** **Unit tests** run continuously while implementing (`npm run test:unit`).
- **Git:** `/tdd` **opens the feature branch off `main`** and lands the PRD +
  plan as its **first commit** before any production code (never commit to `main`
  — see `AGENTS.md` › Branch Policy).
- **Loop:** Iterates with **Artefact** and **Commit** until the slice is green.

### 5. Artefact

- **Goal:** The concrete output — code, tests, and any updated docs.
- **Human:** **Refactoring** — tidy the artefact for clarity and reuse (while the
  suite stays green) before it is committed.
- **Loop:** Feeds back into **Agent** as needed.

### 6. Commit

- **Goal:** Record a coherent, reviewed change locally.
- **Skills (in order):** `/reviewer` — local [archgate](https://archgate.dev) (the
  external architecture-governance CLI) review of the diff;
  `/lessons-learned` — capture learnings into `.claude/agent-memory/` and/or ADRs;
  **then** `/pr` commits the work (Conventional Commits). `/pr` always runs after
  `/reviewer` and `/lessons-learned`.
- **Boundary:** This is the last local step before the work crosses into CI.
- **Done when:** The diff passes the local reviewer, learnings are captured, and
  the change is committed with a Conventional-Commits message.

### 7. Hooks (pre-push)

- **Goal:** Gate the push locally before it reaches CI.
- **Pipeline / Git:** `/pr`'s push fires the Husky **pre-push** hook
  (`.husky/pre-push`), which runs, in order: skill & rule symlink checks →
  **plugin artefact sync** (`check:plugins`) → **Archgate** compliance
  (`scripts/archgate-ci.mjs`) → **Trivy** security scan → **typecheck**
  (`tsc --noEmit`, `GEN-003` — Vitest/esbuild does not type-check) → **unit + smoke
  tests** (`npm run test:unit && npm run test:smoke`, mirroring CI — e2e is run on
  demand, not gated here, per `GEN-002`). It aborts on the first failure.
- **Done when:** Every pre-push gate is green; otherwise the push is aborted.

### 8. Push

- **Goal:** Publish the branch and run the shared pipeline.
- **Skill:** `/pr` pushes the branch.
- **Pipeline:** **CI pipeline** ([`ci.yml`](.github/workflows/ci.yml)) — the single
  workflow, triggered on push and pull_request:
  install → lint → check:links → check:plugins → archgate:ci → trivy → build → test.
- **Tests:** Unit + smoke suites under Vitest (e2e is run on demand, not in CI —
  see `GEN-002`).
- **Done when:** The CI pipeline is green.

### 9. PR

- **Goal:** Get the change reviewed and merged.
- **Skill:** `/pr` — opens the PR (`AGENTS.md` › PR Descriptions) and watches the
  run, fixing **root causes** until every required check is green. It invokes
  `/lessons-learned` along the way.
- **Human:** **Review** — the human reviews the PR; feedback loops back to
  **Agent** (outer rework loop).
- **Pipeline:** **CI pipeline** ([`ci.yml`](.github/workflows/ci.yml)) — the same
  single workflow that ran on push produces the required `Verify` check on the PR.
  The **e2e** suite (`tests/e2e/`, `GEN-002`) is **not** run in CI; run it on
  demand (`npm run test:e2e`).
- **Constraints:** The PR body MUST follow `AGENTS.md` › PR Descriptions and the
  `GEN-006` Manual Test Plan rule.
- **Done when:** Reviewed, all required checks green, and merged. Cutting a version
  afterwards is a manual step (see Versioning).

## Variants

The Bug and Change-Request flows reuse the **same delivery spine** as the Feature
flow — from **Agent** onward they are identical to §4–§9 (implement with `/tdd`
on a branch, refine the artefact, commit behind `/reviewer` + `/lessons-learned`,
then pre-push hook → push pipeline → PR review). They differ only in the **front
phases**: instead of Feature's `Discovery → PRD → Plan`, each has a lighter
intake followed by a single **Prompt** phase, the right shape for work that does
not need a full PRD and plan.

### Bug

```mermaid
flowchart LR
  classDef bug fill:#ffebee,stroke:#e53935,color:#b71c1c;
  classDef gate fill:#fff3e0,stroke:#fb8c00,color:#e65100;
  classDef rel fill:#fce4ec,stroke:#d81b60,color:#880e4f;

  defect(["🐞 Defect"]) --> B1["B1 · Bug<br/>/bug-analysis<br/>repro + failing test"]
  B1 --> B2["B2 · Prompt<br/>/goal"]
  B2 --> B3["B3 · Agent → PR<br/>/tdd → /reviewer → /lessons-learned → /pr"]
  B3 -.->|"recurse"| B1
  B3 --> SPINE{{"Hooks → Push → PR<br/>shared spine §4–§9"}}
  SPINE -.->|"PR rework"| B3
  SPINE ==>|"approved"| MG(["merged to main"])

  class B1,B2,B3 bug;
  class SPINE gate;
  class MG gate;
```

| #   | Phase      | Skills                                                | Key ADRs                                            |
| --- | ---------- | ----------------------------------------------------- | --------------------------------------------------- |
| B1  | Bug        | `/bug-analysis`                                       | `*-adrs` (read)                                     |
| B2  | Prompt     | `/goal`                                               | `*-adrs`                                            |
| B3  | Agent → PR | `/tdd` → `/reviewer` + `/lessons-learned` → `/pr`     | same as Feature §4–§9 (`GEN-004`, `GEN-005`, `GEN-006`, Branch Policy, PR Descriptions) |

- **B1. Bug** — Reproduce and understand the defect before touching code.
  `/bug-analysis` confirms the symptom, isolates the trigger, finds the root
  cause, and captures a **failing test** that drives the fix in B3.
- **B2. Prompt** — Turn the analysis into a precise, scoped fix prompt with
  `/goal`, framing the fix tightly so it addresses the root cause without scope
  creep.
- **B3. Agent → PR** — Identical to the Feature delivery spine (§4 Agent → §9 PR):
  make the failing test pass with `/tdd`, refine, commit behind `/reviewer`, then
  pre-push → push → PR (with the `GEN-006` Manual Test Plan). The `PR → Agent`
  rework loop applies.

### Change-Request

```mermaid
flowchart LR
  classDef chg fill:#fffde7,stroke:#f9a825,color:#f57f17;
  classDef gate fill:#fff3e0,stroke:#fb8c00,color:#e65100;
  classDef rel fill:#fce4ec,stroke:#d81b60,color:#880e4f;

  req(["📝 Requirement"]) --> C1["C1 · Requirement<br/>human intake"]
  C1 --> C2["C2 · Prompt<br/>/goal"]
  C2 --> C3["C3 · Agent → PR<br/>/tdd → /reviewer → /lessons-learned → /pr"]
  C3 -.->|"recurse"| C2
  C3 --> SPINE{{"Hooks → Push → PR<br/>shared spine §4–§9"}}
  SPINE -.->|"PR rework"| C3
  SPINE ==>|"approved"| MG(["merged to main"])

  class C1,C2,C3 chg;
  class SPINE gate;
  class MG gate;
```

| #   | Phase       | Skills                                              | Key ADRs                  |
| --- | ----------- | -------------------------------------------------- | ------------------------- |
| C1  | Requirement | _(human intake — no skill)_                        | `*-adrs` (read)           |
| C2  | Prompt      | `/goal`                                            | `*-adrs`                  |
| C3  | Agent → PR  | `/tdd` → `/reviewer` + `/lessons-learned` → `/pr`  | same as Feature §4–§9     |

- **C1. Requirement** — Capture the requested change to existing behavior:
  clarify what should change, the acceptance criteria, and the blast radius.
- **C2. Prompt** — Turn the requirement into a precise, scoped implementation
  prompt with `/goal`.
- **C3. Agent → PR** — Identical to the Feature delivery spine (§4 Agent → §9 PR).

The Bug and Change-Request fronts differ only in intake: Bug starts from a defect
(**investigation** + `/bug-analysis`) to diagnose *existing, unintended*
behavior; Change-Request starts from a **requirement** to specify *new or changed
intended* behavior. Both funnel through the single **Prompt** phase (`/goal`) and
join the shared spine at **Agent**.

## Versioning & release

Releases are cut **manually** — there is no release pipeline. When it is time to
ship, a maintainer decides the bump in two layers, then lands it through the
normal branch → PR → merge flow:

1. A **deterministic Conventional-Commits floor** (`scripts/semver-floor.mjs`):
   `fix:` → patch, `feat:` → minor, `<type>!:` / `BREAKING CHANGE` → major.
2. An **optional agent refinement** — run `/decide-semver`, which reads the actual
   diff and may **raise** the bump (never lower it); take `max(floor, agent)`.
   Skip it and the deterministic floor stands alone.

Then bump `package.json`, update `CHANGELOG.md`, open the change as a PR like any
other, and tag `vX.Y.Z` on the merged commit. **No machine commits to `main`**
(see `AGENTS.md` › Branch Policy and `GEN-007`).

```mermaid
flowchart TD
  classDef rel fill:#fce4ec,stroke:#d81b60,color:#880e4f;
  classDef gate fill:#fff3e0,stroke:#fb8c00,color:#e65100;

  start(["time to release"]) --> floor["Layer 1 · floor<br/>semver-floor.mjs --print<br/>fix→patch · feat→minor · !→major"]
  floor --> agent{"run /decide-semver?"}
  agent -->|"yes · may only RAISE"| mx["level = max(floor, agent)"]
  agent -->|"no"| usefloor["level = floor"]
  mx --> bump["--apply level<br/>bump package.json + CHANGELOG.md"]
  usefloor --> bump
  bump --> pr["open PR → review → merge"]
  pr --> tag["tag vX.Y.Z on the merged commit"]

  class floor,mx,usefloor,bump,pr,tag rel;
  class agent gate;
```
