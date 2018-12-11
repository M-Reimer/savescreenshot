/*
    Firefox addon "Save Screenshot"
    Copyright (C) 2017  Manuel Reimer <manuel.reimer@gmx.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Fired if one of our context menu entries is clicked.
function ContextMenuClicked(aInfo) {
  SendMessage(aInfo.menuItemId);
}

// Fired if toolbar button is clicked
function ToolbarButtonClicked() {
  SendMessage("{}");
}

// Triggers UI update (toolbar button popup and context menu)
async function UpdateUI() {
  // Get menu list
  const menus = await GetMenuList();

  //
  // Update toolbar button popup
  //

  if (menus.length)
    browser.browserAction.setPopup({popup: "popup/choose_format.html"});
  else
    browser.browserAction.setPopup({popup: ""});

  //
  // Update context menu
  //

  await browser.contextMenus.removeAll();

  const prefs = await browser.storage.local.get("show_contextmenu");
  const show_menu = (prefs.show_contextmenu !== undefined) ? prefs.show_contextmenu : true;

  if (show_menu) {
    const topmenu = browser.contextMenus.create({
      id: "{}",
      title: browser.i18n.getMessage("extensionName"),
      contexts: ["page"]
    });

    menus.forEach((entry) => {
      browser.contextMenus.create({
        id: entry.data,
        title: entry.label,
        contexts: ["page"],
        parentId: topmenu
      });
    });
  }
}

// Create a message host which exports parts of the "downloads" API (only the
// part which is needed to trigger downloads) to our content script.
browser.runtime.onConnect.addListener(function(aPort) {
  aPort.onMessage.addListener(async function(aMessage) {
    const blob = DataURItoBlob(aMessage.content);

    if (aMessage.action && aMessage.action == "copy") {
      let reader = new FileReader();
      reader.onload = (e) => {
        browser.clipboard.setImageData(e.target.result, "png");
      }
      reader.readAsArrayBuffer(blob);
    }
    else {
      const bloburi = URL.createObjectURL(blob);
      const prefs = await browser.storage.local.get();
      const method = prefs.savemethod || "open";
      browser.downloads.download({
        filename: aMessage.filename,
        url: bloburi,
        saveAs: (method == "saveas") ? true : false
      });
    }
  });
});

// This function converts a "data:" URI to a Blob object.
// The Blob is used to get "blob:" URI as a workaround for Bug 1318564
// https://bugzil.la/1318564 and to get an ArrayBuffer to copy to clipboard.
// Note: It is not possible to use "toBlob()" in contentscript as
//       we are not allowed to acces blob: URLs created in contentscript...
function DataURItoBlob(aDataURI) {
  // Split data URI into parts
  const [scheme, mime, encoding, content] = aDataURI.split(/[:;,]/);

  // Check preparsed values
  if (scheme != "data" || mime == "" || encoding != "base64" || content == "") {
    console.log("DataURItoBlobURI error: Invalid data URI: " + aDataURI);
    return "";
  }

  // Convert base64-encoded string to byte array
  let array = [];
  const bytestring = atob(content);
  for (let i = 0; i < bytestring.length; i++) {
    array.push(bytestring.charCodeAt(i));
  }

  // Create Blob from byte array and return it
  return new Blob([new Uint8Array(array)], {type: mime});
}

// Register event listeners
browser.contextMenus.onClicked.addListener(ContextMenuClicked);
browser.browserAction.onClicked.addListener(ToolbarButtonClicked);

browser.commands.onCommand.addListener(function(command) {
  if (command == "do-screenshot") {
    console.log("do-screenshot");
    ToolbarButtonClicked();
  }
});

UpdateUI();
