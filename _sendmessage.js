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
function SendMessage(aSuffix) {
  var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then(
    function(tabs) {
      var sending = browser.tabs.sendMessage(tabs[0].id, {suffix: aSuffix});
      sending.then(
        function() {},
        function(aError) {
          browser.notifications.create("error-notification", {
            "type": "basic",
            "title": browser.i18n.getMessage("errorTitleFailedSending"),
            "message": browser.i18n.getMessage("errorTextFailedSending")
          });
        }
      );
    }
  );
}
