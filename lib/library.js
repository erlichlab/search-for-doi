/* Zotero-facing logic, kept out of the dialog so it can be unit-tested.
 * `Zotero` is passed in rather than read from a global, so tests can supply a
 * stub and no test needs a running Zotero. */
"use strict";
(function (root) {

const { doiKey } =
  typeof module !== "undefined" ? require("./crossref.js") : root.SearchForDOICrossref;

// Find an existing, non-trashed item in `libraryID` with exactly this DOI.
// Zotero's "contains" is a case-insensitive substring match, so confirm each
// candidate's DOI field exactly (after normalizing) before calling it a match.
async function findInLibrary(Zotero, libraryID, doi) {
  const key = doiKey(doi);
  const s = new Zotero.Search();
  s.libraryID = libraryID;
  s.addCondition("DOI", "contains", key);
  const ids = await s.search();
  if (!ids.length) return null;
  const items = await Zotero.Items.getAsync(ids);
  return items.find((it) => doiKey(it.getField("DOI")) === key) ?? null;
}

// One { doi, item, error } per DOI, in input order. A lookup that fails is
// reported in `error` (not treated as "not in library"), so the caller can tell
// "no" from "unknown".
function checkLibrary(Zotero, libraryID, dois) {
  return Promise.all(
    dois.map(async (doi) => {
      try {
        return { doi, item: await findInLibrary(Zotero, libraryID, doi), error: null };
      } catch (error) {
        return { doi, item: null, error };
      }
    }),
  );
}

function summarize(total, found, failed) {
  if (failed === 0) return `${total} results, ${found} already in your library`;
  if (failed === total) {
    return `${total} results — library check failed, so duplicates are not flagged`;
  }
  return `${total} results, ${found} already in your library (check failed for ${failed})`;
}

// Same engine as Zotero's "Add Item by Identifier" wand. Throws if the DOI
// cannot be resolved or saved.
async function importByDoi(Zotero, doi, { libraryID, collection }) {
  const translate = new Zotero.Translate.Search();
  translate.setIdentifier({ DOI: doi });
  const translators = await translate.getTranslators();
  if (!translators.length) throw new Error("No translator found for this DOI");
  translate.setTranslator(translators);
  const items = await translate.translate({
    libraryID,
    collections: collection ? [collection.id] : false,
    saveAttachments: false,
  });
  if (!items?.length) throw new Error("Zotero returned no item");
  return items[0];
}

const exported = { findInLibrary, checkLibrary, summarize, importByDoi };
if (typeof module !== "undefined") module.exports = exported;
else root.SearchForDOILibrary = exported;
})(globalThis);
