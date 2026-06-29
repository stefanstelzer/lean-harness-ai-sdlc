#!/usr/bin/env node
/**
 * Deterministic SemVer FLOOR from Conventional Commits (single package).
 *
 * This is the guardrail under the `decide-semver` skill (see GEN-007): the
 * floor is computed mechanically from the commit messages since the last `v*`
 * git tag, and the agent may only RAISE the bump (e.g. flag an undeclared
 * breaking change), never lower it. A release takes max(floor, agent), so the
 * version number stays reproducible regardless of what the agent returns.
 *
 *   fix: / perf: / anything            -> patch
 *   feat:                              -> minor
 *   <type>!: ...  OR  BREAKING CHANGE  -> major
 *
 * `current` is read from package.json (the release bot commits the bump there as
 * the single source of truth); the range is `<lastTag>..HEAD`, or all history
 * when no `v*` tag exists yet.
 *
 * Usage:
 *   node scripts/semver-floor.mjs              # alias for --print
 *   node scripts/semver-floor.mjs --print      # print current + floor + count + next
 *   node scripts/semver-floor.mjs --apply <patch|minor|major> [--from <x.y.z>]
 *                                              # print the resulting version
 *   node scripts/semver-floor.mjs --max <a> <b>
 *                                              # print level=max(a,b); invalid /
 *                                              # empty operands are ignored (the
 *                                              # agent "may only raise" guardrail)
 */
import { execSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const RANK = { patch: 0, minor: 1, major: 2 };

function git(cmd, fallback = '') {
  try {
    return execSync(`git ${cmd}`, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

/** Latest `vX.Y.Z` tag reachable from HEAD, or null when none exist yet. */
export function latestTag() {
  return git('describe --tags --abbrev=0 --match "v[0-9]*"', '') || null;
}

/** Current version: package.json is the source of truth; fall back to 0.0.0. */
export function currentVersion() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/** Classify Conventional-Commit records into a bump level (pure, testable). */
export function classify(commits) {
  let level = 'patch';
  for (const { subject = '', body = '' } of commits) {
    const isBreaking =
      /^[a-z]+(\([^)]*\))?!:/i.test(subject) || /BREAKING[ -]CHANGE/.test(body);
    if (isBreaking) return 'major';
    if (/^feat(\([^)]*\))?:/i.test(subject)) level = 'minor';
  }
  return level;
}

/**
 * Classify the commit range since `fromTag` (or all history when null). Returns
 * the bump `level` and the `count` of matching commits — count 0 means nothing
 * landed since the last tag, so the caller should NOT bump.
 */
export function floorSince(fromTag) {
  const range = fromTag ? `${fromTag}..HEAD` : 'HEAD';
  // %s = subject, %b = body; records separated by \x1e, fields by \x1f.
  // --no-merges: merge commits carry no SemVer signal.
  const raw = git(`log ${range} --no-merges --format=%s%x1f%b%x1e`, '');
  const commits = raw
    .split('\x1e')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [subject = '', body = ''] = c.split('\x1f');
      return { subject, body };
    });
  return { level: classify(commits), count: commits.length };
}

export function applyBump(version, level) {
  const [major, minor, patch] = version.split('.').map((n) => parseInt(n, 10) || 0);
  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Pick the higher of two bump levels — the "agent may only raise" rule. */
export function maxLevel(a, b) {
  return RANK[a] >= RANK[b] ? a : b;
}

function emit(key, value) {
  console.log(`${key}=${value}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

function isMain() {
  return (
    process.argv[1] &&
    resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
  );
}

if (isMain()) {
  const args = process.argv.slice(2);
  const applyIdx = args.indexOf('--apply');
  const maxIdx = args.indexOf('--max');

  if (maxIdx !== -1) {
    // max(floor, agentBump): keep only valid levels so an empty or unknown
    // agent vote (e.g. the decide-semver step was skipped) degrades to the
    // deterministic floor instead of corrupting the release version.
    const level = [args[maxIdx + 1], args[maxIdx + 2]]
      .filter((l) => Object.prototype.hasOwnProperty.call(RANK, l))
      .reduce((acc, l) => maxLevel(acc, l), 'patch');
    emit('level', level);
  } else if (applyIdx !== -1) {
    const level = args[applyIdx + 1];
    if (!Object.prototype.hasOwnProperty.call(RANK, level)) {
      console.error(
        `semver-floor: invalid bump level '${level}' (expected patch|minor|major)`,
      );
      process.exit(1);
    }
    const fromIdx = args.indexOf('--from');
    const from = fromIdx !== -1 ? args[fromIdx + 1] : currentVersion();
    emit('next', applyBump(from, level));
  } else {
    // default + --print
    const tag = latestTag();
    const current = currentVersion();
    const { level, count } = floorSince(tag);
    emit('current', current);
    emit('floor', level);
    emit('count', count);
    emit('next', applyBump(current, level));
  }
}
