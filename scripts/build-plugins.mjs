#!/usr/bin/env node
/**
 * Generate per-tool plugin/extension artefacts from the canonical agent source.
 *
 * Single source of truth: `.agents/skills/<name>/SKILL.md` (knowledge) and
 * `.agents/commands/<name>.md` (user-invoked actions), plus AGENTS.md / WORKFLOW.md.
 * This is the symlink philosophy one level up — author once in `.agents/`, project
 * into every tool's native format. NEVER hand-edit the generated paths below; edit
 * `.agents/` and re-run `npm run build:plugins`. `scripts/check-plugins.sh` (pre-push
 * + CI) fails if the generated tree drifts from the source (see GEN-008).
 *
 * Generated (managed) paths — wiped and rebuilt on every run:
 *   plugins/lean-harness/skills/<name>/      Claude Code plugin skills
 *   commands/lean/<name>.toml                Gemini CLI custom commands (/lean:<name>)
 *   GEMINI.md                                Gemini CLI context (from AGENTS.md)
 *
 * Generated but *shared* with a hand-authored file (only marker-comment files are
 * touched — see GEN-008):
 *   plugins/lean-harness/commands/<name>.md  Claude Code plugin commands
 *
 * Hand-authored (left untouched):
 *   .claude-plugin/marketplace.json
 *   plugins/lean-harness/.claude-plugin/plugin.json
 *   plugins/lean-harness/commands/init-harness.md
 *   gemini-extension.json
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_SRC = join(root, '.agents', 'skills');
const COMMANDS_SRC = join(root, '.agents', 'commands');
const PLUGIN_SKILLS = join(root, 'plugins', 'lean-harness', 'skills');
const PLUGIN_COMMANDS = join(root, 'plugins', 'lean-harness', 'commands');
const GEMINI_CMDS = join(root, 'commands', 'lean');
const GEMINI_CTX = join(root, 'GEMINI.md');
const NAMESPACE = 'lean'; // Gemini command namespace -> /lean:<name>
const COMMAND_MARKER_PREFIX = '# GENERATED from .agents/commands/';

/** Split a markdown file into { frontmatter (raw lines, no fences), body }. */
function parse(md) {
  const lines = md.split('\n');
  if (lines[0]?.trim() !== '---') return { fm: [], body: md };
  const end = lines.indexOf('---', 1);
  if (end === -1) return { fm: [], body: md };
  return { fm: lines.slice(1, end), body: lines.slice(end + 1).join('\n').trimStart() };
}

function fmValue(fm, key) {
  const line = fm.find((l) => l.startsWith(`${key}:`));
  return line ? line.slice(key.length + 1).trim() : '';
}

/** Re-emit frontmatter for a Claude Code plugin skill (drop harness-only keys). */
function pluginFrontmatter(fm) {
  const keep = fm.filter((l) => !/^user-invocable\s*:/.test(l));
  return ['---', ...keep, '---', ''].join('\n');
}

/** Re-emit frontmatter for a Claude Code plugin command: description + allowed-tools
 * only (no `name` — the filename is the name), prefixed with the generated marker. */
function pluginCommandFrontmatter(name, fm) {
  const keep = fm.filter((l) => !/^name\s*:/.test(l));
  return ['---', `${COMMAND_MARKER_PREFIX}${name}.md by scripts/build-plugins.mjs — do not edit.`, ...keep, '---', ''].join('\n');
}

/** True if a file under PLUGIN_COMMANDS was produced by this generator (safe to touch). */
function isGeneratedCommandFile(path) {
  if (!existsSync(path)) return false;
  const { fm } = parse(readFileSync(path, 'utf8'));
  return fm.some((l) => l.startsWith(COMMAND_MARKER_PREFIX));
}

/** One-line TOML basic string (escape backslash + quotes, strip newlines). */
function tomlString(s) {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim()}"`;
}

/** TOML literal multi-line string ('''…''') — verbatim, no escapes. */
function tomlMultiline(s) {
  if (s.includes("'''")) {
    // Extremely rare in skill bodies; fall back to an escaped basic string.
    const esc = s.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
    return `"""\n${esc}\n"""`;
  }
  return `'''\n${s}\n'''`;
}

