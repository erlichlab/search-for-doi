/* eslint-disable no-undef */
"use strict";
const { Zotero } = ChromeUtils.importESModule("chrome://zotero/content/zotero.mjs");
const { mainWindow } = window.arguments?.[0] ?? {};
const { search } = globalThis.SearchForDOICrossref;

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

  const btn = document.createElement("button");
  btn.textContent = "Import";
  btn.addEventListener("click", () => importDoi(r, btn));
  li.append(text, btn);
  return li;
}

async function importDoi(r, btn) {
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
    btn.textContent = "Imported ✓";
    setStatus(`Imported: ${r.doi}${collection ? ` → ${collection.name}` : ""}`);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = "Import";
    setStatus(`Import failed: ${e.message || e}`);
    Zotero.logError(e);
  }
}

$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const q = $("q").value;
  const list = $("results");
  list.replaceChildren();
  if (!q.trim()) return;
  $("go").disabled = true;
  setStatus("Searching Crossref…");
  try {
    const results = await search(q, (...a) => window.fetch(...a));
    results.forEach((r) => list.append(renderResult(r)));
    setStatus(results.length ? `${results.length} results` : "No results");
  } catch (e) {
    setStatus(`Search failed: ${e.message || e}`);
  } finally {
    $("go").disabled = false;
  }
});
