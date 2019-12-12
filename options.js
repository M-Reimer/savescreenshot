
async function FormatChanged(e) {
  let format = e.target.id.split("_")[1];
  await Storage.set({
    format: format
  });
  browser.extension.getBackgroundPage().UpdateUI();
}

async function RegionChanged(e) {
  let region = e.target.id.split("_")[1];
  await Storage.set({
    region: region
  });
  browser.extension.getBackgroundPage().UpdateUI();
}

async function MethodChanged(e) {
  let method = e.target.id.split("_")[1];
  await Storage.set({
    savemethod: method
  });
  document.getElementById("savenotification_checkbox").disabled = (method != "save");
}

async function CheckboxChanged(e) {
  if (e.target.id.match(/([a-z_]+)_checkbox/)) {
    let pref = RegExp.$1;
    let params = {};
    params[pref] = e.target.checked;
    await Storage.set(params);
  }
  browser.extension.getBackgroundPage().UpdateUI();
}

async function TextChanged(e) {
  let pref = e.target.id;
  let value = e.target.value;
  let params = {};
  params[pref] = value;
  await Storage.set(params);
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
}

async function init() {
  // i18n
  [
    "imageformat_headline",
    "format_copy_label",
    "region_headline",
    ["format_manual_label", "select_manually_label"],
    ["region_manual_label", "select_manually_label"],
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
    "jpegquality_label"
  ].forEach((id) => {
    if (typeof id === "string")
      document.getElementById(id).textContent = browser.i18n.getMessage(id);
    else
      document.getElementById(id[0]).textContent = browser.i18n.getMessage(id[1]);
  });

  await loadOptions();

  let formatoptions = document.getElementsByName("format_options");
  formatoptions.forEach((option) => {
    option.addEventListener("click", FormatChanged);
  });
  let regionoptions = document.getElementsByName("region_options");
  regionoptions.forEach((option) => {
    option.addEventListener("click", RegionChanged);
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
  document.getElementById("format_" + prefs.format + "_option").checked = true;
  document.getElementById("region_" + prefs.region + "_option").checked = true;
  document.getElementById("savemethod_" + prefs.savemethod + "_option").checked = true;
  document.getElementById("show_contextmenu_checkbox").checked = prefs.show_contextmenu;
  document.getElementById("filenameformat").value = prefs.filenameformat;
  document.getElementById("jpegquality").value = prefs.jpegquality;

  document.getElementById("savenotification_checkbox").disabled = (prefs.savemethod != "save");
  document.getElementById("savenotification_checkbox").checked = prefs.savenotification;
}

init();
