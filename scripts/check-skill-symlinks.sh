#!/bin/sh
# Verifies that every skill in .agents/skills/ has a matching symlink
# in .claude/skills/ pointing at ../../.agents/skills/<name>.
# See AGENTS.md > "Skills Layout".

set -e

SRC_DIR=".agents/skills"
LINK_DIR=".claude/skills"
status=0

if [ ! -d "$SRC_DIR" ]; then
  echo "❌ $SRC_DIR does not exist."
  exit 1
fi

if [ ! -d "$LINK_DIR" ]; then
  echo "❌ $LINK_DIR does not exist."
  exit 1
fi

for skill_path in "$SRC_DIR"/*/; do
  [ -d "$skill_path" ] || continue
  name=$(basename "$skill_path")
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
  if [ ! -d "$SRC_DIR/$name" ]; then
    echo "❌ Stale entry in $LINK_DIR: $name has no source in $SRC_DIR/"
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "✅ Skill symlinks are in sync."
fi

exit $status
