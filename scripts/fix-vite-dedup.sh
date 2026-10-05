#!/usr/bin/env bash
# Fix bun's vite deduplication issue where @tanstack/start-plugin-core
# resolves to a different vite@7 instance than apps/v2, breaking
# `instanceof RunnableDevEnvironment` checks in the dev server plugin.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

V2_VITE_LINK="$ROOT/apps/v2/node_modules/vite"
if [ ! -L "$V2_VITE_LINK" ]; then
  echo "fix-vite-dedup: apps/v2/node_modules/vite not found, skipping"
  exit 0
fi

V2_VITE_TARGET=$(readlink -f "$V2_VITE_LINK")
echo "fix-vite-dedup: v2 vite → $V2_VITE_TARGET"

# Find all @tanstack/start-plugin-core instances that have a nested vite
for PLUGIN_MODULES in "$ROOT/node_modules/.bun/@tanstack+start-plugin-core@"*/node_modules; do
  PLUGIN_VITE="$PLUGIN_MODULES/vite"
  if [ -L "$PLUGIN_VITE" ]; then
    CURRENT_TARGET=$(readlink -f "$PLUGIN_VITE" 2>/dev/null || echo "broken")
    if [ "$CURRENT_TARGET" != "$V2_VITE_TARGET" ]; then
      echo "fix-vite-dedup: patching $PLUGIN_VITE"
      rm "$PLUGIN_VITE"
      # Make the symlink relative so it works regardless of absolute path
      RELATIVE_PATH=$(python3 -c "import os.path; print(os.path.relpath('$V2_VITE_TARGET', '$PLUGIN_MODULES'))")
      ln -s "$RELATIVE_PATH" "$PLUGIN_VITE"
      echo "fix-vite-dedup: → $RELATIVE_PATH"
    else
      echo "fix-vite-dedup: $PLUGIN_VITE already correct"
    fi
  fi
done

echo "fix-vite-dedup: done"
