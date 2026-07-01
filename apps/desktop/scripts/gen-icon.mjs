// Generates a 1024×1024 source PNG (bone background + dark monolith + terracotta
// fracture) with no external deps, so `tauri icon` can produce the full icon set.
import { deflateSync } from "node:zlib"
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const SIZE = 1024
const bg = [244, 239, 228, 255] // warm bone
const ink = [24, 20, 14, 255] // near-black monolith
const accent = [219, 117, 68, 255] // terracotta

function px(x, y) {
  // Monolith slab: a tall rounded slab, centered, slightly tapered at the top.
  const cx = SIZE / 2
  const topY = 170
  const botY = 872
  const halfTop = 150
  const halfBot = 168
  if (y >= topY && y <= botY) {
    const t = (y - topY) / (botY - topY)
    const half = halfTop + (halfBot - halfTop) * t
    if (Math.abs(x - cx) <= half) {
      // terracotta fracture line running down the slab with a slight kink
      const kink = y < 520 ? cx - 26 : cx - 26 + (y - 520) * 0.14
      if (Math.abs(x - kink) <= 5) return accent
      return ink
    }
  }
  return bg
}

// Build raw RGBA scanlines (filter byte 0 per row).
const raw = Buffer.alloc(SIZE * (1 + SIZE * 4))
let o = 0
for (let y = 0; y < SIZE; y++) {
  raw[o++] = 0
  for (let x = 0; x < SIZE; x++) {
    const [r, g, b, a] = px(x, y)
    raw[o++] = r
    raw[o++] = g
    raw[o++] = b
    raw[o++] = a
  }
}

// CRC32 (PNG uses it per chunk).
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, "ascii")
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
])

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src-tauri", "source-icon.png")
writeFileSync(out, png)
console.log(`wrote ${out} (${png.length} bytes)`)
