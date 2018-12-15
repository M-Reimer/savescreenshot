const commandName = 'do-screenshot';

function updateShortcut(param) {
    browser.commands.update({
        name: commandName,
        shortcut: param
    });
}

async function FormatChanged(e) {
  let format = e.target.id.split("_")[1];
  await browser.storage.local.set({
    format: format
  });
  browser.extension.getBackgroundPage().UpdateUI();
}

async function RegionChanged(e) {
  let region = e.target.id.split("_")[1];
  await browser.storage.local.set({
    region: region
  });
  browser.extension.getBackgroundPage().UpdateUI();
}

async function MethodChanged(e) {
  let method = e.target.id.split("_")[1];
  await browser.storage.local.set({
    savemethod: method
  });
}

async function CheckboxChanged(e) {
  if (e.target.id.match(/([a-z_]+)_checkbox/)) {
    let pref = RegExp.$1;
    let params = {};
    params[pref] = e.target.checked;
    await browser.storage.local.set(params);
  }
  browser.extension.getBackgroundPage().UpdateUI();
}

async function TextChanged(e) {
    let pref = e.target.id;
    let value = e.target.value;
    let params = {};
    params[pref] = value;
    await browser.storage.local.set(params);

    if (pref=="shortcut"){
        updateShortcut(value);
    }
}



function init() {
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
    "shortcut_label", "prefixFormat_label",
    "prefixFormat_description001","prefixFormat_description002","prefixFormat_description003",
  ].forEach((id) => {
    if (typeof id === "string")
      document.getElementById(id).textContent = browser.i18n.getMessage(id);
    else
      document.getElementById(id[0]).textContent = browser.i18n.getMessage(id[1]);
  });

  loadOptions();

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

  document.getElementById("prefixFormat").addEventListener("change", TextChanged);

  document.getElementById("shortcut").addEventListener("change", TextChanged);
  //let shortcut = document.getElementById("shortcut").value;
  //updateShortcut(shortcut);
  //updateShortcut(shortcut);

  document.getElementById("show_contextmenu_checkbox").addEventListener("change", CheckboxChanged);
}

function loadOptions() {
  browser.storage.local.get().then((result) => {
    const format = result.format || "png";
    document.querySelector("#format_" + format + "_option").checked = true;
    const region = result.region || "full";
    document.querySelector("#region_" + region + "_option").checked = true;
    const method = result.savemethod || "save";
    document.querySelector("#savemethod_" + method + "_option").checked = true;
    document.querySelector("#show_contextmenu_checkbox").checked = (result.show_contextmenu !== undefined) ? result.show_contextmenu : true;

    const shortcut = result.shortcut || "Ctrl+Shift+L";
    document.querySelector("#shortcut").value = shortcut;

    const prefixFormat = result.prefixFormat || "%y%m%d_%H%M%S_%h";
    document.querySelector("#prefixFormat").value = prefixFormat;
  });
}

init();
