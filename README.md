# Search for DOI

A small Zotero 10 plugin: search Crossref by paper title, then import a result into your library by DOI.

## Use

- Click the magnifier button in the items toolbar (next to "Add Item by Identifier"), or choose **Tools → Search by Title (Crossref)…**.
- Type a title and press Enter. Each result shows title, authors, year, journal and DOI.
- Results already in your library are marked **✓ In your library — show** (click to select the item) and the button becomes **Import again**. Matching is by DOI only (case-insensitive) and only within the library currently selected in Zotero, so items stored without a DOI, or with the DOI only in Extra, are not detected.
- Click **Import** on a result. It is saved to the collection currently selected in Zotero (or the library root).

## Settings

**Zotero → Settings → Search for DOI** has an optional contact email. If set, it is sent to Crossref as the `mailto` parameter, which puts you in Crossref's faster "polite" pool. Leave it blank to send nothing.

## Install

1. Build the package: `./scripts/build.sh` (produces `search-for-doi.xpi`; needs only `zip`).
2. In Zotero: **Tools → Plugins**, gear icon, **Install Plugin From File…**, choose the `.xpi`.
3. **Restart Zotero.** The toolbar button and menu item only appear reliably after a restart.

Requires Zotero 10.x (`strict_max_version` is `10.*`).

## Privacy and security

- The only host contacted is `api.crossref.org`, and only with the title you typed (plus your contact email, if you set one).
- No npm dependencies, no build tooling beyond `zip`, no telemetry.
- `update_url` points at a reserved `.invalid` host (Zotero requires the field), so the plugin never auto-updates.

## Develop

- Tests: `node --test test/*.test.js` (Node 20+, no packages to install).
- Edit `lib/*.js`; `build.sh` copies them into `content/` (those copies are git-ignored).
- Bump the patch version in `manifest.json` with each fix.
