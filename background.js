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

// Create context menus
browser.contextMenus.create({
  id: "png",
  title: "PNG",
  contexts: ["page"]
});
browser.contextMenus.create({
  id: "jpg",
  title: "JPEG",
  contexts: ["page"]
});

// Register event listeners
browser.contextMenus.onClicked.addListener(ContextMenuClicked);
