
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

function init() {
  document.querySelector("#imageformat_headline").textContent = browser.i18n.getMessage("imageformat_headline_label");
  document.querySelector("#region_headline").textContent = browser.i18n.getMessage("region_headline_label");
  document.querySelector("#format_manual_label").textContent = browser.i18n.getMessage("select_manually_label");
  document.querySelector("#region_manual_label").textContent = browser.i18n.getMessage("select_manually_label");
  document.querySelector("#region_full_label").textContent = browser.i18n.getMessage("fullpage");
  document.querySelector("#region_viewport_label").textContent = browser.i18n.getMessage("viewport");
  document.querySelector("#savemethod_headline").textContent = browser.i18n.getMessage("savemethod_headline_label");
  document.querySelector("#savemethod_open_label").textContent = browser.i18n.getMessage("savemethod_open_label");
  document.querySelector("#savemethod_saveas_label").textContent = browser.i18n.getMessage("savemethod_saveas_label");
  document.querySelector("#savemethod_save_label").textContent = browser.i18n.getMessage("savemethod_save_label");

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
}

function loadOptions() {
  browser.storage.local.get().then((result) => {
    const format = result.format || "png";
    document.querySelector("#format_" + format + "_option").checked = true;
    const region = result.region || "full";
    document.querySelector("#region_" + region + "_option").checked = true;
    const method = result.savemethod || "open";
    document.querySelector("#savemethod_" + method + "_option").checked = true;
  });
}

init();
