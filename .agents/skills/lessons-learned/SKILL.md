---
name: lessons-learned
description: Captures learnings from development sessions and codifies them into ADRs or project memory. Use after coding and validation are complete — this is the final step in the development workflow.
allowed-tools: Read, Glob, Grep, Skill, Edit, Write, Bash(git:*), Bash(archgate:*)
user-invocable: true
---

# Lessons Learned Skill

Captures learnings and patterns from coding sessions and codifies them into the project's governance base (ADRs and project memory) so they carry forward across all future sessions and agents.

## Purpose

- **Capture session learnings** — Identify patterns, mistakes, workarounds, and improvements discovered during coding
- **Standardize decisions** — Turn recurring patterns into documented ADRs so they are enforced consistently
- **Extend existing ADRs** — Add new do's/don'ts, examples, or clarifications to existing ADRs
- **Create new ADRs** — When a learning covers a distinct topic not well-scoped by any existing ADR
- **Update project memory** — Record operational knowledge in the project's agent instruction file for quick access

## When to Use This Skill

This skill is the **LAST step** in the development workflow:

```
UNDERSTAND → PLAN → WRITE → VALIDATE → CAPTURE (lessons-learned)
```

Invoke this skill:

1. **After validation passes** — Once `archgate check` and the reviewer skill confirm ADR compliance
2. **When the user explicitly asks** to "capture learnings", "update quality", "register patterns", or similar
3. **After resolving a non-trivial issue** — When the fix revealed something that should be documented
4. **After a session with repeated mistakes** — To prevent the same mistakes in future sessions

## Knowledge Capture Workflow

### Step 1: Gather Session Context

Conversation context gets compacted over long sessions — earlier tool calls, errors, and decisions may be lost. Use the `archgate session-context` CLI command to read the complete session transcript from disk.

**Important:** This skill may run as a sub-agent, which creates its own session. Use `--skip 1` to bypass the sub-agent's session and read the **parent** session that contains the actual development context.

#### Procedure

1. Run `archgate session-context --skip 1` via the Bash tool (optionally with `--max-entries <n>` to control size) — the session transcript preserves the full development context (user requests, errors, code changes) that gets compacted in long conversations. This returns the filtered transcript as JSON: only `user` and `assistant` entries, with content previews.

2. Review the transcript for: user requests, code changes, errors encountered, patterns observed, ADR interactions, and governance gaps.

3. **Fallback:** If the command returns an error (no session files found, or only one session available), ask the user targeted questions:
   - "What was the most surprising or time-consuming issue you encountered?"
   - "Were there any mistakes that an ADR could have prevented?"
   - "Did you discover any patterns that should be standardized?"

### Step 2: Review Current Governance Landscape

Run `archgate review-context --run-checks` via the Bash tool to get the current governance landscape in a single call (JSON output):

- **`domains`** — Which domains were affected, with applicable ADR briefings (Decision + Do's/Don'ts)
- **`checkSummary`** — Current automated check results

This replaces the need to manually call `archgate check` + `archgate adr list` + read individual ADRs.

### Step 3: Classify Learnings

For each learning identified, classify it into one of these categories:

- **Architecture** — module boundaries, layering, seams, public contracts (governed by `ARCH-*` ADRs, the `architecture-adrs` rules)
- **General / Process** — conventions, testing discipline, commit and release process, language (governed by `GEN-*` ADRs, the `general-adrs` rules)
- **Operational** — command quirks, environment setup, tooling paths — quick-reference knowledge, not a formal architectural decision
- **No governance impact** — session-specific and not repeatable

### Step 4: Decide — Extend Existing ADR or Create New?

**Extend an existing ADR when:**

- The learning adds a new do/don't to an existing topic
- The learning provides a new code example for an existing pattern
- The learning clarifies an ambiguous part of an existing ADR

**Create a new ADR when:**

- The learning covers a distinct topic not scoped by any existing ADR
- Adding to an existing ADR would make it unfocused or bloated (>200 lines)
- The pattern has been observed in 3+ places across the codebase

**Update project memory (agent instruction file) when:**

- The learning is operational (command quirks, environment setup, API paths)
- The learning is a quick reference tip, not a formal architectural decision

**Take no action when:**

- The learning is already documented in an existing ADR
- The learning is session-specific and not repeatable
- The change was trivial with no governance implications

### Step 5: Write the Learnings

#### For Existing ADR Updates

**CRITICAL: Do NOT edit ADR files directly.** Instead, invoke the **`adr-author` skill** via the Skill tool in Edit Mode. The `adr-author` skill is the authoritative ADR authoring layer — it ensures every ADR edit meets quality standards.

#### For New ADR Creation

**CRITICAL: Do NOT create ADR files directly.** Instead, invoke the **`adr-author` skill** via the Skill tool in Create Mode.

#### For Project Memory Updates

The project's durable, agent-agnostic memory lives in `AGENTS.md` (loaded at session start) and the harness memory under `.claude/agent-memory/`. Pick the right home:

1. Read the current file
2. Add the learning under the appropriate section
3. Keep entries concise — project memory is loaded into every session's context

### Step 6: Generate Summary Report

```markdown
## Lessons Learned Report

### Session Summary

<Brief description of the task completed>

### Learnings Captured

**New ADRs Created:**

- **<ADR-ID>** <Title> (domain: <domain>) — <one-line description>

**Existing ADRs Updated:**

- **<ADR-ID>** <Title> — Added: <what was added>

**Project Memory Updated:**

- <file> — Added: <what was added>

### No Action Needed

- <Any learnings that were already documented or not worth capturing>
```

If no learnings were worth capturing, report that clearly — don't force documentation for trivial changes.

## Quality Criteria for Learnings

A good learning must be: **Actionable**, **Repeatable**, **Specific**, and **Non-obvious**.

- **Actionable** — it changes what a future agent does, not merely something it now knows.
- **Repeatable** — it will recur across sessions, not a one-off accident.
- **Specific** — it names the exact pattern, command, file, or contract; never vague guidance.
- **Non-obvious** — it is not already the model's default behaviour (an instruction the agent would follow anyway earns nothing).

## Scope

This skill's scope is knowledge capture: identifying patterns, proposing ADRs, and updating project memory. Implementation, testing, and architectural decisions belong to other agents and skills.

## Rules

- Be conservative — only propose ADRs for **clear, repeated patterns** with concrete code evidence
- Every proposal must be justified by observed code evidence
- Prefer updating existing ADRs over creating overlapping ones
- Always check the `archgate review-context` output for existing ADR coverage before creating new ADRs
- If a learning contradicts an existing ADR, do not modify it — flag for human review
