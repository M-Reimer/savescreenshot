
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
  // i18n
  [
    "imageformat_headline",
    "format_copy_label",
    "region_headline",
    "region_full_label",
    "region_viewport_label",
    "savemethod_headline",
    "savemethod_open_label",
    "savemethod_saveas_label",
    "savemethod_save_label",
    "general_headline",
    "show_contextmenu_label",
    "filenameformat_label",
    "filenameformat_description001","filenameformat_description002","filenameformat_description003",
    "reset_shortcuts_button",
    "jpegquality_label",
    "savenotification_label"
  ].forEach((id) => {
    document.getElementById(id).textContent = browser.i18n.getMessage(id);
  });

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
  document.getElementById("jpegquality").addEventListener("change", NumberChanged);

  document.getElementById("show_contextmenu_checkbox").addEventListener("change", CheckboxChanged);
  document.getElementById("savenotification_checkbox").addEventListener("change", CheckboxChanged);

  // Init shortcut reset button
  ResetShortcuts.Init();
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
}

// Register event listener to receive option update notifications
browser.runtime.onMessage.addListener((data, sender) => {
  if (data.type == "OptionsChanged")
    loadOptions();
});

init();
