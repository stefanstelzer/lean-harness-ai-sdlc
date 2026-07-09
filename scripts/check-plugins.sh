#!/bin/sh
# Verifies the generated plugin/extension artefacts are in sync with the canonical
# `.agents/` source: re-runs the generator and fails if anything changed.
# See AGENTS.md > "Plugin distribution" and GEN-008. Pair of scripts/build-plugins.mjs.

set -e

node scripts/build-plugins.mjs >/dev/null

# Managed (generated) paths — must match a freshly built tree.
# plugins/lean-harness/commands is only *partially* managed (marker-comment files
# only — it shares the directory with the hand-authored init-harness.md, GEN-008),
# but a fresh build only ever touches those files, so a plain diff here is safe.
PATHS="plugins/lean-harness/skills plugins/lean-harness/commands commands/lean GEMINI.md"

if ! git diff --quiet -- $PATHS || [ -n "$(git ls-files --others --exclude-standard -- $PATHS)" ]; then
  echo "❌ Generated plugin artefacts are out of date."
  echo "   Run 'npm run build:plugins' and commit the result."
  echo "   Drift in:"
  git --no-pager diff --stat -- $PATHS || true
  git ls-files --others --exclude-standard -- $PATHS | sed 's/^/   (untracked) /' || true
  exit 1
fi

echo "✅ Plugin artefacts are in sync with .agents/."
