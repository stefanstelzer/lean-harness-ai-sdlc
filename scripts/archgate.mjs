#!/usr/bin/env node
/**
 * Archgate — a minimal architecture-fitness gate.
 *
 * It enforces the layering recorded in the ADRs (see docs/adr/) so that
 * architecture decisions are checked automatically on every push and PR, not
 * just in review. Exits non-zero on the first set of violations found.
 *
 * Rules enforced:
 *   1. No module in src/ may import from tests/ (production must not depend on tests).
 *   2. No relative import may escape the src/ directory (`../` past the root).
 *   3. The lowest layer (src/types.ts) must not import from any other src module.
 *
 * Extend RULES below as your architecture grows. Keep it dependency-free so it
 * runs in the pre-push hook without an install step.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');

/** Recursively collect all .ts files under a directory. */
function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collect(full));
    } else if (entry.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** Extract the raw specifier from every static/dynamic import in a file. */
function importsOf(file) {
  const source = readFileSync(file, 'utf8');
  const specifiers = [];
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(source)) !== null) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

const RULES = [
  {
    name: 'no-imports-from-tests',
    check: (file, spec) => (/(^|\/)tests\//.test(spec) ? 'imports from tests/' : null),
  },
  {
    name: 'no-escape-src',
    check: (file, spec) => {
      if (!spec.startsWith('.')) return null;
      const target = resolve(file, '..', spec);
      const rel = relative(SRC, target);
      return rel.startsWith('..') ? `relative import escapes src/ (${spec})` : null;
    },
  },
  {
    name: 'types-is-lowest-layer',
    check: (file, spec) => {
      if (!file.endsWith('/types.ts')) return null;
      return spec.startsWith('.') ? `src/types.ts must not import "${spec}"` : null;
    },
  },
];

const violations = [];
for (const file of collect(SRC)) {
  const rel = relative(ROOT, file);
  for (const spec of importsOf(file)) {
    for (const rule of RULES) {
      const message = rule.check(file, spec);
      if (message) {
        violations.push(`  ✗ [${rule.name}] ${rel}: ${message}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Archgate: architecture violations found:\n');
  console.error(violations.join('\n'));
  console.error(`\n${violations.length} violation(s). See docs/adr/ for the rules.`);
  process.exit(1);
}

console.log('Archgate: OK — architecture rules satisfied.');
