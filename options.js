/*
    Firefox addon "Save Screenshot"
    Copyright (C) 2022  Manuel Reimer <manuel.reimer@gmx.de>

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

async function MultiselectGroupChanged(e) {
  // Collect checked boxes in this multiselect group
  let options = document.getElementsByName(e.target.name);
  const selected = [];
  options.forEach((option) => {
    if (option.checked)
      selected.push(option.id.split("_")[1]);
  });

  // If all checkboxes would be removed, then recheck the current item
  if (selected.length == 0) {
    selected.push(e.target.id.split("_")[1]);
    e.target.checked = true;
  }

  // Update copy notification checkbox disabled status
  document.getElementById("copynotification_checkbox").disabled = !document.getElementById("format_copy_option").checked;
  document.getElementById("fullpage_scrollpos_checkbox").disabled = !document.getElementById("region_full_option").checked;

  // Store selection
  const pref = e.target.name.split("_")[0] + "s";
  const settings = {};
  settings[pref] = selected;
  await Storage.set(settings);
  await browser.runtime.sendMessage({type: "OptionsChanged", redraw: true});
}

async function MethodChanged(e) {
  let method = e.target.id.split("_")[1];
  await Storage.set({
    savemethod: method
  });
  document.getElementById("savenotification_checkbox").disabled = (method != "save");
  await browser.runtime.sendMessage({type: "OptionsChanged"});
}

async function CheckboxChanged(e) {
  if (e.target.id.match(/([a-z_]+)_checkbox/)) {
    let pref = RegExp.$1;
    let params = {};
    params[pref] = e.target.checked;
    await Storage.set(params);
  }
  await browser.runtime.sendMessage({type: "OptionsChanged", redraw: true});
}

async function TextChanged(e) {
  let pref = e.target.id;
  let value = e.target.value;

  if (e.target.hasAttribute("pattern"))
    if (!value.match(e.target.getAttribute("pattern"))) {
      console.log("invalid");
      return;
    }

  let params = {};
  params[pref] = value;
  await Storage.set(params);
  await browser.runtime.sendMessage({type: "OptionsChanged"});
}

async function NumberChanged(e) {
  const pref = e.target.id;
  const value = parseInt(e.target.value);

  // Has to be a number and has to be in the defined range!
  if (isNaN(value) || value > e.target.max || value < e.target.min)
    return;

  const params = {};
  params[pref] = value;
  await Storage.set(params);
  await browser.runtime.sendMessage({type: "OptionsChanged"});
}

async function init() {
  // Android
  if ((await browser.runtime.getPlatformInfo()).os === "android") {
    const items = document.querySelectorAll('*[data-hide-on-android]');
    for (const item of items)
      item.setAttribute("style", "display:none");
  }

  await loadOptions();

  let formatoptions = document.getElementsByName("format_options");
  formatoptions.forEach((option) => {
    option.addEventListener("click", MultiselectGroupChanged);
  });
  let regionoptions = document.getElementsByName("region_options");
  regionoptions.forEach((option) => {
    option.addEventListener("click", MultiselectGroupChanged);
  });
  let methodoptions = document.getElementsByName("savemethod_options");
  methodoptions.forEach((option) => {
    option.addEventListener("click", MethodChanged);
  });

  document.getElementById("filenameformat").addEventListener("change", TextChanged);
  document.getElementById("targetdir").addEventListener("change", TextChanged);
  document.getElementById("jpegquality").addEventListener("change", NumberChanged);

  document.getElementById("show_contextmenu_checkbox").addEventListener("change", CheckboxChanged);
  document.getElementById("savenotification_checkbox").addEventListener("change", CheckboxChanged);
  document.getElementById("copynotification_checkbox").addEventListener("change", CheckboxChanged);
  document.getElementById("image_comment_checkbox").addEventListener("change", CheckboxChanged);
  document.getElementById("fullpage_scrollpos_checkbox").addEventListener("change", CheckboxChanged);
}

async function loadOptions() {
  const prefs = await Storage.get();
  document.getElementsByName("format_options").forEach((option) => {
    option.checked = prefs.formats.includes(option.id.split("_")[1]);
  });
  document.getElementsByName("region_options").forEach((option) => {
    option.checked = prefs.regions.includes(option.id.split("_")[1]);
  });
  document.getElementById("savemethod_" + prefs.savemethod + "_option").checked = true;
  document.getElementById("show_contextmenu_checkbox").checked = prefs.show_contextmenu;
  document.getElementById("filenameformat").value = prefs.filenameformat;
  document.getElementById("jpegquality").value = prefs.jpegquality;

  document.getElementById("savenotification_checkbox").disabled = (prefs.savemethod != "save");
  document.getElementById("savenotification_checkbox").checked = prefs.savenotification;
  document.getElementById("copynotification_checkbox").disabled = !prefs.formats.includes("copy");
  document.getElementById("copynotification_checkbox").checked = prefs.copynotification;
  document.getElementById("image_comment_checkbox").checked = prefs.image_comment;
  document.getElementById("fullpage_scrollpos_checkbox").checked = prefs.fullpage_scrollpos;
  document.getElementById("fullpage_scrollpos_checkbox").disabled = !prefs.regions.includes("full");
}

// Register event listener to receive option update notifications
browser.runtime.onMessage.addListener((data, sender) => {
  if (data.type == "OptionsChanged")
    loadOptions();
});

init();
