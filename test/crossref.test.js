"use strict";
const test = require("node:test");
const assert = require("node:assert");
const c = require("../lib/crossref.js");

const sample = { message: { items: [
  { DOI: "10.1038/nature14539", title: ["Deep <i>learning</i>"], author: [{ family: "LeCun" }, { family: "Bengio" }, { family: "Hinton" }, { family: "X" }],
    issued: { "date-parts": [[2015, 5]] }, "container-title": ["Nature"], type: "journal-article" },
  { DOI: "not-a-doi", title: ["Bad"] },
  { DOI: "10.1/abc.def", title: [], author: [{ name: "Some Consortium" }] },
] } };

test("buildUrl encodes the title and limits fields", () => {
  const u = new URL(c.buildUrl("a & b: c", 5));
  assert.equal(u.searchParams.get("query.bibliographic"), "a & b: c");
  assert.equal(u.searchParams.get("rows"), "5");
});

test("parseResults strips markup, truncates authors, drops bad DOIs", () => {
  const r = c.parseResults(sample);
  assert.equal(r.length, 1); // bad DOI and short-registrant DOI are dropped
  assert.equal(r[0].title, "Deep learning");
  assert.equal(r[0].authors, "LeCun, Bengio, Hinton et al.");
  assert.equal(r[0].year, 2015);
  assert.equal(r[0].journal, "Nature");
  assert.ok(!r.some((x) => x.doi === "not-a-doi"));
});

test("parseResults tolerates junk", () => {
  assert.deepEqual(c.parseResults(null), []);
  assert.deepEqual(c.parseResults({ message: {} }), []);
});

test("search: empty query makes no request; HTTP errors throw", async () => {
  let calls = 0;
  const f = async () => { calls++; return { ok: false, status: 503 }; };
  assert.deepEqual(await c.search("  ", f), []);
  assert.equal(calls, 0);
  await assert.rejects(() => c.search("x", f), /HTTP 503/);
});
