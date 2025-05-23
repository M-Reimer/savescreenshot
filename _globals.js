/*
    Firefox addon "Save Screenshot"
    Copyright (C) 2025  Manuel Reimer <manuel.reimer@gmx.de>

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

'use strict';

// Function which handles sending the "take screenshot" message to the active
// tab. Includes error handling with error notification.
async function SendMessage(message, tab) {
  message.type = "TakeScreenshot";

  // If available, apply custom style for taking screenshot
  if (message.region == "full") {
    const style = GetCustomStyle(tab.url);
    if (style) {
      const txt = await (await fetch(style)).text();
      if (txt.match(/\/\* VIEWPORT \*\/\s*([^{]+)/))
        message.scrolltop = await browser.tabs.sendMessage(tab.id, {
          type: "GetScrollTop",
          selector: RegExp.$1
        });

      await browser.tabs.insertCSS(tab.id, {file: style});
    }
  }

  // Send trigger message to content script to begin the screenshot process
  try {
    await browser.tabs.sendMessage(tab.id, message);
  }
  catch(e) {
    console.log("SaveScreenshot message sending error: " + e);
    browser.notifications.create("error-notification", {
      "type": "basic",
      "title": browser.i18n.getMessage("errorTitleFailedSending"),
      "message": browser.i18n.getMessage("errorTextFailedSending")
    });
  }
}

// Function to generate list with menu entries based on the user settings.
async function GetMenuList() {
  const prefs = await Storage.get();
  if (prefs.formats.length == 1 && prefs.regions.length == 1)
    return [];

  const formats = [
    {id: "png",  label: "PNG"},
    {id: "jpg",  label: "JPEG"},
    {id: "copy", label: browser.i18n.getMessage("format_copy_label")}
  ];
  const regions = [
    {id: "full",      label: browser.i18n.getMessage("region_full_label")},
    {id: "viewport",  label: browser.i18n.getMessage("region_viewport_label")},
    {id: "selection", label: browser.i18n.getMessage("region_selection_label")}
  ];

  let template = "$REGION ($FORMAT)";
  if (prefs.formats.length == 1)
    template = "$REGION";
  else if (prefs.regions.length == 1)
    template = "$FORMAT";

  let list = [];
  for (let region of regions) {
    if (!prefs.regions.includes(region.id))
      continue;
    for (let format of formats) {
      if (!prefs.formats.includes(format.id))
        continue;
      list.push({
        label: template.replace("$REGION", region.label)
                       .replace("$FORMAT", format.label),
        data: {format: format.id, region: region.id}
      });
    }
  }

  return list;
}
