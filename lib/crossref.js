/* Pure helpers for the Crossref title search. No Zotero or DOM dependencies,
 * so they can be unit-tested with `node --test`. */
"use strict";
(function (root) {

const API = "https://api.crossref.org/works";

function buildUrl(title, rows = 10) {
  const params = new URLSearchParams({
    "query.bibliographic": String(title).trim(),
    rows: String(rows),
    select: "DOI,title,author,issued,container-title,type",
  });
  return `${API}?${params}`;
}

// Crossref titles can contain inline markup (<i>, <sub>, JATS). Result text is
// only ever rendered with textContent, but strip tags so it reads cleanly.
function stripMarkup(s) {
  return String(s ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function normalizeDoi(doi) {
  const m = String(doi ?? "").match(/10\.\d{4,9}\/\S+/);
  return m ? m[0] : "";
}

function parseResults(json) {
  const items = json?.message?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => {
      const doi = normalizeDoi(it.DOI);
      if (!doi) return null;
      const authors = (it.author || [])
        .map((a) => a.family || a.name || "")
        .filter(Boolean);
      return {
        doi,
        title: stripMarkup((it.title || [])[0]) || "(untitled)",
        authors:
          authors.length > 3
            ? `${authors.slice(0, 3).join(", ")} et al.`
            : authors.join(", "),
        year: it.issued?.["date-parts"]?.[0]?.[0] ?? "",
        journal: stripMarkup((it["container-title"] || [])[0]),
        type: it.type || "",
      };
    })
    .filter(Boolean);
}

async function search(title, fetchImpl = fetch, rows = 10) {
  if (!String(title).trim()) return [];
  const res = await fetchImpl(buildUrl(title, rows), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Crossref returned HTTP ${res.status}`);
  return parseResults(await res.json());
}

const exported = { buildUrl, parseResults, normalizeDoi, stripMarkup, search };
if (typeof module !== "undefined") module.exports = exported;
else root.SearchForDOICrossref = exported;
})(globalThis);
