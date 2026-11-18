/* eslint-disable no-undef */
// Runs in a sandbox inside the settings window; `onload` attributes are not
// visible here, so wire the input as soon as it exists.
(() => {
  const PREF = "extensions.search-for-doi.mailto";
  const valid = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());

  function wire() {
    const input = document.getElementById("search-for-doi-mailto");
    const status = document.getElementById("search-for-doi-mailto-status");
    if (!input) return false;
    if (input.dataset.wired) return true;
    input.dataset.wired = "1";
    input.value = Zotero.Prefs.get(PREF, true) || "";
    const save = () => {
      const v = input.value.trim();
      Zotero.Prefs.set(PREF, v, true);
      if (status) {
        status.textContent =
          !v ? "No email will be sent."
          : valid(v) ? "Saved."
          : "Saved, but this doesn't look like an email, so it will not be sent.";
      }
    };
    input.addEventListener("input", save);
    input.addEventListener("change", save);
    return true;
  }

  if (!wire()) {
    const mo = new MutationObserver(() => { if (wire()) mo.disconnect(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
