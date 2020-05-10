/*
    Firefox addon "Save Screenshot"
    Copyright (C) 2019  Manuel Reimer <manuel.reimer@gmx.de>

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

function Select() {

  const overlay = document.createElement('div');
  const selection = document.createElement('div');
  overlay.appendChild(selection);
  document.body.appendChild(overlay);

  selection.style.cssText=`
        border: 1px dashed black;
        position: absolute;
     `;
  overlay.style.cssText=`
        position: fixed;
        left: 0;
        right: 0;
        top:0;
        height: 100%;
        width: 100%;
        z-index: 999999;
        cursor: crosshair;
      `;

  let x1, y1, x2, y2 = 0;
  let left, top, width, height;
  overlay.addEventListener('mousedown', (e) => {
    // starting postions
    x1 = e.clientX;
    y1 = e.clientY;
    overlay.addEventListener('mousemove', (e) => {
      // new positions
      x2 = e.clientX;
      y2 = e.clientY;
      // update relative positions
      left = x1 < x2 ? x1 : x2;
      top = y1 < y2 ? y1 : y2;
      height = Math.abs(y2 - y1);
      width = Math.abs(x2 - x1);
      // update div
      selection.style.left = left + "px";
      selection.style.top = top + "px";
      selection.style.width = width + "px";
      selection.style.height = height  + "px";
    });
  });

  return new Promise((resolve, reject) => {
    overlay.addEventListener('mouseup', (e) => {
      overlay.remove();
      resolve({x: left + window.scrollX,
               y: top + window.scrollY,
               w: width,
               h: height});
    });
  });
}


async function OnMessage(request, sender, sendResponse) {
  const prefs = await Storage.get();
  const format = request.format || prefs.format;
  const region = request.region || prefs.region;

  if (region == "full")
    SaveScreenshot(
      0,
      0,
      window.innerWidth + window.scrollMaxX,
      window.innerHeight + window.scrollMaxY,
      format,
      prefs.jpegquality
    );
  else if (region == "selection") {
    Select().then((posn) => {
      SaveScreenshot(
        posn.x,
        posn.y,
        posn.w,
        posn.h,
        format,
        prefs.jpegquality
      );
    });
  } else
    SaveScreenshot(
      document.documentElement.scrollLeft,
      document.documentElement.scrollTop,
      window.innerWidth,
      window.innerHeight,
      format,
      prefs.jpegquality
    );
}

function SaveScreenshot(aLeft, aTop, aWidth, aHeight, aFormat, aQuality) {
  // Maximum size is limited!
  // https://dxr.mozilla.org/mozilla-central/source/dom/canvas/CanvasRenderingContext2D.cpp#5517
  // https://dxr.mozilla.org/mozilla-central/source/gfx/2d/Factory.cpp#316
  if (aHeight > 32767) aHeight = 32767;
  if (aWidth > 32767) aWidth = 32767;

  var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
  canvas.height = aHeight;
  canvas.width = aWidth;

  var ctx = canvas.getContext("2d");
  ctx.drawWindow(window, aLeft, aTop, aWidth, aHeight, "rgb(0,0,0)");

  let imgdata;
  if (aFormat == "jpg")
    imgdata = canvas.toDataURL("image/jpeg", aQuality / 100);
  else
    imgdata = canvas.toDataURL("image/png");

  TriggerDownload(imgdata, aFormat);
}


// Triggers a download for the content aContent named as aFilename.
async function TriggerDownload(aContent, aFormat) {
  if (aFormat == "copy") {
    const port = browser.runtime.connect();
    port.postMessage({content: aContent, action: "copy"});
    port.disconnect();
    return;
  }

  const prefs = await Storage.get();
  const filename = GetDefaultFileName("saved_page", prefs.filenameformat) + "." + aFormat;

  // Trigger the firefox "open file" dialog.
  if (prefs.savemethod == "open") {
    const a = document.createElement("a");
    a.href = aContent;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  // All other cases have to be communicated to our "background script" as
  // content scripts can't access the "downloads" API.
  else {
    const port = browser.runtime.connect();
    port.postMessage({content: aContent, filename: filename});
    port.disconnect();
  }
}

// Gets the default file name, used for saving the screenshot
function GetDefaultFileName(aDefaultFileName, aFilenameFormat) {
  //prioritize formatted variant
  let formatted = SanitizeFileName(ApplyFilenameFormat(aFilenameFormat));
  if (formatted)
    return formatted;

  // If possible, base the file name on document title
  let title = SanitizeFileName(document.title);
  if (title)
    return title;

  // Otherwise try to use the actual HTML filename
  let path = window.location.pathname;
  if (path) {
    let filename = SanitizeFileName(path.substring(path.lastIndexOf('/')+1));
    if (filename)
      return filename;
  }

  // Finally use the provided default name
  return aDefaultFileName;
}

// Replaces format character sequences with the actual values
function ApplyFilenameFormat(aFormat) {
  const currentdate = new Date();
  aFormat = aFormat.replace(/%Y/,currentdate.getFullYear());
  aFormat = aFormat.replace(/%m/,(currentdate.getMonth()+1).toString().padStart(2, '0'));
  aFormat = aFormat.replace(/%d/,currentdate.getDate().toString().padStart(2, '0'));
  aFormat = aFormat.replace(/%H/,currentdate.getHours().toString().padStart(2, '0'));
  aFormat = aFormat.replace(/%M/,currentdate.getMinutes().toString().padStart(2, '0'));
  aFormat = aFormat.replace(/%S/,currentdate.getSeconds().toString().padStart(2, '0'));
  aFormat = aFormat.replace(/%t/,document.title || "");
  aFormat = aFormat.replace(/%u/,document.URL);
  aFormat = aFormat.replace(/%h/,window.location.hostname);
  return aFormat;
}

// "Sanitizes" given string to be used as file name.
function SanitizeFileName(aFileName) {
  // http://www.mtu.edu/umc/services/digital/writing/characters-avoid/
  aFileName = aFileName.replace(/[<\{]+/g, "(");
  aFileName = aFileName.replace(/[>\}]+/g, ")");
  aFileName = aFileName.replace(/[#$%!&*\'?\"\/:\\@|]/g, "");
  // Remove leading "." and "-"
  aFileName = aFileName.replace(/^[\s-.]+/, "");
  // Remove trailing "."
  aFileName = aFileName.replace(/[\s.]+$/, "");
  return aFileName;
}

// Register message event listener
browser.runtime.onMessage.addListener(OnMessage);
