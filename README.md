# Search for DOI

A small Zotero 10 plugin: search Crossref by paper title, then import a result into your library by DOI.

## Use

- Click the magnifier button in the items toolbar (next to "Add Item by Identifier"), or choose **Tools → Search by Title (Crossref)…**.
- Type a title and press Enter. Each result shows title, authors, year, journal and DOI.
- Click **Import** on a result. It is saved to the collection currently selected in Zotero (or the library root).

## Install

1. Build the package: `./scripts/build.sh` (produces `search-for-doi.xpi`; needs only `zip`).
2. In Zotero: **Tools → Plugins**, gear icon, **Install Plugin From File…**, choose the `.xpi`.
3. **Restart Zotero.** The toolbar button and menu item only appear reliably after a restart.

Requires Zotero 10.x (`strict_max_version` is `10.*`).

## Privacy and security

- The only host contacted is `api.crossref.org`, and only with the title you typed.
- No npm dependencies, no build tooling beyond `zip`, no telemetry.
- `update_url` points at a reserved `.invalid` host (Zotero requires the field), so the plugin never auto-updates.

## Develop

- Tests: `node --test test/*.test.js`
- Edit `lib/crossref.js`, not `content/crossref.js`; `build.sh` copies it over.
- Bump the patch version in `manifest.json` with each fix.
