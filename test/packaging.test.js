"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync, spawnSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
const manifest = JSON.parse(read("manifest.json"));
const libFiles = fs.readdirSync(path.join(ROOT, "lib")).filter((f) => f.endsWith(".js"));

test("manifest has what Zotero requires to load the plugin", () => {
  const z = manifest.applications.zotero;
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(z.id, "id");
  assert.ok(z.update_url, "Zotero refuses to load a plugin without update_url");
  assert.ok(z.strict_min_version && z.strict_max_version);
});

test("each lib file, loaded as a plain browser script, adds exactly one global", () => {
  // Regression: a top-level `search` collided with a non-configurable Gecko
  // window property and killed the dialog script.
  const ctx = { globalThis: null };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of libFiles) {
    const before = Object.keys(ctx);
    vm.runInContext(read("lib", f), ctx, { filename: f });
    const added = Object.keys(ctx).filter((k) => !before.includes(k));
    assert.equal(added.length, 1, `${f} added ${JSON.stringify(added)}`);
    assert.match(added[0], /^SearchForDOI/);
  }
});

test("the build copies every lib file into content/ unchanged", (t) => {
  if (spawnSync("zip", ["-v"]).error) return t.skip("zip not installed");
  execFileSync("bash", [path.join(ROOT, "scripts/build.sh")], { stdio: "ignore" });
  for (const f of libFiles) {
    assert.equal(read("content", f), read("lib", f), `content/${f} differs from lib/${f}`);
  }
});

test("the plugin id lives only in manifest.json; bootstrap uses the id Zotero passes in", () => {
  assert.ok(!read("bootstrap.js").includes(manifest.applications.zotero.id));
});

test("the mailto pref key has one definition shared by the dialog and the settings pane", () => {
  const { MAILTO_PREF } = require("../lib/crossref.js");
  assert.match(MAILTO_PREF, /^extensions\.search-for-doi\./);
  // The settings pane runs in a sandbox that cannot load lib/, so it keeps its
  // own literal; this test keeps that literal equal to the shared one.
  assert.ok(read("content", "prefs.js").includes(`"${MAILTO_PREF}"`));
  assert.ok(!read("content", "search.js").includes(MAILTO_PREF), "dialog must use the shared constant");
});
