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

async function OnMessage(request, sender, sendResponse) {
  const prefs = await(browser.storage.local.get());
  let format = prefs.format || "png";
  let region = prefs.region || "full";

  if (format == "manual")
    format = request.format;
  if (region == "manual")
    region = request.region;

  if (region == "full")
    SaveScreenshot(
      0,
      0,
      window.innerWidth + window.scrollMaxX,
      window.innerHeight + window.scrollMaxY,
      format
    );
  else
    SaveScreenshot(
      document.documentElement.scrollLeft,
      document.documentElement.scrollTop,
      window.innerWidth,
      window.innerHeight,
      format
    );
}

function SaveScreenshot(aLeft, aTop, aWidth, aHeight, aFormat) {
  // Unfortunately there is a limit:
  if (aHeight > 16384) aHeight = 16384;

  var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
  canvas.height = aHeight;
  canvas.width = aWidth;

  var ctx = canvas.getContext("2d");
  ctx.drawWindow(content, aLeft, aTop, aWidth, aHeight, "rgb(0,0,0)");

  let imgdata;
  if (aFormat == "png")
    imgdata = canvas.toDataURL("image/png", "transparency=none");
  else
    imgdata = canvas.toDataURL("image/jpeg", "quality=80");

  const a = document.createElement("a");
  a.href = imgdata;
  a.download = GetDefaultFileName("saved_page") + "." + aFormat;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Gets the default file name, used for saving the screenshot
function GetDefaultFileName(aDefaultFileName) {
  // If possible, base the file name on document title
  let title = ValidateFileName(document.title);
  if (title)
    return title;

  // Otherwise try to use the actual HTML filename
  let path = window.location.pathname;
  if (path) {
    let filename = ValidateFileName(path.substring(path.lastIndexOf('/')+1));
    if (filename)
      return filename;
  }

  // Finally use the provided default name
  return aDefaultFileName;
}

// "Sanitizes" given string to be used as file name.
function ValidateFileName(aFileName) {
  // http://www.mtu.edu/umc/services/digital/writing/characters-avoid/
  aFileName = aFileName.replace(/[<\{]+/g, "(");
  aFileName = aFileName.replace(/[>\}]+/g, ")");
  aFileName = aFileName.replace(/[#$%!&*\'?\"\/:\\@]/g, "");
  // Remove leading "." and "-"
  aFileName = aFileName.replace(/^[\s-.]+/, "");
  // Remove trailing "."
  aFileName = aFileName.replace(/[\s.]+$/, "");
  return aFileName;
}

// Register message event listener
browser.runtime.onMessage.addListener(OnMessage);
