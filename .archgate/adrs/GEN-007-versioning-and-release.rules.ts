/// <reference path="../rules.d.ts" />

export default {
  rules: {
    "gen007/changelog-present": {
      description: "CHANGELOG.md must exist",
      severity: "error",
      async check(ctx) {
        try {
          await ctx.readFile("CHANGELOG.md");
        } catch {
          ctx.report.violation({
            message:
              "CHANGELOG.md is missing. Releases must keep a human-readable changelog (GEN-007).",
            file: "CHANGELOG.md",
            fix: "Add CHANGELOG.md following the Keep a Changelog format.",
          });
        }
      },
    },

    "gen007/semver-floor-script-present": {
      description:
        "scripts/semver-floor.mjs must exist (deterministic SemVer floor)",
      severity: "error",
      async check(ctx) {
        const files = await ctx.glob("scripts/semver-floor.mjs");
        if (files.length === 0) {
          ctx.report.violation({
            message:
              "scripts/semver-floor.mjs is missing. The release version must be derived deterministically from Conventional Commits (GEN-007).",
            file: "scripts/semver-floor.mjs",
          });
        }
      },
    },
  },
} satisfies RuleSet;
