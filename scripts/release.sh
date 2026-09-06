#!/usr/bin/env bash
# Cut a release: bump version from Conventional Commits, regenerate the changelog,
# commit, and tag. Push is left to the caller.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is dirty. Commit or stash first." >&2
  exit 1
fi

if ! git describe --tags --abbrev=0 >/dev/null 2>&1; then
  baseline="v$(node -p "require('./package.json').version")"
  echo "No git tags yet. Create the baseline first:" >&2
  echo "  git tag ${baseline} && git push --tags" >&2
  exit 1
fi

next="$(pnpm exec git-cliff --bumped-version | sed 's/^v//')"
echo "Next version: v${next}"

pnpm exec git-cliff --bump -o CHANGELOG.md
pnpm version "${next}" --no-git-tag-version >/dev/null

git add CHANGELOG.md package.json
git commit -m "chore(release): v${next}"
git tag -a "v${next}" -m "Release v${next}"

echo
echo "Tagged v${next}. Publish with:  git push --follow-tags"
