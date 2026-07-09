#!/bin/sh
# Verifies that every command in .agents/commands/ has a matching file symlink
# in .claude/commands/ pointing at ../../.agents/commands/<name>.md.
# See AGENTS.md > "Commands Layout".

set -e

SRC_DIR=".agents/commands"
LINK_DIR=".claude/commands"
status=0

if [ ! -d "$SRC_DIR" ]; then
  echo "❌ $SRC_DIR does not exist."
  exit 1
fi

if [ ! -d "$LINK_DIR" ]; then
  echo "❌ $LINK_DIR does not exist."
  exit 1
fi

for cmd_path in "$SRC_DIR"/*.md; do
  [ -f "$cmd_path" ] || continue
  name=$(basename "$cmd_path")
  link="$LINK_DIR/$name"
  expected="../../$SRC_DIR/$name"

  if [ ! -L "$link" ]; then
    echo "❌ Missing symlink: $link -> $expected"
    status=1
    continue
  fi

  target=$(readlink "$link")
  if [ "$target" != "$expected" ]; then
    echo "❌ Wrong symlink target for $link: '$target' (expected '$expected')"
    status=1
  fi
done

for link in "$LINK_DIR"/*; do
  [ -e "$link" ] || [ -L "$link" ] || continue
  name=$(basename "$link")
  if [ ! -f "$SRC_DIR/$name" ]; then
    echo "❌ Stale entry in $LINK_DIR: $name has no source in $SRC_DIR/"
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "✅ Command symlinks are in sync."
fi

exit $status
