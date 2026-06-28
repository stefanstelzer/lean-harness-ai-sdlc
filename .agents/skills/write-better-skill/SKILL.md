---
name: write-better-skill
description: Reference for writing and editing skills well in this repo — the vocabulary and principles that make a skill predictable, plus this repo's skill-authoring conventions (layout, symlink, agent-agnostic, English-only). Use when creating, editing, reviewing, or refactoring a skill under .agents/skills/.
allowed-tools: Read, Glob, Grep, Edit, Write
user-invocable: true
---

A skill exists to wrangle determinism out of a stochastic system. **Predictability** — the agent taking the same _process_ every run, not producing the same output — is the root virtue; every lever below serves it.

**Bold terms** are defined in [`GLOSSARY.md`](GLOSSARY.md); look them up there for the full meaning.

## Authoring skills in this repo

Where a skill lives and how it is wired (the binding rules are `AGENTS.md` › Skills Layout and the root `README.md`):

1. **Source of truth.** Create `.agents/skills/<name>/SKILL.md`. The folder name is the skill's identity; the frontmatter `name` must match it.
2. **Symlink.** Add `.claude/skills/<name>` → `../../.agents/skills/<name>` (`ln -s ../../.agents/skills/<name> .claude/skills/<name>`). `scripts/check-skill-symlinks.sh` enforces this in the pre-push hook and CI — a missing or wrong-target symlink is a hard failure, so commit the real folder _and_ its symlink together.
3. **Frontmatter.** `name`, a model-facing **description**, `allowed-tools` (only the tools the skill actually uses), and `user-invocable: true` for a skill a human invokes by name. Tool-shaped fields (`allowed-tools`) are the only surface a per-tool adapter may translate.
4. **Agent-agnostic.** The body, the **description**, and any bundled **reference** MUST NOT name a vendor, product, or model (no "Claude", "GPT", "Copilot", "Cursor", no model families). Write from the team's perspective — "the agent", "you", or the bare imperative. (`AGENTS.md` › Skill & Rule Authoring.)
5. **English-only.** All prose is English (`gen002/english-only-prose`, enforced in CI). A file that legitimately embeds domain loanwords declares `english-only: ignore` in its frontmatter with a justification.
6. **Disclosure.** Push **reference** into sibling files in the skill folder (this skill discloses its vocabulary to `GLOSSARY.md`) and reach them with a **context pointer**.

This repo's workflow is **human-in-the-loop and non-subagentic** (see `WORKFLOW.md`). When you must hide **post-completion steps** to fight **premature completion**, prefer a **user-invoked** hand-off to a separate skill over a subagent dispatch.

On the shelf as worked examples: `discovery` and `goal` are steps-heavy skills (an ordered process that produces an artefact); `decide-semver` is steps that produce one artefact; `reviewer` is all **reference**.

## Invocation

Two choices, trading different costs:

- A **model-invoked** skill keeps a **description**, so the agent can fire it autonomously _and_ other skills can reach it (you can still type its name too). It contributes to **context load** — the description sits in the window every turn. Mechanics: keep a model-facing description with rich trigger phrasing ("Use when the user wants…, mentions…"), and — per this repo's convention — set `user-invocable: true` so the name is typeable.
- A **user-invoked** skill keeps the **description** human-facing only: a one-line summary with the trigger phrasing stripped, so the agent does not fire it on its own — only you, typing its name, reach it. Near-zero **context load**, but it spends **cognitive load**: _you_ are the index that must remember it exists.

Pick model-invocation only when the agent must reach the skill on its own, or another skill must. If it only ever fires by hand, make it user-invoked and pay no context load.

When user-invoked skills multiply past what you can remember, that piled-up cognitive load is cured by a **router skill**: one user-invoked skill that names the others and when to reach for each.

## Writing the description

A model-invoked **description** does two jobs — state what the skill is, and list the **branches** that should trigger it. Every word increases **context load**, so a description earns even harder pruning than the body:

- **Front-load the skill's leading word** — the description is where it does its invocation work.
- **One trigger per branch.** Synonyms that rename a single branch are **duplication** — "build features using TDD … asks for test-first development" is one branch written twice. Collapse them; keep only genuinely distinct branches.
- **Cut identity that's already in the body.** Keep the description to triggers, plus any "when another skill needs…" reach clause.

## Information hierarchy

A skill is built from two content types — **steps** and **reference** — that mix freely: a skill can be all steps, all reference, or both. The core decision is which to use and where each sits on the **information hierarchy**, a ladder ranked by how immediately the agent needs the material:

