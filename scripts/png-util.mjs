// 依存ライブラリなしの PNG ユーティリティ（Node 標準 zlib のみ使用）。
// decode / encode（colorType 6 = RGBA）/ 高品質な面積平均リサイズを提供する。
import zlib from 'zlib'

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// --- CRC32（PNG チャンク用） ---
const CRC_TABLE = (() => {
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
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

// PNG バッファを { width, height, data(RGBA Uint8Array) } にデコードする。
// 対応: bitDepth 8、colorType 0/2/4/6、interlace なし（子ども向けアプリのアイコン素材で十分）。
export function decode(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG')
  let p = 8
  let width, height, colorType
  const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p)
    const type = buf.toString('ascii', p + 4, p + 8)
    const data = buf.subarray(p + 8, p + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      const bitDepth = data[8]
      colorType = data[9]
      if (bitDepth !== 8) throw new Error('only 8-bit PNG supported')
      if (data[12] !== 0) throw new Error('interlaced PNG not supported')
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') break
    p += 12 + len
  }
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * ch
  const lines = Buffer.alloc(height * stride)
  let pos = 0
  for (let y = 0; y < height; y++) {
    const ft = raw[pos++]
    for (let x = 0; x < stride; x++) {
      const v = raw[pos++]
      const a = x >= ch ? lines[y * stride + x - ch] : 0
      const b = y > 0 ? lines[(y - 1) * stride + x] : 0
      const c = x >= ch && y > 0 ? lines[(y - 1) * stride + x - ch] : 0
      let r
      switch (ft) {
        case 0: r = v; break
        case 1: r = v + a; break
        case 2: r = v + b; break
        case 3: r = v + ((a + b) >> 1); break
        case 4: r = v + paeth(a, b, c); break
        default: throw new Error('bad filter ' + ft)
      }
      lines[y * stride + x] = r & 0xff
    }
  }
  // 何が来ても RGBA に正規化する。
  const out = new Uint8Array(width * height * 4)
  for (let i = 0, n = width * height; i < n; i++) {
    const s = i * ch
    let r, g, b, a
    if (ch === 1) { r = g = b = lines[s]; a = 255 }
    else if (ch === 2) { r = g = b = lines[s]; a = lines[s + 1] }
    else if (ch === 3) { r = lines[s]; g = lines[s + 1]; b = lines[s + 2]; a = 255 }
    else { r = lines[s]; g = lines[s + 1]; b = lines[s + 2]; a = lines[s + 3] }
    const d = i * 4
    out[d] = r; out[d + 1] = g; out[d + 2] = b; out[d + 3] = a
  }
  return { width, height, data: out }
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

// { width, height, data(RGBA) } を colorType 6 の PNG バッファにエンコードする。
export function encode({ width, height, data }) {
  const stride = width * 4
  const raw = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter type 0（None）
    for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = data[y * stride + x]
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// 面積平均（box）リサイズ。アルファで重み付けして色を合成するため、透過縁に黒フリンジが出ない。
export function resize(img, dw, dh) {
  const { width: sw, height: sh, data: src } = img
  const out = new Uint8Array(dw * dh * 4)
  for (let dy = 0; dy < dh; dy++) {
    const sy0 = (dy * sh) / dh
    const sy1 = ((dy + 1) * sh) / dh
    for (let dx = 0; dx < dw; dx++) {
      const sx0 = (dx * sw) / dw
      const sx1 = ((dx + 1) * sw) / dw
      let ar = 0, ag = 0, ab = 0, aa = 0, wsum = 0
      for (let y = Math.floor(sy0); y < Math.ceil(sy1); y++) {
        const wy = Math.min(sy1, y + 1) - Math.max(sy0, y)
        for (let x = Math.floor(sx0); x < Math.ceil(sx1); x++) {
          const wx = Math.min(sx1, x + 1) - Math.max(sx0, x)
          const w = wx * wy
          const s = (y * sw + x) * 4
          const a = src[s + 3]
          ar += src[s] * a * w
          ag += src[s + 1] * a * w
          ab += src[s + 2] * a * w
          aa += a * w
          wsum += w
        }
      }
      const d = (dy * dw + dx) * 4
      if (aa > 0) {
        out[d] = Math.round(ar / aa)
        out[d + 1] = Math.round(ag / aa)
        out[d + 2] = Math.round(ab / aa)
      }
      out[d + 3] = Math.round(aa / wsum)
    }
  }
  return { width: dw, height: dh, data: out }
}

// 単色背景の上に img を中央合成して、不透明な正方形 RGBA を返す（maskable 用）。
export function flatten(img, bg) {
  const { width, height, data } = img
  const out = new Uint8Array(width * height * 4)
  for (let i = 0, n = width * height; i < n; i++) {
    const s = i * 4
    const a = data[s + 3] / 255
    out[s] = Math.round(data[s] * a + bg[0] * (1 - a))
    out[s + 1] = Math.round(data[s + 1] * a + bg[1] * (1 - a))
    out[s + 2] = Math.round(data[s + 2] * a + bg[2] * (1 - a))
    out[s + 3] = 255
  }
  return { width, height, data: out }
}
