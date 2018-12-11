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
    imgdata = canvas.toDataURL("image/jpeg", 0.8);
  else
    imgdata = canvas.toDataURL("image/png");

  TriggerDownload(imgdata, aFormat);
}

exportFunction(SaveScreenshot, window,{defineAs:'SaveScreenshot'});


// Triggers a download for the content aContent named as aFilename.
async function TriggerDownload(aContent, aFormat) {
  if (aFormat == "copy") {
    const port = browser.runtime.connect();
    port.postMessage({content: aContent, action: "copy"});
    port.disconnect();
    return;
  }

  const prefs = await browser.storage.local.get();
  const method = prefs.savemethod || "save";
  const prefixFormat= prefs.prefixFormat || "%y%m%d_%H%M%S_%h"; //%y%m%d_%H%M%S_%h_%t_%5_%u
  console.log("prefixFormat: "+prefixFormat);
  const filename = GetDefaultFileName("saved_page",prefixFormat) + "." + aFormat;

  // Trigger the firefox "open file" dialog.
  if (method == "open") {
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
function GetDefaultFileName(aDefaultFileName,prefixFormat) {
  //prioritize prefix variant 
  let prefix= ApplyPrefixFormat(prefixFormat);
  console.log("prefix: "+prefix);
  if (prefix)
    return prefix;
  
  // If possible, base the file name on document title
  let title = prefix + ValidateFileName(document.title);
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
  aFileName = aFileName.replace(/[#$%!&*\'?\"\/:\\@|]/g, "");
  // Remove leading "." and "-"
  aFileName = aFileName.replace(/^[\s-.]+/, "");
  // Remove trailing "."
  aFileName = aFileName.replace(/[\s.]+$/, "");
  return aFileName;
}

Number.prototype.pad = function (len) {
    return (new Array(len+1).join("0") + this).slice(-len);
}

function ApplyPrefixFormat(prefixFormat) {
  //--datetime prefix
  var currentdate = new Date();
  if (prefixFormat.lastIndexOf("%y")>=0 ){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%y/,currentdate.getFullYear());
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  if (prefixFormat.lastIndexOf("%Y")>=0 ){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%Y/,currentdate.getFullYear());
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  if (prefixFormat.lastIndexOf("%m")>=0){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%m/,(currentdate.getMonth()+1).pad(2));
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  if (prefixFormat.lastIndexOf("%d")>=0){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%d/,currentdate.getDate().pad(2));
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  if (prefixFormat.lastIndexOf("%H")>=0){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%H/,currentdate.getHours().pad(2));
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  if (prefixFormat.lastIndexOf("%M")>=0){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%M/,currentdate.getMinutes().pad(2));
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  if (prefixFormat.lastIndexOf("%S")>=0){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%S/,currentdate.getSeconds().pad(2));
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  //--rest
  if (prefixFormat.lastIndexOf("%t")>=0 ){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%t/,ValidateFileName(document.title));
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  if (prefixFormat.lastIndexOf("%u")>=0 ){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%u/,ValidateFileName(document.URL));
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  if (prefixFormat.lastIndexOf("%5")>=0 ){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%5/,ValidateFileName(md5(document.URL)));
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  if (prefixFormat.lastIndexOf("%h")>=0 ){
    console.log("ApplyPrefixFormat: "+prefixFormat);
    prefixFormat = prefixFormat.replace(/%h/,ValidateFileName(window.location.hostname));
    console.log("ApplyPrefixFormat: "+prefixFormat);
  }
  return prefixFormat;
}

function md5 ( str ) {

    var RotateLeft = function(lValue, iShiftBits) {
            return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
        };

    var AddUnsigned = function(lX,lY) {
            var lX4,lY4,lX8,lY8,lResult;
            lX8 = (lX & 0x80000000);
            lY8 = (lY & 0x80000000);
            lX4 = (lX & 0x40000000);
            lY4 = (lY & 0x40000000);
            lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
            if (lX4 & lY4) {
                return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                } else {
                    return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                }
            } else {
                return (lResult ^ lX8 ^ lY8);
            }
        };

    var F = function(x,y,z) { return (x & y) | ((~x) & z); };
    var G = function(x,y,z) { return (x & z) | (y & (~z)); };
    var H = function(x,y,z) { return (x ^ y ^ z); };
    var I = function(x,y,z) { return (y ^ (x | (~z))); };

    var FF = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

    var GG = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

    var HH = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

    var II = function(a,b,c,d,x,s,ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        };

    var ConvertToWordArray = function(str) {
            var lWordCount;
            var lMessageLength = str.length;
            var lNumberOfWords_temp1=lMessageLength + 8;
            var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
            var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
            var lWordArray=Array(lNumberOfWords-1);
            var lBytePosition = 0;
            var lByteCount = 0;
            while ( lByteCount < lMessageLength ) {
                lWordCount = (lByteCount-(lByteCount % 4))/4;
                lBytePosition = (lByteCount % 4)*8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount)<<lBytePosition));
                lByteCount++;
            }
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
            lWordArray[lNumberOfWords-2] = lMessageLength<<3;
            lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
            return lWordArray;
        };

    var WordToHex = function(lValue) {
            var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
            for (lCount = 0;lCount<=3;lCount++) {
                lByte = (lValue>>>(lCount*8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
            }
            return WordToHexValue;
        };

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    };

    var x=Array();
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;

    str = Utf8Encode(str);
    x = ConvertToWordArray(str);
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
    }

    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

    return temp.toLowerCase();
}

// Register message event listener
browser.runtime.onMessage.addListener(OnMessage);
