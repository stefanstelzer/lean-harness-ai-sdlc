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

    "gen002/english-only-prose": {
      description:
        "Governance prose (ADRs, READMEs, PRDs, plans, docs) must be authored in English (AGENTS.md → Language)",
      severity: "error",
      async check(ctx) {
        const patterns = [
          ".archgate/adrs/**/*.md",
          "prd/**/*.md",
          "plans/**/*.md",
          "docs/**/*.md",
          "*.md",
        ];

        const stopwords = [
          "und", "oder", "nicht", "mit", "ohne", "wird", "werden",
          "sein", "ist", "sind", "sollte", "soll", "müssen", "muss",
          "kann", "keine", "kein", "durch", "über", "auch", "aber",
          "noch", "wenn", "dann", "weil", "damit", "diese", "dieser",
          "dieses", "ein", "eine", "einer", "einem", "einen", "der",
          "die", "das", "den", "dem",
        ];
        const stopwordRe = new RegExp(
          `\\b(?:${stopwords.join("|")})\\b`,
          "gi",
        );
        const diacriticRe = /[äöüÄÖÜß]/;
        const STOPWORD_THRESHOLD = 3;

        const stripMarkup = (md: string): string => {
          let s = md.replace(/```[\s\S]*?```/g, "");
          s = s.replace(/`[^`]*`/g, "");
          s = s.replace(/\*\*[^*\n]+\*\*/g, "");
          s = s.replace(/\*[^*\n]+\*/g, "");
          s = s.replace(/(^|\W)_[^_\n]+_(?=\W|$)/g, "$1");
          s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
          return s;
        };

        const hasIgnoreFrontmatter = (md: string): boolean => {
          const fmMatch = md.match(/^---\n([\s\S]*?)\n---/);
          if (!fmMatch) return false;
          return /^english-only:\s*ignore\s*$/m.test(fmMatch[1]);
        };

        const seen = new Set<string>();
        for (const pattern of patterns) {
          const files = await ctx.glob(pattern);
          for (const file of files) {
            if (seen.has(file)) continue;
            seen.add(file);

            const raw = await ctx.readFile(file);
            if (hasIgnoreFrontmatter(raw)) continue;
            const prose = stripMarkup(raw);

            const lines = prose.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (diacriticRe.test(lines[i])) {
                ctx.report.violation({
                  message:
                    "German diacritic detected in governance prose. " +
                    "Translate to English (AGENTS.md → Language).",
                  file,
                  line: i + 1,
                });
                break;
              }
            }

            const matches = prose.match(stopwordRe);
            if (matches && matches.length >= STOPWORD_THRESHOLD) {
              ctx.report.violation({
                message:
                  `Detected ${matches.length} German stopwords (threshold ${STOPWORD_THRESHOLD}). ` +
                  "Translate to English, or add `english-only: ignore` frontmatter if intentional.",
                file,
              });
            }
          }
        }
      },
    },
  },
} satisfies RuleSet;
