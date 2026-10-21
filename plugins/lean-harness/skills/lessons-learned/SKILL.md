---
name: lessons-learned
description: Captures learnings from a development session and codifies them into ADRs or project memory. Use after coding and validation are complete — the final step of the delivery flow before committing.
allowed-tools: Read, Glob, Grep, Skill, Edit, Write, Bash(git:*), Bash(archgate:*)
---
# Lessons Learned Skill

Capture learnings and patterns from the session and codify them into the project's
governance base (ADRs and project memory) so they carry forward to future sessions and to
every agent on the team. This repo is human-in-the-loop and **non-subagentic** — run in this
context; do not spawn sub-agents.

## When to use

The **last step** of the delivery flow, after the change is validated:

```
UNDERSTAND → PLAN → WRITE → VALIDATE → CAPTURE (lessons-learned)
```

Invoke it after validation passes (`archgate check` and `/reviewer` are green), when the user
asks to "capture learnings", after resolving a non-trivial issue that revealed something
worth documenting, or after a session with repeated mistakes.

## Step 1: Recall the session context

You ran in this session, so the development context — the user's requests, the errors hit,
the decisions made — is in your conversation. Use it directly. Long sessions get compacted,
so if earlier detail is missing you can read the transcript from disk:

- `archgate session-context <editor>` reads this project's transcript for a supported agent
  tool (run `archgate session-context --help` to see which editors are supported, and pick
  the one matching your tool). It runs in the **current** session — do not skip entries.
- If no transcript is available for your tool, rely on the in-context conversation and ask
  the user targeted questions via `AskUserQuestion`:
  - "What was the most surprising or time-consuming issue you encountered?"
  - "Were there any mistakes that an ADR could have prevented?"
  - "Did you discover any pattern that should be standardised?"

## Step 2: Review the governance landscape

Run `archgate review-context --run-checks` for the current state in one call (JSON):

- **`domains`** — which domains the change touched, with applicable ADR briefings.
- **`checkSummary`** — current automated check results.

This replaces calling `archgate check` + `archgate adr list` + reading ADRs by hand.

## Step 3: Classify each learning

- **Architecture** — module boundaries, layering, seams, public contracts (governed by
  `ARCH-*` ADRs, the `architecture-adrs` rule).
- **General / Process** — conventions, testing discipline, commit and release process,
  language (governed by `GEN-*` ADRs, the `general-adrs` rule).
- **Operational** — command quirks, environment setup, tooling paths — quick-reference
  knowledge, not a formal architectural decision.
- **No governance impact** — session-specific and not repeatable.

## Step 4: Extend an existing ADR, create a new one, or record memory

**Extend an existing ADR** when the learning adds a do/don't, a code example, or clarifies an
ambiguity in an existing topic.

**Create a new ADR** when the learning is a distinct topic no ADR scopes, when extending
would bloat an ADR (>200 lines), or when the pattern recurs in 3+ places.

**Update project memory** when the learning is operational (command quirks, environment,
paths) rather than a formal architectural decision.

**Take no action** when it's already documented, session-specific and not repeatable, or a
trivial change with no governance implication.

### Writing ADRs — via `adr-author`

**Do NOT edit ADR files directly.** Invoke the **`adr-author`** skill (Edit Mode to extend, Create Mode for a new ADR). It is the authoritative ADR authoring layer and ensures every ADR meets the project's structure and quality bar.

### Rule enforcement — accompany the ADR with a `.rules.ts`

An ADR without automated enforcement is a wish: agents drift away from it under pressure, and human reviewers must catch every recurrence by hand. Whenever you capture a learning that is checkable, **accompany the ADR with an automated rule**:

- **When to automate:** the constraint is statically checkable or verifiable from file contents (forbidden/required imports, path shapes, literals, naming patterns, config values).
- **When to stay prose-only:** the rule needs cross-file semantic reasoning that a static check cannot do without modelling runtime behaviour. State this explicitly in the ADR's Consequences/Compliance section.
- **Often it is BOTH:** enforce the clear-cut slice with a rule and leave subtle edge cases to human review.

Instruct `adr-author` to author the ADR with `rules: true` and create the companion `.rules.ts` in one invocation. Then validate:
1. Run `archgate check` and confirm the new rule loads and passes on the corrected tree.
2. Confirm the rule is not a no-op: it would have flagged the defect before the fix.
3. Scope precisely: prefer narrow glob patterns to avoid false-positives across unrelated modules.

### Writing operational knowledge

Operational learnings (tooling quirks, build pitfalls, environment traps) should be kept in dedicated reference docs rather than bloating `AGENTS.md`. `AGENTS.md` is loaded into every session context, so general operational traps should be accessed on-demand by symptom. `AGENTS.md` only takes learnings that modify overarching project rules (branch policies, PR requirements, language standards).

## Step 5: Report

```markdown
## Lessons Learned Report

### Session Summary
<one or two lines on what was delivered>

### Learnings Captured
**New ADRs:** <ADR-ID> <title> (domain) — <one line>  (or: none)
**Updated ADRs:** <ADR-ID> — added <what>  (or: none)
**Project memory:** <file> — added <what>  (or: none)

### No Action Needed
<learnings already documented or not worth capturing>
```

If nothing is worth capturing, say so — don't force documentation for trivial changes.

## Quality bar & rules

- A good learning is **Actionable, Repeatable, Specific, Non-obvious.** (GOOD: "Command files
  must not contain business logic." BAD: "Write clean code.")
  - **Actionable** — it changes what a future agent does, not merely something it now knows.
  - **Repeatable** — it will recur across sessions, not a one-off accident.
  - **Specific** — it names the exact pattern, command, file, or contract; never vague.
  - **Non-obvious** — it is not already the model's default behaviour.
- Be conservative — propose ADRs only for clear, repeated patterns backed by code evidence.
- Prefer extending an existing ADR over creating an overlapping one; check the
  `archgate review-context` output for existing coverage first.
- If a learning **contradicts** an existing ADR, do not modify it — flag it for human review.
- This skill captures knowledge only. Implementation, testing, and the architectural decisions
  themselves belong to the other phases.

## Hand-off

Next: commit, push, and open the PR with `/pr` — the final station of the delivery spine.

