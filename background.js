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


// Register event listeners
browser.contextMenus.onClicked.addListener(ContextMenuClicked);
browser.browserAction.onClicked.addListener(ToolbarButtonClicked);

UpdateUI();
