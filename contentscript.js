/*
    Firefox addon "Save Screenshot"
    Copyright (C) 2021  Manuel Reimer <manuel.reimer@gmx.de>
    Copyright (C) 2022  Jak.W <https://github.com/jakwings/firefox-screenshot>

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

function GetPageInfo() {
  const {scrollX: sx, scrollY: sy} = window;
  const {innerWidth: ww, innerHeight: wh} = window;
  const {clientWidth: cw, clientHeight: ch} = document.documentElement;
  const {scrollWidth: sw, scrollHeight: sh} = document.documentElement;
  return {sx, sy, ww, wh, cw, ch, sw, sh};
}

function GetScrollDirections() {
  // don't care if can't scroll page at all
  return {
    x: window.scrollX < 0 || window.scrollMaxX <= 0 && document.documentElement.clientWidth < document.documentElement.scrollWidth ? -1 : 1,
    y: window.scrollY < 0 || window.scrollMaxY <= 0 && document.documentElement.clientHeight < document.documentElement.scrollHeight ? -1 : 1,
  };
}

function Select() {
  const overlay = document.createElement('div');
  const selection = document.createElement('div');
  const style = document.createElement('style');
  overlay.appendChild(style);
  overlay.appendChild(selection);
  document.body.appendChild(overlay);

  let now = Date.now();
  style.id = 'screenshot-style-' + now;
  overlay.id = 'screenshot-overlay-' + now;
  selection.id = 'screenshot-selection-' + now;
  selection.dataset.w = 0;
  selection.dataset.h = 0;

  style.textContent = `
    #${style.id} {
      all: initial;
      display: none !important;
    }
    #${overlay.id} {
      all: initial;
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      height: 100% !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      z-index: 999999 !important;
      cursor: crosshair !important;
      background: none !important;
    }
    #${selection.id} {
      all: initial;
      display: block !important;
      position: absolute !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      /*outline: 1px dotted #000 !important;*/
      /*outline: 100vmax solid rgba(0, 0, 0, 0.7) !important;*/
    }
    #${selection.id}::after {
      all: initial;
      display: block !important;
      content: attr(data-w) "x" attr(data-h) !important;
      position: absolute !important;
      /* https://kovart.github.io/dashed-border-generator/ */
      /* https://stackoverflow.com/questions/7241393/can-you-control-how-an-svgs-stroke-width-is-drawn */
      /* https://developer.mozilla.org/en-US/docs/Web/SVG/Content_type */
      left: -1px !important;
      top: -1px !important;
      width: calc(100% + 2px) !important;
      height: calc(100% + 2px) !important;
      background: url('data:image/svg+xml,%3csvg width="100%25" height="100%25" xmlns="http://www.w3.org/2000/svg"%3e%3crect width="100%25" height="100%25" fill="none" stroke="black" stroke-width="2"/%3e%3crect width="100%25" height="100%25" fill="none" stroke="white" stroke-width="2" stroke-dasharray="2%25 %2c 2%25" stroke-dashoffset="1%25"/%3e%3c/svg%3e') !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      color: #000 !important;
      font: bold 12px monospace !important;
      /*text-shadow: 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff, -1px 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff !important;*/
      text-stroke: 2px #fff !important;
      -webkit-text-stroke: 2px #fff !important;
      paint-order: stroke fill !important;
    }
  `;

  let x1, y1, x2, y2, scrollX, scrollY, left, top, width, height;

  let clamp = (x, y) => [
    // excluding scrollbar width/height
    Math.max(0, Math.min(x, document.documentElement.clientWidth - 1)),
    Math.max(0, Math.min(y, document.documentElement.clientHeight - 1)),
  ];
  let nopop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };
  let onMouseMove = (event) => {
    nopop(event);
    // new positions
    [x2, y2] = clamp(event.clientX, event.clientY);
    scrollX = x1 < x2 ? scrollX : window.scrollX;
    scrollY = y1 < y2 ? scrollY : window.scrollY;
    // update relative positions
    left = (x1 < x2 ? x1 : x2);
    top = (y1 < y2 ? y1 : y2);
    width = Math.abs(x1 - x2);
    height = Math.abs(y1 - y2);
    // FIXME: circumvent "transform: translate(...) matrix(...)"
    selection.style.left = left + 'px';
    selection.style.top = top + 'px';
    selection.style.width = width + 'px';
    selection.style.height = height  + 'px';
    selection.dataset.w = width;
    selection.dataset.h = height;
  };
  let onMouseDown = (event) => {
    nopop(event);
    // starting postions
    [x1, y1] = clamp(event.clientX, event.clientY);
    scrollX = window.scrollX;
    scrollY = window.scrollY;
    window.addEventListener('mousemove', onMouseMove, {capture: true});
  };
  window.addEventListener('mousedown', onMouseDown, {capture: true, once: true});

  return new Promise((resolve, reject) => {
    let onKeyup = (event) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        cleanup();
        reject();
      }
    };
    let cleanup = () => {
      window.removeEventListener('keyup', onKeyup, {capture: true});
      window.removeEventListener('mousemove', onMouseMove, {capture: true});
      overlay.remove();
    };
    window.addEventListener('keyup', onKeyup, {capture: true});
    // TODO: allow readjustment by dragging the corners
    window.addEventListener('mouseup', (event) => {
      nopop(event);
      cleanup();
      let dir = GetScrollDirections();
      resolve({
        left: dir.x > 0 ? scrollX + left : document.documentElement.scrollWidth + scrollX - document.documentElement.clientWidth + left,
        top: dir.y > 0 ? scrollY + top : document.documentElement.scrollHeight + scrollY - document.documentElement.clientHeight + top,
        width: width,
        height: height,
      });
    }, {capture: true, once: true});
  });
}


async function TakeScreenshot(request) {
  const prefs = await Storage.get();
  const format = request.format || prefs.formats[0];
  const region = request.region || prefs.regions[0];

  let i = GetPageInfo();

  if (region == 'full') {
    SaveScreenshot({
      region: region,
      left: 0,
      top: 0,
      // excluding scrollbar width/height
      width: i.sw,
      height: i.sh,
      format: format,
    });
  } else if (region == 'selection') {
    Select().then((area) => {
      SaveScreenshot({
        region: region,
        left: area.left,
        top: area.top,
        width: area.width,
        height: area.height,
        format: format,
      });
    });
  } else {
    let dir = GetScrollDirections();
    SaveScreenshot({
      region: region,
      left: dir.x > 0 ? i.sx : i.sw + i.sx - i.cw,
      top: dir.y > 0 ? i.sy : i.sh + i.sy - i.ch,
      // excluding scrollbar width/height
      width: i.cw,
      height: i.ch,
      format: format,
    });
  }
}

function SaveScreenshot({region, left, top, width, height, format}) {
  let i = GetPageInfo();
  let [sx, sy] = [Math.trunc(i.sx), Math.trunc(i.sy)];
  let [spx, spy] = [i.sx - sx, i.sy - sy];
  // scrollbar width/height = (i.ww - i.cw), (i.wh - i.ch)
  // (i.sw, i.sh) does not include scrollbar width/height
  browser.runtime.sendMessage({
    type: 'TakeScreenshot',
    format: format,
    region: region,
    // distance from top left corner (non-negative)
    left: Math.trunc(left),
    top: Math.trunc(top),
    // extent from top left to bottom right
    width: width,
    height: height,
    // view width/height (excluding scrollbar width/height)
    vw: i.cw,
    vh: i.ch,
    // page width/height (excluding scrollbar width/height)
    pw: i.sw,
    ph: i.sh,
    // direction of axis X/Y (Left2Right/Top2Bottom = 1; Right2Left/Bottom2Top = -1)
    direction: GetScrollDirections(),
    // subpixel-precise decimal, negative when Right2Left or Bottom2Top
    scroll: {sx, sy, spx, spy},
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
    scale: window.devicePixelRatio,
  });
}


// Triggers a download.
async function TriggerOpen(content, filename) {
  let url = URL.createObjectURL(content);
  try {
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}


// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawWindow
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
async function DrawWindow(req) {
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d', {alpha: false});
  let {format, quality, rect: {x, y, width, height}, scale} = req;
  quality = (format === 'image/jpeg' ? quality / 100 : 1);
  ctx.scale(scale, scale);
  canvas.width = Math.trunc(width * scale);
  canvas.height = Math.trunc(height * scale);
  ctx.drawWindow(window, x, y, width * scale, height * scale, '#fff');
  return canvas.toDataURL(format, quality);
  //// Security Error: Content at moz-extension://<uuid>/background.html may not
  //// load data from blob:https://example.com/<uuid>
  //return new Promise((resolve, reject) => {
  //  canvas.toBlob(blob => {
  //    if (blob) {
  //      resolve(URL.createObjectURL(blob));
  //    } else {
  //      reject(`failed to draw window of tab#${tabId}`);
  //    }
  //  }, format, quality);
  //});
}


// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#communicating_with_background_scripts
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'TriggerOpen': return TriggerOpen(request.content, request.filename);
    case 'TakeScreenshot': return TakeScreenshot(request);
    case 'DrawWindow': return DrawWindow(request);
  }
  return false;
});
