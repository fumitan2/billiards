// public/icon-source.png（透過ソース）から各サイズのアイコンを生成する。
//   pwa-192x192.png / pwa-512x512.png        … 透過（purpose: any）
//   maskable-icon-512x512.png                … 背景付き・安全領域内（purpose: maskable）
//   apple-touch-icon-180x180.png             … 背景付き（iOS は透過を黒く塗るため）
//   favicon.ico                              … 16/32/48 の PNG を内包
import { readFileSync, writeFileSync } from 'fs'
import { decode, encode, resize, flatten } from './png-util.mjs'

const SRC = 'public/icon-source.png'
const BG = [255, 248, 231] // #FFF8E7（manifest の background_color と一致）
const MASKABLE_SAFE = 0.72 // maskable のロゴ占有率（中央安全領域）

const source = decode(readFileSync(SRC))

// 透過のまま正方形リサイズ。
const square = (size) => resize(source, size, size)

// 背景色を全面に敷き、ロゴを中央 ratio に縮小配置した不透明アイコン。
function withBackground(size, ratio) {
  const inner = Math.round(size * ratio)
  const logo = resize(source, inner, inner)
  const data = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const d = i * 4
    data[d] = BG[0]; data[d + 1] = BG[1]; data[d + 2] = BG[2]; data[d + 3] = 255
  }
  const off = Math.floor((size - inner) / 2)
  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      const s = (y * inner + x) * 4
      const a = logo.data[s + 3] / 255
      const d = ((off + y) * size + (off + x)) * 4
      data[d] = Math.round(logo.data[s] * a + data[d] * (1 - a))
      data[d + 1] = Math.round(logo.data[s + 1] * a + data[d + 1] * (1 - a))
      data[d + 2] = Math.round(logo.data[s + 2] * a + data[d + 2] * (1 - a))
      data[d + 3] = 255
    }
  }
  return { width: size, height: size, data }
}

// PNG を内包する ICO バッファを組み立てる（16/32/48）。
function buildIco(sizes) {
  const images = sizes.map((s) => encode(flatten(resize(source, s, s), BG)))
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach((png, i) => {
    const e = 6 + i * 16
    header[e] = sizes[i] >= 256 ? 0 : sizes[i]
    header[e + 1] = sizes[i] >= 256 ? 0 : sizes[i]
    header[e + 2] = 0 // palette
    header[e + 3] = 0
    header.writeUInt16LE(1, e + 4) // color planes
    header.writeUInt16LE(32, e + 6) // bits per pixel
    header.writeUInt32LE(png.length, e + 8)
    header.writeUInt32LE(offset, e + 12)
    offset += png.length
  })
  return Buffer.concat([header, ...images])
}

const write = (name, buf) => {
  writeFileSync(`public/${name}`, buf)
  console.log(`  public/${name}`)
}

console.log('gen-icons:')
write('pwa-192x192.png', encode(square(192)))
write('pwa-512x512.png', encode(square(512)))
write('maskable-icon-512x512.png', encode(withBackground(512, MASKABLE_SAFE)))
write('apple-touch-icon-180x180.png', encode(flatten(square(180), BG)))
write('favicon.ico', buildIco([16, 32, 48]))
console.log('done.')
