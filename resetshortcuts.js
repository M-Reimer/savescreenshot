/*
    Firefox addon "Save Screenshot"
    Copyright (C) 2020  Manuel Reimer <manuel.reimer@gmx.de>

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

// TODO: Remove this whole file and the corresponding code in options.html/js
//       as soon as Firefox 74 is ESR

// Provide reset button to work around https://bugzil.la/1520119
const ResetShortcuts = {
  // Called on button click
  // Resets all shortcuts
  ButtonClicked: async function() {
    const commands = await browser.commands.getAll();
    commands.forEach((cmd) => {browser.commands.reset(cmd.name);});
  },

  // Init button or hide it on platforms without shortcuts
  Init: function() {
    const resetbutton = document.getElementById("reset_shortcuts_button");

    if (browser.commands === undefined) { // If on Android
      resetbutton.style.display = "none";
      return;
    }

    // Feature to define shortcuts only exists for Firefox 66 and above
    // Firefox got its own GUI to remove shortcuts in version 74
    browser.runtime.getBrowserInfo().then((info) => {
      if (parseInt(info.version) >= 66 && parseInt(info.version) < 74)
        resetbutton.addEventListener("click", this.ButtonClicked);
      else
        resetbutton.style.display = "none";
    });
  }
};
