/// <reference path="../rules.d.ts" />

type TsConfig = {
  compilerOptions?: Record<string, unknown>;
};

export default {
  rules: {
    "gen003/tsconfig-strict": {
      description:
        "tsconfig.json must enable strict mode and the tightened safety flags",
      severity: "error",
      async check(ctx) {
        const required = [
          "strict",
          "noUncheckedIndexedAccess",
          "noImplicitOverride",
          "noUnusedLocals",
          "noUnusedParameters",
        ];
        let cfg: TsConfig;
        try {
          cfg = (await ctx.readJSON("tsconfig.json")) as TsConfig;
        } catch {
          ctx.report.violation({
            message: "tsconfig.json is missing or unreadable (GEN-003).",
            file: "tsconfig.json",
          });
          return;
        }
        const opts = cfg.compilerOptions ?? {};
        for (const flag of required) {
          if (opts[flag] !== true) {
            ctx.report.violation({
              message: `tsconfig.json must set compilerOptions.${flag} to true (GEN-003).`,
              file: "tsconfig.json",
              fix: `Set "${flag}": true in compilerOptions.`,
            });
          }
        }
      },
    },

    "gen003/no-ts-ignore": {
      description:
        "Avoid @ts-ignore — prefer fixing the type or using @ts-expect-error with a TODO",
      severity: "warning",
      async check(ctx) {
        const matches = await ctx.grepFiles(/@ts-ignore/, "src/**/*.ts");
        for (const m of matches) {
          ctx.report.warning({
            message:
              "Avoid @ts-ignore. Fix the underlying type issue, or use @ts-expect-error with a justification and a TODO.",
            file: m.file,
            line: m.line,
          });
        }
      },
    },
  },
} satisfies RuleSet;
