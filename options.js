
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

function init() {
  document.querySelector("#imageformat_headline").textContent = browser.i18n.getMessage("imageformat_headline_label");
  document.querySelector("#region_headline").textContent = browser.i18n.getMessage("region_headline_label");
  document.querySelector("#format_manual_label").textContent = browser.i18n.getMessage("select_manually_label");
  document.querySelector("#region_manual_label").textContent = browser.i18n.getMessage("select_manually_label");
  document.querySelector("#region_full_label").textContent = browser.i18n.getMessage("fullpage");
  document.querySelector("#region_viewport_label").textContent = browser.i18n.getMessage("viewport");

  loadOptions();

  let formatoptions = document.getElementsByName("format_options");
  formatoptions.forEach((option) => {
    option.addEventListener("click", FormatChanged);
  });
  let regionoptions = document.getElementsByName("region_options");
  regionoptions.forEach((option) => {
    option.addEventListener("click", RegionChanged);
  });
}

function loadOptions() {
  browser.storage.local.get().then((result) => {
    let format = result.format || "png";
    document.querySelector("#format_" + format + "_option").checked = true;
    let region = result.region || "full";
    document.querySelector("#region_" + region + "_option").checked = true;
  });
}

init();
