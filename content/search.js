/* eslint-disable no-undef */
"use strict";
// Wrapped in a function: top-level names like `search` collide with existing
// non-configurable window properties in Gecko.
(() => {
const { Zotero } = ChromeUtils.importESModule("chrome://zotero/content/zotero.mjs");
const { mainWindow } = window.arguments?.[0] ?? {};
const { search: searchCrossref, MAILTO_PREF } = globalThis.SearchForDOICrossref;
const Library = globalThis.SearchForDOILibrary;

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

// Marks rows already in the library. Returns the counts so the status line can
// say how many lookups failed instead of implying they found nothing.
async function checkLibrary(rows) {
  let results;
  try {
    const libraryID = Zotero.getActiveZoteroPane().getSelectedLibraryID();
    results = await Library.checkLibrary(Zotero, libraryID, rows.map((row) => row.r.doi));
  } catch (e) {
    Zotero.logError(e);
    return { found: 0, failed: rows.length };
  }
  results.forEach((res, i) => {
    if (res.error) Zotero.logError(res.error);
    else if (res.item) markInLibrary(rows[i], res.item);
  });
  return {
    found: results.filter((res) => res.item).length,
    failed: results.filter((res) => res.error).length,
  };
}

async function importDoi(row) {
  const { r, btn } = row;
  btn.disabled = true;
  btn.textContent = "Importing…";
  try {
    const pane = Zotero.getActiveZoteroPane();
    const collection = pane.getSelectedCollection();
    const item = await Library.importByDoi(Zotero, r.doi, {
      libraryID: pane.getSelectedLibraryID(),
      collection,
    });
    markInLibrary(row, item);
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
      const { found, failed } = await checkLibrary(rows);
      setStatus(Library.summarize(results.length, found, failed));
    }
  } catch (e) {
    setStatus(`Search failed: ${e.message || e}`);
  } finally {
    $("go").disabled = false;
  }
});
})();
