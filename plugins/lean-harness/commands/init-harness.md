---
description: Scaffold the full LEAN AI-SDLC harness (skills, rules, archgate ADRs, CI, hooks) into the current repository.
---

# /init-harness

Scaffold the **LEAN / harness-powered AI-SDLC framework** into the current repo.
The plugin you are running ships only the *skills*; this command adds the
*repo-bound machinery* (canonical `.agents/` source, archgate governance, CI,
git hooks) so the workflow in `WORKFLOW.md` actually runs here.

Canonical source: `github.com/stefanstelzer/lean-harness-ai-sdlc`.

Optional extra context from the user: **$ARGUMENTS**

## Do this step by step (confirm with the user before writing files)

1. **Safety check.** Ensure the working tree is clean and the current branch is
   not `main` (create `feat/adopt-harness` if needed). Stop and ask if unsure.

2. **Fetch the harness machinery** into a temp dir (history-free):
   ```bash
   npx -y degit stefanstelzer/lean-harness-ai-sdlc /tmp/lean-harness
   ```

3. **Copy in the machinery** — never overwrite the user's own `src/`, `tests/`,
   or an existing `package.json`:
   - Always: `.agents/`, `.archgate/`, `.husky/`, `AGENTS.md`, `WORKFLOW.md`, `CLAUDE.md`
   - Scripts: `scripts/check-skill-symlinks.sh`, `scripts/check-rule-symlinks.sh`,
     `scripts/archgate-ci.mjs`, `scripts/semver-floor.mjs`, `scripts/run-trivy.sh`
   - `.github/` (workflows, actions, rulesets, PR/issue templates) — only files the repo lacks
   - Config (`tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc`,
     `commitlint.config.cjs`, `.editorconfig`, `.nvmrc`, `.npmrc`, `.trivyignore`) — only if missing

4. **Recreate the symlinks** (the `.claude/` per-tool views over `.agents/`):
   - For each `.agents/skills/<name>` → `ln -s ../../.agents/skills/<name> .claude/skills/<name>`
   - For each `.agents/rules/<name>.md` → `ln -s ../../.agents/rules/<name>.md .claude/rules/<name>.md`

5. **Merge `package.json` scripts** (do not clobber existing ones): `archgate`,
   `archgate:ci`, `check:skills`, `check:rules`, `check:links`, `verify`, `prepare`.
   Add `husky` as a devDependency if absent.

6. **Verify**:
   ```bash
   npm run check:links && npm run archgate:ci && npm test
   ```
   Report the results.

7. **Tell the user to adapt the ADR rules.** The shipped `GEN-*`/`ARCH-001` rules
   in `.archgate/adrs/*.rules.ts` assume the demo layout (`src/`, `tests/unit`,
   `tests/e2e`, `tsconfig.json`, `vitest.config.ts`). Point them at
   `/adr-author` to retarget or amend rules for their actual stack.

8. **Clean up** `/tmp/lean-harness`.

Keep the user in the loop — this writes many files. Summarise what was added and
what they still need to decide (ADR scope, CI runner, branch protection).
