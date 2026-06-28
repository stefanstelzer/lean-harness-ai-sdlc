/// <reference path="../rules.d.ts" />

export default {
  rules: {
    "gen001/commitlint-config-present": {
      description:
        "commitlint.config.cjs must exist and extend @commitlint/config-conventional",
      severity: "error",
      async check(ctx) {
        let content: string;
        try {
          content = await ctx.readFile("commitlint.config.cjs");
        } catch {
          ctx.report.violation({
            message:
              "commitlint.config.cjs is missing. Conventional Commits must be enforced via commitlint (GEN-001).",
            file: "commitlint.config.cjs",
            fix: "Add commitlint.config.cjs extending @commitlint/config-conventional.",
          });
          return;
        }
        if (!/@commitlint\/config-conventional/.test(content)) {
          ctx.report.violation({
            message:
              "commitlint.config.cjs must extend @commitlint/config-conventional.",
            file: "commitlint.config.cjs",
            fix: "Add `extends: ['@commitlint/config-conventional']`.",
          });
        }
      },
    },

    "gen001/commit-msg-hook-present": {
      description:
        "A Husky commit-msg hook must run commitlint so non-conforming messages are rejected locally",
      severity: "warning",
      async check(ctx) {
        let hook: string;
        try {
          hook = await ctx.readFile(".husky/commit-msg");
        } catch {
          ctx.report.warning({
            message:
              ".husky/commit-msg is missing. Conventional Commits should be enforced at commit time.",
            file: ".husky/commit-msg",
            fix: "Add a commit-msg hook invoking commitlint (e.g. `npx --no -- commitlint --edit $1`).",
          });
          return;
        }
        if (!/commitlint/.test(hook)) {
          ctx.report.warning({
            message:
              ".husky/commit-msg does not invoke commitlint.",
            file: ".husky/commit-msg",
          });
        }
      },
    },
  },
} satisfies RuleSet;
