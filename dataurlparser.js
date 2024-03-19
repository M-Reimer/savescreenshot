/*
    Firefox addon "Save Screenshot"
    Copyright (C) 2024  Manuel Reimer <manuel.reimer@gmx.de>

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

// Parser for data: URLs
class DataURLParser {
  constructor(url) {
    // Quick and dirty data: URL splitting. Misses in depth error check but
    // we only get URLs from internal and don't deal with user supplied data.
    const [scheme, metadata, base64] = url.split(/[:,]/);
    this.mimetype = metadata.split(";")[0];

    // Decode base64
    const bytestring = atob(base64);

    // Allocate buffer
    this.buffer = new ArrayBuffer(bytestring.length);
    const bytearray = new Uint8Array(this.buffer);

    // set the bytes of the buffer to the correct values
    for (var i = 0; i < bytestring.length; i++) {
      bytearray[i] = bytestring.charCodeAt(i);
    }
  }

  arrayBuffer() {
    return this.buffer;
  }

  blob() {
    return new Blob([this.buffer], {type: this.mimetype});
  }
}
