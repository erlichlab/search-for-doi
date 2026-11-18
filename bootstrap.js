/* eslint-disable no-undef */
var chromeHandle;
var rootURI;
const MENU_ID = "search-for-doi-menuitem";

function install() {}
function uninstall() {}

async function startup({ rootURI: uri }) {
  rootURI = uri;
  const aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  chromeHandle = aomStartup.registerChrome(
    Services.io.newURI(rootURI + "manifest.json"),
    [["content", "search-for-doi", rootURI + "content/"]],
  );
}

function addMenuItem(window) {
  const doc = window.document;
  const popup = doc.getElementById("menu_ToolsPopup");
  if (!popup || doc.getElementById(MENU_ID)) return;
  const item = doc.createXULElement("menuitem");
  item.id = MENU_ID;
  item.setAttribute("label", "Search by Title (Crossref)…");
  item.addEventListener("command", () => {
    // Pass the main window so the dialog can read the selected collection.
    window.openDialog(
      "chrome://search-for-doi/content/search.xhtml",
      "search-for-doi",
      "chrome,dialog=no,resizable,centerscreen,width=720,height=520",
      { mainWindow: window, rootURI },
    );
  });
  popup.appendChild(item);
}

function removeMenuItem(window) {
  window.document.getElementById(MENU_ID)?.remove();
}

function onMainWindowLoad({ window }) {
  addMenuItem(window);
}
function onMainWindowUnload({ window }) {
  removeMenuItem(window);
}

function shutdown(_data, reason) {
  if (reason === APP_SHUTDOWN) return;
  for (const win of Zotero.getMainWindows()) removeMenuItem(win);
  chromeHandle?.destruct();
  chromeHandle = null;
}
