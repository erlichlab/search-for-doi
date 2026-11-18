"use strict";
const test = require("node:test");
const assert = require("node:assert");
const lib = require("../lib/library.js");

// --- synthetic stand-in for the bits of Zotero the library layer touches ---
function fakeZotero({ itemsByDoiQuery = {}, searchThrows = false, translate = {} } = {}) {
  const calls = { conditions: [], translateOpts: null };
  class Search {
    addCondition(...c) { calls.conditions.push(c); this.query = c[2]; }
    async search() {
      if (searchThrows) throw new Error("db locked");
      return (itemsByDoiQuery[this.query] ?? []).map((i) => i.id);
    }
  }
  const all = Object.values(itemsByDoiQuery).flat();
  class TranslateSearch {
    setIdentifier(id) { this.id = id; }
    async getTranslators() { return translate.translators ?? [{}]; }
    setTranslator() {}
    async translate(opts) { calls.translateOpts = opts; return translate.items ?? [{ id: 99 }]; }
  }
  return {
    calls,
    Search,
    Items: { getAsync: async (ids) => all.filter((i) => ids.includes(i.id)) },
    Translate: { Search: TranslateSearch },
  };
}
const item = (id, doi) => ({ id, getField: (f) => (f === "DOI" ? doi : "") });

test("findInLibrary matches case-insensitively and ignores resolver prefixes", async () => {
  const Z = fakeZotero({ itemsByDoiQuery: { "10.1038/nature14539": [item(1, "https://doi.org/10.1038/NATURE14539")] } });
  const found = await lib.findInLibrary(Z, 7, "10.1038/Nature14539");
  assert.equal(found.id, 1);
});

test("findInLibrary rejects substring candidates that are a different DOI", async () => {
  // Zotero's "contains" would also return this longer DOI.
  const Z = fakeZotero({ itemsByDoiQuery: { "10.1038/nature1453": [item(2, "10.1038/nature14539")] } });
  assert.equal(await lib.findInLibrary(Z, 7, "10.1038/nature1453"), null);
});

test("findInLibrary returns null when nothing matches", async () => {
  assert.equal(await lib.findInLibrary(fakeZotero(), 7, "10.1/none.1"), null);
});

test("checkLibrary reports a failure per DOI instead of hiding it", async () => {
  const res = await lib.checkLibrary(fakeZotero({ searchThrows: true }), 7, ["10.1038/a1111", "10.1038/b2222"]);
  assert.equal(res.length, 2);
  assert.ok(res.every((r) => r.item === null && r.error instanceof Error));
});

test("checkLibrary keeps results in input order and mixes found / not found", async () => {
  const Z = fakeZotero({ itemsByDoiQuery: { "10.1038/b2222": [item(5, "10.1038/b2222")] } });
  const res = await lib.checkLibrary(Z, 7, ["10.1038/a1111", "10.1038/b2222"]);
  assert.deepEqual(res.map((r) => [r.doi, r.item?.id ?? null, r.error]), [
    ["10.1038/a1111", null, null],
    ["10.1038/b2222", 5, null],
  ]);
});

test("summarize says so when the library check failed, never '0 already in library'", () => {
  assert.equal(lib.summarize(10, 2, 0), "10 results, 2 already in your library");
  assert.equal(lib.summarize(10, 0, 0), "10 results, 0 already in your library");
  assert.match(lib.summarize(10, 0, 10), /library check failed/);
  assert.doesNotMatch(lib.summarize(10, 0, 10), /0 already/);
  assert.match(lib.summarize(10, 1, 3), /1 already in your library.*3/);
});

test("importByDoi saves into the chosen collection and returns the item", async () => {
  const Z = fakeZotero();
  const saved = await lib.importByDoi(Z, "10.1038/a1111", { libraryID: 7, collection: { id: 42 } });
  assert.equal(saved.id, 99);
  assert.deepEqual(Z.calls.translateOpts.collections, [42]);
  assert.equal(Z.calls.translateOpts.libraryID, 7);
});

test("importByDoi with no collection selected targets the library root", async () => {
  const Z = fakeZotero();
  await lib.importByDoi(Z, "10.1038/a1111", { libraryID: 7, collection: null });
  assert.equal(Z.calls.translateOpts.collections, false);
});

test("importByDoi throws when there is no translator or no item", async () => {
  await assert.rejects(
    lib.importByDoi(fakeZotero({ translate: { translators: [] } }), "10.1038/a1111", { libraryID: 7 }),
    /No translator/,
  );
  await assert.rejects(
    lib.importByDoi(fakeZotero({ translate: { items: [] } }), "10.1038/a1111", { libraryID: 7 }),
    /no item/,
  );
});