function listSkills() {
  return readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(SKILLS_SRC, d.name, 'SKILL.md')))
    .map((d) => d.name)
    .sort();
}

function listCommands() {
  if (!existsSync(COMMANDS_SRC)) return [];
  return readdirSync(COMMANDS_SRC, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md'))
    .map((d) => d.name.slice(0, -3))
    .sort();
}

/** Collect supporting docs (everything except SKILL.md) for a skill, sorted. */
function supportDocs(name) {
  return readdirSync(join(SKILLS_SRC, name))
    .filter((f) => f !== 'SKILL.md')
    .sort();
}

function buildClaudeSkill(name) {
  const srcDir = join(SKILLS_SRC, name);
  const destDir = join(PLUGIN_SKILLS, name);
  mkdirSync(destDir, { recursive: true });
  const { fm, body } = parse(readFileSync(join(srcDir, 'SKILL.md'), 'utf8'));
  writeFileSync(join(destDir, 'SKILL.md'), pluginFrontmatter(fm) + body + '\n');
  for (const doc of supportDocs(name)) {
    cpSync(join(srcDir, doc), join(destDir, doc));
  }
}

function buildClaudeCommand(name) {
  const { fm, body } = parse(readFileSync(join(COMMANDS_SRC, `${name}.md`), 'utf8'));
  mkdirSync(PLUGIN_COMMANDS, { recursive: true });
  writeFileSync(join(PLUGIN_COMMANDS, `${name}.md`), pluginCommandFrontmatter(name, fm) + body + '\n');
}

/** Read a skill or command entry uniformly: { fm, body, supportDocs }. */
function readEntry(kind, name) {
  if (kind === 'skill') {
    const srcDir = join(SKILLS_SRC, name);
    const { fm, body } = parse(readFileSync(join(srcDir, 'SKILL.md'), 'utf8'));
    return { fm, body, supportDocs: supportDocs(name).map((doc) => join(srcDir, doc)) };
  }
  const { fm, body } = parse(readFileSync(join(COMMANDS_SRC, `${name}.md`), 'utf8'));
  return { fm, body, supportDocs: [] };
}

function buildGeminiCommand(kind, name) {
  const { fm, body, supportDocs: docs } = readEntry(kind, name);
  const description = fmValue(fm, 'description') || `Run the ${name} skill.`;

  // Gemini commands are a single prompt — fold supporting docs into the prompt
  // so the command is self-contained (Claude Code keeps them as separate files).
  let prompt = body;
  for (const docPath of docs) {
    if (!docPath.endsWith('.md')) continue;
    const docBody = readFileSync(docPath, 'utf8').trim();
    prompt += `\n\n---\n\n# Reference: ${docPath.split('/').pop()}\n\n${docBody}`;
  }
  prompt += '\n\n---\n\nUser-provided arguments (may be empty): {{args}}';

  const srcLabel = kind === 'skill' ? `.agents/skills/${name}/` : `.agents/commands/${name}.md`;
  const toml =
    `# GENERATED from ${srcLabel} by scripts/build-plugins.mjs — do not edit.\n` +
    `description = ${tomlString(description)}\n\n` +
    `prompt = ${tomlMultiline(prompt)}\n`;
  mkdirSync(GEMINI_CMDS, { recursive: true });
  writeFileSync(join(GEMINI_CMDS, `${name}.toml`), toml);
}

function buildGeminiInit() {
  const prompt = `You are scaffolding the LEAN / harness-powered AI-SDLC framework into the
current repository using the canonical source at
github.com/stefanstelzer/lean-harness-ai-sdlc.

Steps:
1. Confirm the working tree is clean and you are on a feature branch (not main).
2. Fetch the harness machinery into a temp dir with degit (no git history):
   npx -y degit stefanstelzer/lean-harness-ai-sdlc /tmp/lean-harness
3. Copy these into the repo root (do NOT overwrite the user's src/ or tests/):
   .agents/  .archgate/  .husky/  AGENTS.md  WORKFLOW.md  CLAUDE.md
   scripts/check-skill-symlinks.sh  scripts/check-command-symlinks.sh
   scripts/check-rule-symlinks.sh
   scripts/archgate-ci.mjs  scripts/semver-floor.mjs  scripts/run-trivy.sh
   .github/  config files (tsconfig/vitest/eslint/prettier/commitlint/editorconfig
   /nvmrc/npmrc/trivyignore) only if the repo lacks them.
4. Recreate the symlinks: for each dir in .agents/skills/* create
   .claude/skills/<name> -> ../../.agents/skills/<name>; for each file in
   .agents/commands/*.md create .claude/commands/<name>.md ->
   ../../.agents/commands/<name>.md; same pattern for .agents/rules/*.
5. Merge these scripts into the user's package.json (do not clobber existing ones):
   archgate, archgate:ci, check:skills, check:commands, check:rules, check:links,
   verify, prepare.
6. Run: npm run check:links && npm run archgate:ci && npm test, and report results.
7. Tell the user to review .archgate/adrs/ and adapt the ADR rules (src/, tests/,
   tsconfig, vitest) to THEIR stack — the GEN-* rules assume the demo layout.

Requirement to apply: {{args}}`;
  const toml =
    `# GENERATED by scripts/build-plugins.mjs — do not edit.\n` +
    `description = "Scaffold the full LEAN AI-SDLC harness into the current repo."\n\n` +
    `prompt = ${tomlMultiline(prompt)}\n`;
  mkdirSync(GEMINI_CMDS, { recursive: true });
  writeFileSync(join(GEMINI_CMDS, 'init-harness.toml'), toml);
}

function buildGeminiContext() {
  const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8').trim();
  const header =
    `<!-- GENERATED from AGENTS.md by scripts/build-plugins.mjs — do not edit. -->\n` +
    `<!-- Edit AGENTS.md and run \`npm run build:plugins\`. -->\n\n` +
    `# Gemini CLI context — LEAN AI-SDLC harness\n\n` +
    `In Gemini CLI the skills and commands below are invoked as \`/${NAMESPACE}:<name>\` ` +
    `(e.g. \`/${NAMESPACE}:tdd\`, \`/${NAMESPACE}:pr\`). The full delivery ` +
    `workflow lives in WORKFLOW.md.\n\n---\n\n`;
  writeFileSync(GEMINI_CTX, header + agents + '\n');
}

/** Remove stale generated command files: were produced by a previous run (carry the
 * marker comment) but no longer have a matching source. Never touches a file without
 * the marker (e.g. the hand-authored init-harness.md). */
function pruneStaleCommands(currentNames) {
  if (!existsSync(PLUGIN_COMMANDS)) return;
  for (const entry of readdirSync(PLUGIN_COMMANDS, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const name = entry.name.slice(0, -3);
    if (currentNames.includes(name)) continue;
    const path = join(PLUGIN_COMMANDS, entry.name);
    if (isGeneratedCommandFile(path)) unlinkSync(path);
  }
}

function main() {
  if (!existsSync(SKILLS_SRC)) {
    console.error('build-plugins: .agents/skills not found — run from repo root.');
    process.exit(1);
  }
  // Wipe managed output so deletions in source propagate (no stale artefacts).
  // plugins/lean-harness/commands/ is NOT wiped wholesale — it shares the directory
  // with the hand-authored init-harness.md; see pruneStaleCommands (GEN-008).
  rmSync(PLUGIN_SKILLS, { recursive: true, force: true });
  rmSync(GEMINI_CMDS, { recursive: true, force: true });
  mkdirSync(PLUGIN_SKILLS, { recursive: true });
  mkdirSync(GEMINI_CMDS, { recursive: true });

  const skills = listSkills();
  const commands = listCommands();
  pruneStaleCommands(commands);

  for (const name of skills) {
    buildClaudeSkill(name);
    buildGeminiCommand('skill', name);
  }
  for (const name of commands) {
    buildClaudeCommand(name);
    buildGeminiCommand('command', name);
  }
  buildGeminiInit();
  buildGeminiContext();

  console.log(
    `build-plugins: ${skills.length} skills + ${commands.length} commands → Claude Code plugin + ${skills.length + commands.length + 1} Gemini commands + GEMINI.md`,
  );
  console.log(`  skills: ${skills.join(', ')}`);
  console.log(`  commands: ${commands.join(', ')}`);
}

main();
