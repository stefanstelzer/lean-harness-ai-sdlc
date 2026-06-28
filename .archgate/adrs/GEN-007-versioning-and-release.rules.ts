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

    "gen007/release-workflow-present": {
      description: "A release workflow must exist under .github/workflows/",
      severity: "warning",
      async check(ctx) {
        const workflows = await ctx.glob(".github/workflows/*.yml");
        if (workflows.length === 0) return; // CI authored elsewhere; don't block
        const hasRelease = workflows.some((f) => /release/i.test(f));
        if (!hasRelease) {
          ctx.report.warning({
            message:
              "No release workflow found under .github/workflows/. Releases should be cut automatically on merge to main (GEN-007).",
            file: ".github/workflows/",
            fix: "Add release.yml that bumps the version and cuts a vX.Y.Z tag + GitHub Release.",
          });
        }
      },
    },
  },
} satisfies RuleSet;
