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

// Function which handles sending the "take screenshot" message to the active
// tab. Includes error handling with error notification.
async function SendMessage(aJsonMessage) {
  const tabs = await browser.tabs.query({active: true, currentWindow: true});
  const message = JSON.parse(aJsonMessage);
  try {
    await browser.tabs.sendMessage(tabs[0].id, message);
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
  const prefs = await(browser.storage.local.get());
  const format = prefs.format || "png";
  const region = prefs.region || "full";

  let list = [];
  if (format == "manual" && region == "manual") {
    list.push({
      label: browser.i18n.getMessage("fullpage") + " (PNG)",
      data: '{"format": "png", "region": "full"}'
    });
    list.push({
      label: browser.i18n.getMessage("fullpage") + " (JPEG)",
      data: '{"format": "jpg", "region": "full"}'
    });
    list.push({
      label: browser.i18n.getMessage("viewport") + " (PNG)",
      data: '{"format": "png", "region": "viewport"}'
    });
    list.push({
      label: browser.i18n.getMessage("viewport") + " (JPEG)",
      data: '{"format": "jpg", "region": "viewport"}'
    });
  }
  else if (format == "manual") {
    list.push({
      label: "PNG",
      data: '{"format": "png"}'
    });
    list.push({
      label: "JPEG",
      data: '{"format": "jpg"}'
    });
  }
  else if (region == "manual") {
    list.push({
      label: browser.i18n.getMessage("fullpage"),
      data: '{"region": "full"}'
    });
    list.push({
      label: browser.i18n.getMessage("viewport"),
      data: '{"region": "viewport"}'
    });
  }
  return list;
}
