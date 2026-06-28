#!/bin/sh
# Verifies that every rule file in .agents/rules/ has a matching symlink
# in .claude/rules/ pointing at ../../.agents/rules/<name>.md.
# See AGENTS.md > "Rules Layout".

set -e

SRC_DIR=".agents/rules"
LINK_DIR=".claude/rules"
status=0

if [ ! -d "$SRC_DIR" ]; then
  echo "❌ $SRC_DIR does not exist."
  exit 1
fi

if [ ! -d "$LINK_DIR" ]; then
  echo "❌ $LINK_DIR does not exist."
  exit 1
fi

for rule_path in "$SRC_DIR"/*.md; do
  [ -f "$rule_path" ] || continue
  name=$(basename "$rule_path")
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

for link in "$LINK_DIR"/*.md; do
  [ -e "$link" ] || [ -L "$link" ] || continue
  name=$(basename "$link")
  if [ ! -f "$SRC_DIR/$name" ]; then
    echo "❌ Stale entry in $LINK_DIR: $name has no source in $SRC_DIR/"
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "✅ Rule symlinks are in sync."
fi

exit $status
