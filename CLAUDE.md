# search-for-doi

Zotero 10 plugin (plain JS, no npm dependencies). Build with `scripts/build.sh`, test with `node --test test/*.test.js`.

- Bump the patch version in `manifest.json` with every fix (0.1.1 → 0.1.2 …) so a reinstall is distinguishable from the previous build.
- Edit `lib/crossref.js`, not `content/crossref.js`; `build.sh` copies it over.
- Keep page scripts wrapped in a function: top-level names like `search` collide with Gecko window properties.
