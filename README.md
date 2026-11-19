# Search for DOI

[![Latest release](https://img.shields.io/github/v/release/erlichlab/search-for-doi)](https://github.com/erlichlab/search-for-doi/releases/latest)
[![Release build](https://img.shields.io/github/actions/workflow/status/erlichlab/search-for-doi/release.yml?branch=main&label=build)](https://github.com/erlichlab/search-for-doi/actions/workflows/release.yml)
[![Zotero 10](https://img.shields.io/badge/Zotero-10-CC2936)](https://www.zotero.org/)
[![License: BSD-3-Clause](https://img.shields.io/badge/license-BSD--3--Clause-blue)](LICENSE)

A small Zotero 10 plugin: search Crossref by paper title, then import a result into your library by DOI.

## Use

- Click the magnifier button in the items toolbar (next to "Add Item by Identifier"), or choose **Tools → Search by Title (Crossref)…**.
- Type a title and press Enter. Each result shows title, authors, year, journal and DOI.
- Results already in your library are marked **✓ In your library — show** (click to select the item) and the button becomes **Import again**. Matching is by DOI only (case-insensitive) and only within the library currently selected in Zotero, so items stored without a DOI, or with the DOI only in Extra, are not detected.
- Click **Import** on a result. It is saved to the collection currently selected in Zotero (or the library root).

## Settings

**Zotero → Settings → Search for DOI** has an optional contact email. If set, it is sent to Crossref as the `mailto` parameter, which puts you in Crossref's faster "polite" pool. Leave it blank to send nothing.

## Install

1. Download `search-for-doi.xpi` from the [latest release](https://github.com/erlichlab/search-for-doi/releases/latest). (In Firefox, right-click the link and choose **Save Link As…** so it isn't installed into the browser.)
2. In Zotero: **Tools → Plugins**, gear icon, **Install Plugin From File…**, choose the `.xpi`.
3. **Restart Zotero.** The toolbar button and menu item only appear reliably after a restart.

Requires Zotero 10.x (`strict_max_version` is `10.*`).

To build from source instead, clone the repo and run `./scripts/build.sh` (produces `search-for-doi.xpi`; needs only `zip`).

## Privacy and security

- The only host contacted is `api.crossref.org`, and only with the title you typed (plus your contact email, if you set one).
- No npm dependencies, no build tooling beyond `zip`, no telemetry.
- `update_url` points at a reserved `.invalid` host (Zotero requires the field), so the plugin never auto-updates.

## Develop

- Tests: `node --test test/*.test.js` (Node 20+, no packages to install).
- Edit `lib/*.js`; `build.sh` copies them into `content/` (those copies are git-ignored).
- Bump the patch version in `manifest.json` with each fix.
- Releases are automatic: when a push to `main` carries a `manifest.json` version that has no GitHub release yet, CI (`.github/workflows/release.yml`) runs the tests, builds the `.xpi`, and publishes release `v<version>` with the `.xpi` attached. Pushes that don't bump the version do nothing.

## License

BSD 3-Clause. See [LICENSE](LICENSE).
