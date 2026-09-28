#!/usr/bin/env bash
# Copy @repo/ui from the Anumat design system (anumat-erp-storybooks) into vendor/ui.
#
# We vendor the source instead of using a submodule: the design system repo is
# private, and a copy keeps the GitHub Pages build free of extra credentials.
# Components are copied unchanged; stories, tests and fixtures are left out.
#
# Usage: scripts/sync-ui.sh [path-to-anumat-erp-storybooks]   (default: ../anumat-erp-storybooks)
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${1:-../anumat-erp-storybooks}"
UI="$SRC/packages/ui"
[[ -f "$UI/src/index.ts" ]] || { echo "No @repo/ui at $UI" >&2; exit 1; }

rm -rf vendor/ui
mkdir -p vendor/ui/src
cp -R "$UI/src/." vendor/ui/src/
rm -rf vendor/ui/src/foundations
find vendor/ui/src \( -name '*.stories.tsx' -o -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.fixtures.ts' \) -delete
cp "$UI/CONVENTIONS.md" vendor/ui/
# The prototype has no foundations or product folders; keep Tailwind from scanning them.
sed -i "/@source '..\/foundations';/d; /@source '..\/product';/d" vendor/ui/src/styles/globals.css

COMMIT="$(git -C "$SRC" rev-parse HEAD)"
BRANCH="$(git -C "$SRC" rev-parse --abbrev-ref HEAD)"
cat > vendor/ui/UPSTREAM.md <<MD
# Vendored @repo/ui

Copied from Anumat-ERP/anumat-erp-storybooks by \`scripts/sync-ui.sh\`. Do not edit
these files here: change the design system upstream, then re-run the script.

- Upstream commit: \`$COMMIT\` ($BRANCH)
- Synced: $(date -u +%Y-%m-%d)
MD
echo "Synced @repo/ui at $COMMIT"
