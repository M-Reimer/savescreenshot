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

function OnMessage(request, sender, sendResponse) {
  var desth = window.innerHeight + window.scrollMaxY;
  var destw = window.innerWidth + window.scrollMaxX;

  // Unfortunately there is a limit:
  if (desth > 16384) desth = 16384;

  var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
  canvas.height = desth;
  canvas.width = destw;

  var ctx = canvas.getContext("2d");
  ctx.drawWindow(content, 0, 0, destw, desth, "rgb(0,0,0)");

  var imgdata;
  if (request.suffix == "png")
    imgdata = canvas.toDataURL("image/png", "transparency=none");
  else
    imgdata = canvas.toDataURL("image/jpeg", "quality=80");

  var a = document.createElement("a");
  a.href = imgdata;
  a.download = "saved_page." + request.suffix;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Register message event listener
browser.runtime.onMessage.addListener(OnMessage);
