# search-for-doi

Zotero 10 plugin (plain JS, no npm dependencies). Build with `scripts/build.sh`, test with `node --test test/*.test.js`.

- Bump the patch version in `manifest.json` with every fix (0.1.1 → 0.1.2 …) so a reinstall is distinguishable from the previous build.
- Edit `lib/*.js`, never `content/crossref.js` or `content/library.js`: `build.sh` generates those copies and they are git-ignored.
- Zotero-facing logic goes in `lib/library.js` with `Zotero` passed in as an argument, so it is tested with a stub; `content/search.js` is only rendering and event wiring.
- Every fix gets a regression test (`test/*.test.js`, synthetic fixtures only).
- Keep page scripts wrapped in a function: top-level names like `search` collide with Gecko window properties.
