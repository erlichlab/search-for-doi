/* eslint-disable no-undef */
"use strict";
// Wrapped in a function: top-level names like `search` collide with existing
// non-configurable window properties in Gecko.
(() => {
const { Zotero } = ChromeUtils.importESModule("chrome://zotero/content/zotero.mjs");
const { mainWindow } = window.arguments?.[0] ?? {};
const { search: searchCrossref, doiKey } = globalThis.SearchForDOICrossref;

const MAILTO_PREF = "extensions.search-for-doi.mailto";
const $ = (id) => document.getElementById(id);
const setStatus = (t) => { $("status").textContent = t; };

function renderResult(r) {
  const li = document.createElement("li");
  const text = document.createElement("div");
  text.className = "text";
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = r.title;
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = [r.authors, r.year, r.journal].filter(Boolean).join(" · ");
  const doi = document.createElement("div");
  doi.className = "doi";
  doi.textContent = r.doi;
  text.append(title, meta, doi);

  const badge = document.createElement("a");
  badge.className = "badge";
  badge.hidden = true;
  badge.href = "#";
  const row = { r, li, badge, btn: document.createElement("button") };
  row.btn.textContent = "Import";
  row.btn.addEventListener("click", () => importDoi(row));
  text.append(badge);
  li.append(text, row.btn);
  return row;
}

// Find an existing, non-trashed item in `libraryID` with exactly this DOI.
// Zotero's "contains" is a case-insensitive substring match, so confirm each
// candidate's DOI field exactly (after normalizing) before calling it a match.
async function findInLibrary(libraryID, doi) {
  const key = doiKey(doi);
  const s = new Zotero.Search();
  s.libraryID = libraryID;
  s.addCondition("DOI", "contains", key);
  const ids = await s.search();
  if (!ids.length) return null;
  const items = await Zotero.Items.getAsync(ids);
  return items.find((it) => doiKey(it.getField("DOI")) === key) ?? null;
}

function markInLibrary(row, item) {
  row.item = item;
  row.badge.hidden = false;
  row.badge.textContent = "✓ In your library — show";
  row.badge.title = "Select this item in Zotero";
  row.badge.onclick = (ev) => {
    ev.preventDefault();
    Zotero.getActiveZoteroPane().selectItem(item.id);
    mainWindow?.focus();
  };
  row.btn.textContent = "Import again";
}

async function checkLibrary(rows) {
  let libraryID;
  try {
    libraryID = Zotero.getActiveZoteroPane().getSelectedLibraryID();
  } catch (e) {
    Zotero.logError(e);
    return 0;
  }
  const found = await Promise.all(
    rows.map(async (row) => {
      try {
        const item = await findInLibrary(libraryID, row.r.doi);
        if (item) markInLibrary(row, item);
        return !!item;
      } catch (e) {
        Zotero.logError(e); // a failed check must never block importing
        return false;
      }
    }),
  );
  return found.filter(Boolean).length;
}

async function importDoi(row) {
  const { r, btn } = row;
  btn.disabled = true;
  btn.textContent = "Importing…";
  try {
    const pane = Zotero.getActiveZoteroPane();
    const libraryID = pane.getSelectedLibraryID();
    const collection = pane.getSelectedCollection();
    // Same engine as the "Add Item by Identifier" wand.
    const translate = new Zotero.Translate.Search();
    translate.setIdentifier({ DOI: r.doi });
    const translators = await translate.getTranslators();
    if (!translators.length) throw new Error("No translator found for this DOI");
    translate.setTranslator(translators);
    const items = await translate.translate({
      libraryID,
      collections: collection ? [collection.id] : false,
      saveAttachments: false,
    });
    if (!items?.length) throw new Error("Zotero returned no item");
    markInLibrary(row, items[0]);
    btn.textContent = "Imported ✓";
    setStatus(`Imported: ${r.doi}${collection ? ` → ${collection.name}` : ""}`);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = row.item ? "Import again" : "Import";
    setStatus(`Import failed: ${e.message || e}`);
    Zotero.logError(e);
  }
}

$("form").setAttribute("onsubmit", "return false");
$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const q = $("q").value;
  const list = $("results");
  list.replaceChildren();
  if (!q.trim()) return;
  $("go").disabled = true;
  setStatus("Searching Crossref…");
  try {
    const results = await searchCrossref(
      q,
      (...a) => window.fetch(...a),
      10,
      Zotero.Prefs.get(MAILTO_PREF, true) || "",
    );
    const rows = results.map(renderResult);
    rows.forEach((row) => list.append(row.li));
    setStatus(results.length ? `${results.length} results — checking your library…` : "No results");
    if (results.length) {
      const n = await checkLibrary(rows);
      setStatus(`${results.length} results, ${n} already in your library`);
    }
  } catch (e) {
    setStatus(`Search failed: ${e.message || e}`);
  } finally {
    $("go").disabled = false;
  }
});
})();
