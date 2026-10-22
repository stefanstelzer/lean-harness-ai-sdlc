#!/usr/bin/env node
// Wrapper for the archgate CLI that turns its `check --output json` output into
// human-readable failure blocks (rule, file:line, message, fix) and
// re-emits GitHub Actions annotations. Used by the push pipeline to
// surface *which file* tripped a rule — the bare `--ci` output only
// prints the message.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

export function isTimeoutError(error) {
  return typeof error === "string" && /timed out/i.test(error);
}

export function countTimeouts(report) {
  let timeoutCount = 0;
  for (const r of report?.results ?? []) {
    if (r.status === "error" && r.error && isTimeoutError(r.error)) {
      timeoutCount++;
    }
  }
  return timeoutCount;
}

export function formatArchgateSummary(report) {
  const timeoutCount = countTimeouts(report);
  return (
    `archgate: ${report.total} total · ${report.passed} passed · ` +
    `${report.failed} failed · ${report.warnings} warnings` +
    (report.ruleErrors ? ` · ${report.ruleErrors} rule errors` : "") +
    (timeoutCount ? ` (${timeoutCount} timed out)` : "")
  );
}

// Resolve archgate reproducibly. Prefer the version pinned in devDependencies
// (node_modules/.bin/archgate) so pre-push and CI run the *same* archgate that
// the lockfile records; fall back to a global install on PATH; only as a last
// resort use a *version-pinned* npx — never an unpinned `npx archgate`, which
// would float to @latest and make the gate non-reproducible. Keep
// ARCHGATE_VERSION in sync with the "archgate" devDependency in package.json.
const ARCHGATE_VERSION = "0.60.0";
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

const result = spawnSync(cmd, [...baseArgs, "check", "--output", "json"], {
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

console.log(formatArchgateSummary(report));

const escape = (s) =>
  String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

const isWarning = (v) => (v.severity ?? v.level) === "warning";

for (const r of report.results ?? []) {
  if (r.status === "pass") continue;

  console.log("");
  console.log(`✗ ${r.ruleId} (${r.adrId}) — ${r.description}`);

  if (r.status === "error" && r.error) {
    const isTimeout = isTimeoutError(r.error);
    const label = isTimeout ? "rule timed out" : "rule crashed";
    console.log(
      `  ${label}: ${r.error}${isTimeout ? " (capacity/load issue)" : ""}`,
    );
    process.stdout.write(
      `::error title=${escape(r.ruleId)}::${isTimeout ? "Rule timed out" : "Rule crashed"}: ${escape(r.error)}\n`,
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

// Warn-level violations live on pass-status rules, so the failure loop above
// skips them and the headline `warnings` count has no detail. Print a compact,
// per-rule breakdown so the count is actionable without flooding the log with
// one line per file (run `archgate check` for the full per-file list).
const warnCounts = new Map();
for (const r of report.results ?? []) {
  for (const v of r.violations ?? []) {
    if (!isWarning(v)) continue;
    const key = `${r.ruleId} (${r.adrId})`;
    warnCounts.set(key, (warnCounts.get(key) ?? 0) + 1);
  }
}
if (warnCounts.size) {
  console.log("");
  console.log(`⚠ ${report.warnings} warning(s) — non-blocking, by rule:`);
  for (const [key, n] of [...warnCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  · ${key}: ${n}`);
  }
  console.log("  Run `archgate check` for the per-file detail.");
}

process.exit(report.pass ? 0 : 1);
