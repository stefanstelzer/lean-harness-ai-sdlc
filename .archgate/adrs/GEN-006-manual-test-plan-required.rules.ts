/// <reference path="../rules.d.ts" />

export default {
  rules: {
    "gen006/plans-have-manual-test-plan": {
      description:
        "Each phase block in ./plans/**/PLN-*.md must include a 'Manual Test Plan' sub-section with at least one filled bullet (no placeholders).",
      severity: "error",
      async check(ctx) {
        const plans = await ctx.glob("plans/**/PLN-*.md");
        const placeholder = /<test or verification step>|<step>|<TODO>/;

        // A phase heading is H2 or H3 ("## Phase …" / "### Phase …") so the gate
        // matches both the canonical template (H2 phase titles) and the older
        // H3 form. The Manual Test Plan marker is accepted as an H3/H4 heading
        // ("### Manual Test Plan") OR a bold line ("**Manual Test Plan**") so a
        // plausible authoring variant is still inspected rather than silently
        // skipped (see GEN-006 "Risks").
        const phaseSplit = /\n(?=#{2,3} Phase\b)/;
        const phaseTitleRe = /^#{2,3} Phase[^\n]*/;
        const mtpMarker = /^(?:#{3,4} Manual Test Plan\b|\*\*Manual Test Plan\*\*)/m;

        await Promise.all(
          plans.map(async (file) => {
            const md = await ctx.readFile(file);
            const chunks = md.split(phaseSplit);

            // chunks[0] is the file header before the first phase — skip it.
            for (let i = 1; i < chunks.length; i++) {
              const chunk = chunks[i];
              const titleMatch = chunk.match(phaseTitleRe);
              const phaseTitle = titleMatch ? titleMatch[0] : `chunk ${i}`;

              if (!mtpMarker.test(chunk)) {
                ctx.report.violation({
                  message: `${phaseTitle}: missing 'Manual Test Plan' block (GEN-006).`,
                  file,
                });
                continue;
              }

              // Body after the Manual Test Plan marker, up to the next phase
              // heading. Only the Manual Test Plan uses "- [ ] " or "- [x] " checkbox bullets,
              // so a generous body is safe — Red behaviours / Acceptance criteria
              // use plain "- " bullets that don't match the checkbox regex.
              const after = chunk.split(mtpMarker)[1] ?? "";
              const body = after.split(phaseSplit)[0] ?? "";

              const filled = body
                .split("\n")
                .filter((line) => /^- \[[ x]\] /.test(line.trim()))
                .filter((line) => !placeholder.test(line));

              if (filled.length === 0) {
                ctx.report.violation({
                  message: `${phaseTitle}: 'Manual Test Plan' needs at least one filled bullet (no placeholders, GEN-006).`,
                  file,
                });
              }
            }
          }),
        );
      },
    },

    "gen006/plans-link-upstream-prd": {
      description:
        "Each ./plans/**/PLN-*.md must link its upstream PRD (a markdown link to prd/**/PRD-*.md) so the plan and its PRD are loaded together at implementation time — unless it declares 'upstream-prd: none'.",
      severity: "error",
      async check(ctx) {
        const plans = await ctx.glob("plans/**/PLN-*.md");
        const prdLink = /\]\((?:\.\.\/)*prd\/(?:[^/)]+\/)*PRD-[^/)]+\.md\)/;
        const optOut = /^upstream-prd:\s*none\b/m;

        for (const file of plans) {
          const md = await ctx.readFile(file);
          if (optOut.test(md)) continue;
          if (!prdLink.test(md)) {
            ctx.report.violation({
              message:
                "Plan does not link its upstream PRD. Add '**Upstream PRD:** [prd/PRD-<n>-<slug>.md](../prd/PRD-<n>-<slug>.md)' near the top (GEN-006), or declare 'upstream-prd: none' with a reason for a standalone plan.",
              file,
              fix: "Add the **Upstream PRD:** link the /prd-to-plan template emits, or add `upstream-prd: none` frontmatter.",
            });
          }
        }
      },
    },

    "gen006/prd-plan-ids-unique": {
      description:
        "Each PRD-<n> and PLN-<n> number is used by exactly one file.",
      severity: "error",
      async check(ctx) {
        for (const { glob, prefix } of [
          { glob: "prd/**/PRD-*.md", prefix: "PRD" },
          { glob: "plans/**/PLN-*.md", prefix: "PLN" },
        ]) {
          const byId = new Map<string, string[]>();
          for (const file of await ctx.glob(glob)) {
            const id = file.match(new RegExp(`(?:^|/)${prefix}-(\\d+)-`))?.[1];
            if (id) byId.set(id, [...(byId.get(id) ?? []), file]);
          }
          for (const [id, files] of byId) {
            if (files.length < 2) continue;
            for (const file of files) {
              ctx.report.violation({
                message: `${prefix}-${id} is used by ${files.length} files: ${files.join(", ")} (GEN-006).`,
                file,
                fix: `Renumber the one that does not match its tracking issue to that issue's number (open an issue with \`gh issue create\` if it has none), and update every citation of it.`,
              });
            }
          }
        }
      },
    },

    "gen006/prd-has-tracking-issue": {
      description:
        "Every prd/**/PRD-<n>-*.md states its GitHub tracking issue in the canonical header line '**Tracking issue:** #<n>', and that <n> equals the file's number (format check only — the rule cannot reach GitHub).",
      severity: "error",
      async check(ctx) {
        // The line is matched at the start of a line so a quotation of it in
        // prose or a code span does not count. Context may follow the number
        // ("#1375 (part of #1200)"), but the PRD's own issue comes first, which
        // is what /pr reads.
        const canonical = /^\*\*Tracking issue:\*\* #(\d+)(?![\d\w])/m;
        for (const file of await ctx.glob("prd/**/PRD-*.md")) {
          const id = file.match(/(?:^|\/)PRD-(\d+)-/)?.[1];
          if (!id) continue;
          const line = (await ctx.readFile(file)).match(canonical);
          if (!line) {
            ctx.report.violation({
              message: `PRD-${id} has no '**Tracking issue:** #${id}' line (GEN-006).`,
              file,
              fix: `Open the PRD with '**Tracking issue:** #${id}'. If the PRD has no tracking issue, open one with \`gh issue create\` and renumber the PRD (and its plan) to that issue's number.`,
            });
          } else if (line[1] !== id) {
            ctx.report.violation({
              message: `PRD-${id} names tracking issue #${line[1]}; a PRD's number is its tracking issue's number (GEN-006).`,
              file,
              fix: `Renumber the PRD (and its plan) to ${line[1]}, or correct the line to the issue the PRD tracks.`,
            });
          }
        }
      },
    },
  },
} satisfies RuleSet;
