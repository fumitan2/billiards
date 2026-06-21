// 元画像（単色背景の正方形 PNG）から透過アイコンソースを作る。
//   1. 四隅から floodfill で単色背景を透過にする
//   2. 不透明領域で trim（余白を切り落とす）
//   3. 透過パディングで正方形に整える
// 出力: public/icon-source.png（中間生成物・.gitignore 対象）
import { readFileSync, writeFileSync } from 'fs'
import { decode, encode } from './png-util.mjs'

const SRC = 'public/sheep-cue.png'     // アイコン元画像（単色背景）
const OUT = 'public/icon-source.png'   // 透過ソース
const TOLERANCE = 42                   // 背景色とみなす色差のしきい値
const PAD_RATIO = 0.04                 // 正方形化時の余白（辺に対する割合）

const img = decode(readFileSync(SRC))
const { width: w, height: h, data } = img
const at = (x, y) => (y * w + x) * 4

// 背景色 = 四隅の平均。
const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)]
const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, i) => s + data[i + c], 0) / 4))
const near = (i) =>
  Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) <= TOLERANCE * 3

// 四隅起点の floodfill（4近傍）で背景連結領域だけを透過にする。
const visited = new Uint8Array(w * h)
const stack = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]
while (stack.length) {
  const [x, y] = stack.pop()
  if (x < 0 || y < 0 || x >= w || y >= h) continue
  const p = y * w + x
  if (visited[p]) continue
  visited[p] = 1
  if (!near(p * 4)) continue
  data[p * 4 + 3] = 0
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
}

// 不透明領域のバウンディングボックスで trim。
let minX = w, minY = h, maxX = -1, maxY = -1
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (data[at(x, y) + 3] > 16) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}
const cw = maxX - minX + 1
const ch = maxY - minY + 1

// 透過パディングで正方形化。
const side = Math.max(cw, ch)
const pad = Math.round(side * PAD_RATIO)
const out = side + pad * 2
const buf = new Uint8Array(out * out * 4)
const offX = pad + Math.floor((side - cw) / 2)
const offY = pad + Math.floor((side - ch) / 2)
for (let y = 0; y < ch; y++) {
  for (let x = 0; x < cw; x++) {
    const s = at(minX + x, minY + y)
    const d = ((offY + y) * out + (offX + x)) * 4
    buf[d] = data[s]; buf[d + 1] = data[s + 1]; buf[d + 2] = data[s + 2]; buf[d + 3] = data[s + 3]
  }
}

writeFileSync(OUT, encode({ width: out, height: out, data: buf }))
console.log(`prep-icon: ${SRC} (${w}x${h}) bg=rgb(${bg}) trim=${cw}x${ch} -> ${OUT} (${out}x${out})`)