1. **In-skill step** — an ordered action in `SKILL.md`, the primary tier: what the agent does, in order. Each step ends on a **completion criterion**, the condition that tells the agent the work is done. Make it _checkable_ (can the agent tell done from not-done?) and, where it matters, _exhaustive_ ("every modified module accounted for", not "produce a change list") — a vague criterion invites **premature completion**.
2. **In-skill reference** — a definition, rule, or fact in `SKILL.md`, consulted on demand. Often a legitimately flat peer-set (every rule of a review on one rung) — a fine arrangement, not a smell.
3. **External reference** — reference pushed out of `SKILL.md` into a separate file, reached by a **context pointer**, loaded only when the pointer fires. (Spans _disclosed_ reference — a sibling file like `GLOSSARY.md`, still part of the skill — through fully **external reference** that lives outside the skill system and any skill can point at.)

A demanding completion criterion drives thorough **legwork** — the digging the agent does within the work — whether the skill has steps or not, since "every rule applied" binds flat reference just as "every step done" binds a sequence.

Push too little down and the top bloats; push too much and you hide material the agent actually needs. That tension is the whole decision.

**Progressive disclosure** is the move down the ladder — out of `SKILL.md` into a linked file — so the top stays legible. Mechanics: a linked `.md` file in the skill folder, named for what it holds (this skill discloses its full definitions to `GLOSSARY.md`). Some skills are used in more than one way, and each distinct way is a **branch** — different runs taking different paths through the skill. Branching is the cleanest disclosure test: inline what every branch needs, and push behind a pointer what only some branches reach. A **context pointer**'s _wording_, not its target, decides when and how reliably the agent reaches the material.

Where the ladder decides _how far down_ a piece sits, **co-location** decides _what sits beside it_ once there: keep a concept's definition, rules, and caveats under one heading rather than scattered, so reading one part brings its neighbours with it.

## When to split

**Granularity** is how finely you divide skills, and each cut spends one of the two loads, so split only when the cut earns it. Two cuts:

- **By invocation** — split off a **model-invoked** skill when you have a distinct **leading word** that should trigger it on its own, or another skill must reach it. You pay **context load** for the new always-loaded **description**, so that independent reach has to be worth it.
- **By sequence** — split a run of **steps** when the steps still ahead (a step's **post-completion steps**) tempt the agent to rush the one in front of it (**premature completion**). Keeping them out of view encourages the agent to do more **legwork** on the current task. In this repo, make that hand-off a **user-invoked** skill rather than a subagent dispatch.

## Pruning

Keep each meaning in a **single source of truth**: one authoritative place, so changing the behaviour is a one-place edit.

Check every line for **relevance**: does it still bear on what the skill does?

Then hunt **no-ops** sentence by sentence, not just line by line: run the no-op test on each sentence in isolation, and when one fails, delete the whole sentence rather than trim words from it. Be aggressive — most prose that fails should go, not be rewritten.

## Leading words

A **leading word** is a compact concept already living in the model's pretraining that the agent thinks with while running the skill (e.g. _lesson_, _fog of war_, _tracer bullets_). Repeated throughout the text (though not necessarily — a strong leading word might only be needed once), it accumulates a distributed definition and anchors a whole region of behaviour in the fewest tokens, by recruiting priors the model already holds.

It serves predictability twice. In the body it anchors _execution_: the agent reaches for the same behaviour every time the word appears. In the description it anchors _invocation_: when the same word lives in your prompts, docs, and code, the agent links that shared language to the skill and fires it more reliably.

Hunt for opportunities to refactor skills to use leading words. A triad spelled out at three sites (**duplication**), a description spending a sentence to gesture at one idea — each is a passage begging to **collapse** into a single token. Examples include:

- "fast, deterministic, low-overhead" → _tight_ — one quality restated across a phase — into a single pretrained word (a _tight_ loop).
- "a loop you believe in" → _red_ — converts a fuzzy gate into a binary observable state (the loop goes _red_ on the bug, or it doesn't).

You win twice over: fewer tokens, _and_ a sharper hook for the agent to hang its thinking on. Assume every skill is carrying restatements that leading words retire — go find them.

## Failure modes

Use these to diagnose issues the user may be having with the skill.

- **Premature completion** — ending a step before it's genuinely done, attention slipping to _being done_. Defence, in order: sharpen the completion criterion first (cheap, local); only if it is irreducibly fuzzy _and_ you observe the rush, hide the post-completion steps by splitting (the sequence cut).
- **Duplication** — the same meaning in more than one place. Costs maintenance and tokens, and inflates a meaning's prominence on the ladder past its real rank.
- **Sediment** — stale layers that settle because adding feels safe and removing feels risky. The default fate of any skill without a pruning discipline.
- **Sprawl** — a skill simply too long, even when every line is live and unique. Hurts readability and maintainability and wastes tokens. The cure is the ladder: disclose **reference** behind pointers, and split by **branch** or sequence so each path carries only what it needs.
- **No-op** — a line the model already obeys by default, so you pay load to say nothing. The test: does it change behaviour versus the default? A weak leading word (_be thorough_ when the agent is already thorough-ish) is a no-op; the fix is a stronger word (_relentless_), not a different technique.
