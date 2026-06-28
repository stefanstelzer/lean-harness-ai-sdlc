/// <reference path="../rules.d.ts" />

export default {
  rules: {
    "arch001/index-only-reexports": {
      description:
        "src/index.ts is the public barrel and must contain re-exports only (no logic or runtime values)",
      severity: "error",
      async check(ctx) {
        let content: string;
        try {
          content = await ctx.readFile("src/index.ts");
        } catch {
          return; // no barrel yet — nothing to enforce
        }
        const lines = content.split("\n");
        let inBlockComment = false;
        for (let i = 0; i < lines.length; i++) {
          const raw = lines[i] ?? "";
          const line = raw.trim();
          if (inBlockComment) {
            if (line.includes("*/")) inBlockComment = false;
            continue;
          }
          if (line === "" || line.startsWith("//")) continue;
          if (line.startsWith("/*")) {
            if (!line.includes("*/")) inBlockComment = true;
            continue;
          }
          if (line.startsWith("*")) continue; // jsdoc continuation
          // Allowed: re-exports that pull from another module.
          if (/^export\s+(type\s+)?(\{[^}]*\}|\*)\s+from\s+['"]/.test(line)) {
            continue;
          }
          if (/^export\s+\*\s+as\s+\w+\s+from\s+['"]/.test(line)) continue;
          ctx.report.violation({
            message:
              "src/index.ts must contain re-exports only. Move logic into a domain module and re-export it from the barrel.",
            file: "src/index.ts",
            line: i + 1,
            fix: "Replace this statement with `export … from './<module>.js'`.",
          });
        }
      },
    },

    "arch001/types-is-lowest-layer": {
      description:
        "src/types.ts is the lowest layer and must not import from any other src/ module",
      severity: "error",
      async check(ctx) {
        const matches = await ctx.grepFiles(
          /\bfrom\s+['"]\.\.?\//,
          "src/types.ts",
        );
        for (const m of matches) {
          ctx.report.violation({
            message:
              "src/types.ts must not import from other src/ modules. Types are the lowest layer; dependencies flow upward only.",
            file: m.file,
            line: m.line,
            fix: "Move the shared type here, or invert the dependency so the other module imports from types.ts.",
          });
        }
      },
    },

    "arch001/no-imports-from-tests": {
      description: "Production code under src/ must not import from tests/",
      severity: "error",
      async check(ctx) {
        const matches = await ctx.grepFiles(
          /\bfrom\s+['"][^'"]*(?:\/|^)tests\//,
          "src/**/*.ts",
        );
        for (const m of matches) {
          ctx.report.violation({
            message:
              "Production code must not import from tests/. Tests depend on src/, never the other way around.",
            file: m.file,
            line: m.line,
          });
        }
      },
    },
  },
} satisfies RuleSet;
