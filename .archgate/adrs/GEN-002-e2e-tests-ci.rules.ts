/// <reference path="../rules.d.ts" />

export default {
  rules: {
    "gen002/e2e-tests-exist": {
      description: "tests/e2e/ must contain at least one *.test.ts journey",
      severity: "error",
      async check(ctx) {
        const files = await ctx.glob("tests/e2e/**/*.test.ts");
        if (files.length === 0) {
          ctx.report.violation({
            message:
              "No end-to-end tests found under tests/e2e/. The integration gate must not be empty (GEN-002).",
            file: "tests/e2e/",
            fix: "Add a journey test, e.g. tests/e2e/<name>.test.ts.",
          });
        }
      },
    },

    "gen002/e2e-script-present": {
      description: "package.json must expose a test:e2e script",
      severity: "error",
      async check(ctx) {
        const pkg = await ctx.readJSON("package.json");
        const script = pkg.scripts?.["test:e2e"];
        if (!script) {
          ctx.report.violation({
            message:
              "package.json is missing a `test:e2e` script (GEN-002).",
            file: "package.json",
            fix: 'Add "test:e2e": "vitest run tests/e2e" to scripts.',
          });
        }
      },
    },

    "gen002/e2e-runs-in-ci": {
      description:
        "At least one GitHub Actions workflow must run the e2e suite",
      severity: "warning",
      async check(ctx) {
        const workflows = await ctx.glob(".github/workflows/*.yml");
        if (workflows.length === 0) return; // CI authored elsewhere; don't block
        const bodies = await Promise.all(
          workflows.map((f) => ctx.readFile(f)),
        );
        const joined = bodies.join("\n");
        if (!/(test:e2e|tests\/e2e|\be2e\b)/i.test(joined)) {
          ctx.report.warning({
            message:
              "No workflow references the e2e suite. CI must run end-to-end tests (GEN-002).",
            file: ".github/workflows/",
            fix: "Invoke `npm run test:e2e` from a CI workflow (nightly and/or PR).",
          });
        }
      },
    },
  },
} satisfies RuleSet;
