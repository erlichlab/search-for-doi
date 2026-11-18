#!/usr/bin/env bash
# Package the plugin as an .xpi (a zip). Keeps content/crossref.js in sync with lib/.
set -euo pipefail
cd "$(dirname "$0")/.."
cp lib/crossref.js content/crossref.js
rm -f search-for-doi.xpi
zip -qr search-for-doi.xpi manifest.json bootstrap.js content
echo "built search-for-doi.xpi (v$(python3 -c 'import json;print(json.load(open("manifest.json"))["version"])'))"
