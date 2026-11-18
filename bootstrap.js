/* eslint-disable no-undef */
var chromeHandle;
var rootURI;
const MENU_ID = "search-for-doi-menuitem";
const BUTTON_ID = "search-for-doi-button";

function install() {}
function uninstall() {}

async function startup({ id, rootURI: uri }) {
  rootURI = uri;
  const aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  chromeHandle = aomStartup.registerChrome(
    Services.io.newURI(rootURI + "manifest.json"),
    [["content", "search-for-doi", rootURI + "content/"]],
  );

  try {
    await Zotero.PreferencePanes.register({
      pluginID: id,
      id: "search-for-doi-prefpane",
      label: "Search for DOI",
      image: rootURI + "content/icon.svg",
      src: rootURI + "content/prefs.xhtml",
      scripts: [rootURI + "content/prefs.js"],
    });
  } catch (e) {
    Zotero.logError(e);
  }

  // Windows already open when startup runs get the UI here. addUI is
  // idempotent, so it is harmless if onMainWindowLoad also fires for them.
  await Zotero.uiReadyPromise;
  for (const win of Zotero.getMainWindows()) addUI(win);
  Zotero.debug("[search-for-doi] started");
}

function openSearch(window) {
  // Pass the main window so the dialog can reach the selected collection.
  window.openDialog(
    "chrome://search-for-doi/content/search.xhtml",
    "search-for-doi",
    "chrome,dialog=no,resizable,centerscreen,width=720,height=520",
    { mainWindow: window, rootURI },
  );
}

function addUI(window) {
  const doc = window.document;

  // Tools menu item
  const popup = doc.getElementById("menu_ToolsPopup");
  if (!popup) {
    Zotero.debug("[search-for-doi] menu_ToolsPopup not found");
  } else if (!doc.getElementById(MENU_ID)) {
    const item = doc.createXULElement("menuitem");
    item.id = MENU_ID;
    item.setAttribute("label", "Search by Title (Crossref)…");
    item.addEventListener("command", () => openSearch(window));
    popup.appendChild(item);
  }

  // Items-pane toolbar button, placed after the "Add Item by Identifier" wand.
  const toolbar = doc.getElementById("zotero-items-toolbar");
  if (!toolbar) {
    Zotero.debug("[search-for-doi] zotero-items-toolbar not found");
  } else if (!doc.getElementById(BUTTON_ID)) {
    const btn = doc.createXULElement("toolbarbutton");
    btn.id = BUTTON_ID;
    btn.className = "zotero-tb-button";
    btn.setAttribute("tooltiptext", "Search by Title (Crossref)");
    btn.setAttribute("image", "chrome://search-for-doi/content/icon.svg");
    btn.addEventListener("command", () => openSearch(window));
    const anchor = doc.getElementById("zotero-tb-lookup");
    if (anchor?.parentNode) anchor.after(btn);
    else toolbar.appendChild(btn);
  }
}

function removeUI(window) {
  const doc = window.document;
  doc.getElementById(MENU_ID)?.remove();
  doc.getElementById(BUTTON_ID)?.remove();
}

function onMainWindowLoad({ window }) {
  addUI(window);
}
function onMainWindowUnload({ window }) {
  removeUI(window);
}

function shutdown(_data, reason) {
  if (reason === APP_SHUTDOWN) return;
  for (const win of Zotero.getMainWindows()) removeUI(win);
  chromeHandle?.destruct();
  chromeHandle = null;
}
