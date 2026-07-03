#!/usr/bin/env node
// Wrapper for the archgate CLI that turns its --json output into
// human-readable failure blocks (rule, file:line, message, fix) and
// re-emits GitHub Actions annotations. Used by the push pipeline to
// surface *which file* tripped a rule — the bare `--ci` output only
// prints the message.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

// Resolve archgate reproducibly. Prefer the version pinned in devDependencies
// (node_modules/.bin/archgate) so pre-push and CI run the *same* archgate that
// the lockfile records; fall back to a global install on PATH; only as a last
// resort use a *version-pinned* npx — never an unpinned `npx archgate`, which
// would float to @latest and make the gate non-reproducible. Keep
// ARCHGATE_VERSION in sync with the "archgate" devDependency in package.json.
const ARCHGATE_VERSION = "0.45.7";
const localBin = fileURLToPath(
  new URL("../node_modules/.bin/archgate", import.meta.url),
);
let cmd, baseArgs;
if (existsSync(localBin)) {
  [cmd, baseArgs] = [localBin, []];
} else if (
  spawnSync("archgate", ["--version"], { encoding: "utf8" }).status === 0
) {
  [cmd, baseArgs] = ["archgate", []];
} else {
  [cmd, baseArgs] = ["npx", ["-y", `archgate@${ARCHGATE_VERSION}`]];
}

const result = spawnSync(cmd, [...baseArgs, "check", "--json"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

if (result.error) {
  console.error(`Failed to spawn archgate: ${result.error.message}`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch (err) {
  console.error("archgate did not return valid JSON.");
  if (result.stderr) console.error(`--- stderr ---\n${result.stderr}`);
  if (result.stdout) console.error(`--- stdout ---\n${result.stdout}`);
  console.error(`Parse error: ${err.message}`);
  process.exit(result.status ?? 1);
}

const summary =
  `archgate: ${report.total} total · ${report.passed} passed · ` +
  `${report.failed} failed · ${report.warnings} warnings` +
  (report.ruleErrors ? ` · ${report.ruleErrors} rule errors` : "");
console.log(summary);

const escape = (s) =>
  String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

for (const r of report.results ?? []) {
  if (r.status === "pass") continue;

  console.log("");
  console.log(`✗ ${r.ruleId} (${r.adrId}) — ${r.description}`);

  if (r.status === "error" && r.error) {
    console.log(`  rule crashed: ${r.error}`);
    process.stdout.write(
      `::error title=${escape(r.ruleId)}::Rule crashed: ${escape(r.error)}\n`,
    );
  }

  for (const v of r.violations ?? []) {
    const loc = v.line ? `${v.file}:${v.line}` : v.file;
    console.log(`  · ${loc} — ${v.message}`);
    if (v.fix) console.log(`    fix: ${v.fix}`);

    const parts = [];
    if (v.file) parts.push(`file=${v.file}`);
    if (v.line) parts.push(`line=${v.line}`);
    parts.push(`title=${escape(r.ruleId)}`);
    process.stdout.write(`::error ${parts.join(",")}::${escape(v.message)}\n`);
  }

  const hidden = (r.totalViolations ?? 0) - (r.shownViolations ?? 0);
  if (hidden > 0) {
    console.log(`  … and ${hidden} more violation(s) not shown by archgate.`);
  }
}

process.exit(report.pass ? 0 : 1);
