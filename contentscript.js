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

let left, top, width, height = 0;
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
        touch-action: none;
      `;

  let x1, y1, x2, y2 = 0;
  overlay.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    // starting postions
    x1 = e.clientX;
    y1 = e.clientY;
    overlay.addEventListener('pointermove', (e) => {
      e.preventDefault();
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
    function _keyhandler(e) {
      if (e.key === "Escape") {
        _cleanup();
        reject();
      }
      else if (e.key === "Enter") {
        if (width > 0 && height > 0) {
          _cleanup();
          resolve({x: left + window.scrollX,
                   y: top + window.scrollY,
                   w: width,
                   h: height});
        }
      }
    }
    document.addEventListener('keyup', _keyhandler);

    function _cleanup() {
      overlay.remove();
      document.removeEventListener('keyup', _keyhandler);
    }

    overlay.addEventListener('pointerup', (e) => {
      e.preventDefault();
      _cleanup();
      resolve({x: left + window.scrollX,
               y: top + window.scrollY,
               w: width,
               h: height});
    });
  });
}


async function OnMessage(request, sender, sendResponse) {
  if (request.type == "TakeScreenshot")
    TakeScreenshot(request);

  if (request.type == "TriggerOpen")
    TriggerOpen(request.content, request.filename);
}

async function TakeScreenshot(request) {
  const prefs = await Storage.get();
  const format = request.format || prefs.formats[0];
  const region = request.region || prefs.regions[0];

  if (region == "full" && !prefs.fullpage_scrollpos)
    SaveScreenshot(
      0,
      0,
      document.documentElement.scrollWidth,
      document.documentElement.scrollHeight,
      format
    );
  else if (region == "full")
    SaveScreenshot(
      0,
      document.documentElement.scrollTop,
      document.documentElement.scrollWidth,
      document.documentElement.scrollHeight - document.documentElement.scrollTop,
      format
    );
  else if (region == "selection") {
    Select().then((posn) => {
      SaveScreenshot(
        posn.x,
        posn.y,
        posn.w,
        posn.h,
        format
      );
    });
  } else
    SaveScreenshot(
      document.documentElement.scrollLeft,
      document.documentElement.scrollTop,
      window.innerWidth,
      window.innerHeight,
      format
    );
}

function SaveScreenshot(aLeft, aTop, aWidth, aHeight, aFormat) {
  // Maximum size is limited!
  // https://hg.mozilla.org/mozilla-central/file/93c7ed3f5606865707e5ebee8709b13ce0c2e220/dom/canvas/CanvasRenderingContext2D.cpp#l4814
  // https://hg.mozilla.org/mozilla-central/file/93c7ed3f5606865707e5ebee8709b13ce0c2e220/gfx/2d/Factory.cpp#l326
  if (aHeight > 32767) {
    aHeight = 32767;
    alert(browser.i18n.getMessage("warningImageTooHigh"));
  }
  if (aWidth > 32767) aWidth = 32767;

  browser.runtime.sendMessage({
    type: "TakeScreenshot",
    left: aLeft,
    top: aTop,
    width: aWidth,
    height: aHeight,
    format: aFormat
  });
}


// Triggers a download for the content aContent named as aFilename.
async function TriggerOpen(aContent, aFilename) {
  const blob = await (await fetch(aContent)).blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = aFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// Register message event listener
browser.runtime.onMessage.addListener(OnMessage);
