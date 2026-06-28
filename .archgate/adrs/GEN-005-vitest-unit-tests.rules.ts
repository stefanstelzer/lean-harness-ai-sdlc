/// <reference path="../rules.d.ts" />

export default {
  rules: {
    "gen005/vitest-config-present": {
      description: "vitest.config.ts must exist",
      severity: "error",
      async check(ctx) {
        const files = await ctx.glob("vitest.config.{ts,mts,js}");
        if (files.length === 0) {
          ctx.report.violation({
            message:
              "No vitest config found. Vitest is the unit-test runner (GEN-005).",
            file: "vitest.config.ts",
            fix: "Add vitest.config.ts at the repo root.",
          });
        }
      },
    },

    "gen005/unit-tests-exist": {
      description: "tests/unit/ must contain at least one *.test.ts spec",
      severity: "error",
      async check(ctx) {
        const files = await ctx.glob("tests/unit/**/*.test.ts");
        if (files.length === 0) {
          ctx.report.violation({
            message:
              "No unit tests found under tests/unit/. The unit gate must not be empty (GEN-005).",
            file: "tests/unit/",
            fix: "Add a spec, e.g. tests/unit/<module>.test.ts.",
          });
        }
      },
    },

    "gen005/single-unit-runner": {
      description:
        "Do not introduce a second unit-test runner alongside Vitest",
      severity: "warning",
      async check(ctx) {
        const pkg = await ctx.readJSON("package.json");
        const deps = {
          ...(pkg.dependencies ?? {}),
          ...(pkg.devDependencies ?? {}),
        };
        for (const banned of ["jest", "mocha", "karma", "jasmine"]) {
          if (deps[banned]) {
            ctx.report.warning({
              message: `Dependency "${banned}" found. Vitest is the only approved unit-test runner (GEN-005).`,
              file: "package.json",
              fix: `Remove "${banned}" and use Vitest.`,
            });
          }
        }
      },
    },
  },
} satisfies RuleSet;
