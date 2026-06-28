/// <reference path="../rules.d.ts" />

const EXEMPT = new Set(["index.ts", "types.ts"]);

export default {
  rules: {
    "gen004/src-module-has-test": {
      description:
        "Every behavioural src/ module should have a matching tests/**/<name>.test.ts counterpart",
      severity: "warning",
      async check(ctx) {
        const srcFiles = await ctx.glob("src/**/*.ts");
        const testFiles = await ctx.glob("tests/**/*.test.ts");
        // Index test files by their leading basename, e.g.
        // tests/unit/feature-flags.test.ts -> "feature-flags".
        const tested = new Set<string>();
        for (const t of testFiles) {
          const base = t.split("/").pop() ?? "";
          const stem = base.replace(/\.test\.ts$/, "").split(".")[0];
          if (stem) tested.add(stem);
        }
        for (const file of srcFiles) {
          const base = file.split("/").pop() ?? "";
          if (base.endsWith(".d.ts")) continue;
          if (EXEMPT.has(base)) continue;
          const stem = base.replace(/\.ts$/, "");
          if (!tested.has(stem)) {
            ctx.report.warning({
              message: `${file} has no matching test (expected tests/**/${stem}.test.ts). Develop modules test-first (GEN-004).`,
              file,
              fix: `Add a failing test at tests/unit/${stem}.test.ts, then implement against it.`,
            });
          }
        }
      },
    },
  },
} satisfies RuleSet;
