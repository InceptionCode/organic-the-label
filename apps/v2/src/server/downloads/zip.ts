import { deflateRawSync } from 'node:zlib'

// Minimal ZIP writer for the legacy composition download (two files: audio and terms). Replaces v1's
// `fflate` with Node's built-in zlib, so v2 adds no dependency. Deflate per entry, no ZIP64 (the
// route caps the payload at 100 MB, far below the 4 GB limit), UTF-8 names (general purpose bit 11).

export type ZipEntry = { name: string; data: Uint8Array }

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** MS-DOS date and time fields for the local and central headers. */
function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getUTCFullYear())
  return {
    time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  }
}

export function createZip(entries: ZipEntry[], { level = 6, now = new Date() }: { level?: number; now?: Date } = {}): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder()
  const { time, date } = dosDateTime(now)
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const deflated = new Uint8Array(deflateRawSync(entry.data, { level }))
    // Store when deflate does not help (already compressed audio).
    const stored = deflated.byteLength >= entry.data.byteLength
    const body = stored ? entry.data : deflated
    const method = stored ? 0 : 8
    const crc = crc32(entry.data)

    const local = new Uint8Array(30 + name.byteLength)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true) // version needed
    lv.setUint16(6, 0x0800, true) // UTF-8 names
    lv.setUint16(8, method, true)
    lv.setUint16(10, time, true)
    lv.setUint16(12, date, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, body.byteLength, true)
    lv.setUint32(22, entry.data.byteLength, true)
    lv.setUint16(26, name.byteLength, true)
    lv.setUint16(28, 0, true)
    local.set(name, 30)

    const central = new Uint8Array(46 + name.byteLength)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true) // version made by
    cv.setUint16(6, 20, true) // version needed
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, method, true)
    cv.setUint16(12, time, true)
    cv.setUint16(14, date, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, body.byteLength, true)
    cv.setUint32(24, entry.data.byteLength, true)
    cv.setUint16(28, name.byteLength, true)
    // extra, comment, disk start, internal and external attributes stay 0
    cv.setUint32(42, offset, true)
    central.set(name, 46)

    locals.push(local, body)
    centrals.push(central)
    offset += local.byteLength + body.byteLength
  }

  const centralSize = centrals.reduce((n, c) => n + c.byteLength, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)

  const out = new Uint8Array(offset + centralSize + end.byteLength)
  let at = 0
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at)
    at += part.byteLength
  }
  return out
}
