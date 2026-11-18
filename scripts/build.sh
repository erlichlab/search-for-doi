#!/usr/bin/env bash
# Package the plugin as an .xpi (a zip). lib/*.js is the source of truth; the
# copies in content/ are generated here (git-ignored) so they cannot drift.
set -euo pipefail
cd "$(dirname "$0")/.."
cp lib/*.js content/
rm -f search-for-doi.xpi
zip -qr search-for-doi.xpi manifest.json bootstrap.js content
echo "built search-for-doi.xpi (v$(python3 -c 'import json;print(json.load(open("manifest.json"))["version"])'))"
