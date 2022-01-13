/*
    Firefox Add-on "Save Screenshot"
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

const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
]);

async function ApplyImageComment(content, title, url) {
  const imgdata = new DataView(content);

  const comment = FormatComment(title, url);
  const arr_comment = new TextEncoder("utf-8").encode(comment);

  let is_png = imgdata.byteLength >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, i) => imgdata.getUint8(i) === byte);

  let arr_final;
  let mimetype;
  if (is_png) {
    arr_final = ApplyPNGComment(imgdata, arr_comment);
    mimetype = "image/png";
  }
  else {
    arr_final = ApplyJPEGComment(imgdata, arr_comment);
    mimetype = "image/jpeg";
  }

  const dataurl = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(new Blob([arr_final], {type: mimetype}))
  })
  return dataurl;
}

function FormatComment(title, url) {
  let comment = "Generated with SaveScreenshot for Firefox";

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth()+1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  comment += "\nDate: " + year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;

  comment += "\nTitle: " + title;

  comment += "\nURL: " + url;

  return comment
}

//
// PNG comment handling
//

const PNG_ITXT_HEADER = new Uint8Array([
  0x69, 0x54, 0x58, 0x74, // "iTXt" in hex
  0x43, 0x6f, 0x6d, 0x6d, 0x65, 0x6e, 0x74, // "Comment" in hex
  0x00, // Null separator
  0x00, // Compression flag (0 = uncompressed)
  0x00, // Compression method
  // Language tag (0 or more bytes. Unspecified here)
  0x00, // Null separator
  // Translated keyword (0 or more bytes. None here)
  0x00 // Null separator
])
function ApplyPNGComment(imgdata, arr_comment) {
  // If we reach here, then the PNG signature has already been checked
  // Next step is read the IHDR chunk length (we expect the first chunk to
  // be the IHDR chunk as enforced by specification and don't check this here!)
  const IHDR_len = imgdata.getUint32(PNG_SIGNATURE.length);

  // Calculate the position where we can splice in our comment chunk
  const splice_pos =
        PNG_SIGNATURE.length + // Length of signature at the start
        4 + // Uint32 storing the IHDR length
        4 + // Chunk Type (IHDR)
        IHDR_len + // Chunk Data for the IHDR chunk
        4; // IHDR chunk CRC

  // Split image data
  const arr_prefix = new Uint8Array(imgdata.buffer.slice(0, splice_pos));
  const arr_suffix = new Uint8Array(imgdata.buffer.slice(splice_pos));

  // Generate the required data for our new iTXt chunk
  const arr_itxtdata = new Uint8Array([...PNG_ITXT_HEADER, ...arr_comment]);
  const arr_itxtlen = new Uint8Array(4);
  new DataView(arr_itxtlen.buffer).setUint32(0, arr_itxtdata.length - 4);
  const arr_crc32 = new Uint8Array(4);
  new DataView(arr_crc32.buffer).setInt32(0, CRC32.buf(arr_itxtdata));

  // Place all the Uint8Array parts in the right order
  return new Uint8Array([...arr_prefix, ...arr_itxtlen, ...arr_itxtdata, ...arr_crc32, ...arr_suffix]);
}


//
// JPEG comment handling
//

const JPEG_COM_MARKER = new Uint8Array([0xFF, 0xFE]);
function ApplyJPEGComment(imgdata, arr_comment) {
  if (imgdata.getUint8(0) != 0xFF || imgdata.getUint8(1) != 0xD8) {
    console.log("Invalid JPEG image! Can't apply comment!");
    return new Uint8Array(imgdata.buffer);
  };

  if (imgdata.getUint8(2) != 0xFF || imgdata.getUint8(3) != 0xE0) {
    console.log("No JFIF segment in JPEG image! Can't apply comment!");
    return new Uint8Array(imgdata.buffer);
  };

  // Read JFIF segment length
  const jfif_len = imgdata.getUint16(4);

  // Calculate the position where we can splice in our comment chunk
  const splice_pos =
        4 + // Length of the 4 header bytes
        jfif_len; // Length of the JFIF segment

  // Split image data
  const arr_prefix = new Uint8Array(imgdata.buffer.slice(0, splice_pos));
  const arr_suffix = new Uint8Array(imgdata.buffer.slice(splice_pos));

  // Calculate length of our COM marker segment
  const arr_comlen = new Uint8Array(2);
  new DataView(arr_comlen.buffer).setUint16(0, arr_comment.length + 2);

  // Place all the Uint8Array parts in the right order
  return new Uint8Array([...arr_prefix, ...JPEG_COM_MARKER, ...arr_comlen, ...arr_comment, ...arr_suffix]);
}
