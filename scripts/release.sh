#!/usr/bin/env bash
# Cut a release: bump version from Conventional Commits, regenerate the changelog,
# commit, and tag. Push is left to the caller.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is dirty. Commit or stash first." >&2
  exit 1
fi

# Only storefront release tags count; package tags (content-schema-v*) are ignored.
if ! git describe --tags --abbrev=0 --match 'v[0-9]*' >/dev/null 2>&1; then
  baseline="v$(bun -p "require('./package.json').version")"
  echo "No git tags yet. Create the baseline first:" >&2
  echo "  git tag ${baseline} && git push --tags" >&2
  exit 1
fi

next="$(bunx git-cliff --bumped-version | sed 's/^v//')"
echo "Next version: v${next}"

# Prepend only the new release: regenerating the whole file re-sorts older
# sections, because not every past release tag is on main's history.
bunx git-cliff --unreleased --bump --prepend CHANGELOG.md
# Bump only the root package.json "version" field (no git tag here; the tag is made below).
NEXT_VERSION="${next}" bun -e '
const file = "package.json"
const text = await Bun.file(file).text()
if (!/"version"\s*:\s*"[^"]*"/.test(text)) throw new Error("version field not found in package.json")
await Bun.write(file, text.replace(/("version"\s*:\s*")[^"]*(")/, `$1${process.env.NEXT_VERSION}$2`))
'


git add CHANGELOG.md package.json
git commit -m "chore(release): v${next}"
git tag -a "v${next}" -m "Release v${next}"

echo
echo "Tagged v${next}. Publish with:  git push --follow-tags"
