// billiards.js — ナインボール用の軽量2D物理＆ルール（Reactに依存しない純粋ロジック）
// 座標系は「フェルト面ローカル」: 原点はテーブル左上（レール内側ではなくフェルト範囲の左上）、yは下向き。
//
// 各ボールは「order（プレイ順 1..9）」と「label（盤面の表示文字）」を持つ。
// ルールは order で動き、label は数字/英字/漢数字いずれでもよい。
// テーブルは形状（四角/円/星）ごとに「クッション線分」と「ポケット」を持ち、
// 衝突は線分ベースで統一的に処理する。

// ===== 共通定数 =====
export const RAIL = 26 // レール（木枠）の太さ（描画用）
export const R = 10 // ボール半径

export const DECEL = 460 // ころがり摩擦による減速 (units/s^2)
export const REST_WALL = 0.86 // クッション反発
export const REST_BALL = 0.95 // ボール同士の反発
export const STOP_EPS = 7 // この速さ未満で停止扱い (units/s)
export const FIXED_DT = 1 / 240 // 物理の固定ステップ
export const SHOT_MAX_SPEED = 1450 // 最大ショット速度
export const POWER_MAX_DRAG = 200 // この距離ドラッグで最大パワー

const POCKET_SIZES = { s: 15, m: 20, l: 27 }

// order（1..9）ごとのボール色（1〜8=ソリッド、9=ストライプ）。0=手球（白）。
export const BALL_COLORS = {
  0: '#fdfcf8', 1: '#f6c500', 2: '#1763b8', 3: '#e0322a', 4: '#6a2c91',
  5: '#e87211', 6: '#1f8a3b', 7: '#8a2f2f', 8: '#1a1a1a', 9: '#f6c500',
}
export const isStripe = (order) => order === 9

// ===== ラベル =====
const KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
const KANJI_OLD = ['壹', '貳', '參', '肆', '伍', '陸', '漆', '捌', '玖']

function makeLabeler(mode, caseMode) {
  if (mode === 'english') {
    const start = Math.floor(Math.random() * 18) // A..R（連続9文字がZを超えない）
    const letters = Array.from({ length: 9 }, (_, k) => String.fromCharCode(65 + start + k))
    const cased = letters.map((ch) => {
      if (caseMode === 'lower') return ch.toLowerCase()
      if (caseMode === 'mix') return Math.random() < 0.5 ? ch : ch.toLowerCase()
      return ch
    })
    return (order) => cased[order - 1]
  }
  if (mode === 'kanji') return (order) => KANJI[order - 1]
  if (mode === 'kanji-old') return (order) => KANJI_OLD[order - 1]
  return (order) => String(order)
}

export function refOf(game, order) {
  const b = game.balls.find((x) => !x.isCue && x.order === order)
  const label = b ? b.label : String(order)
  return game.mode === 'english' ? label : `${label}ばん`
}

// ===== 幾何ヘルパー =====
const len = (x, y) => Math.hypot(x, y)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function segsFromVerts(verts) {
  const segs = []
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i]
    const b = verts[(i + 1) % verts.length]
    segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }
  return segs
}

function distToSeg(px, py, s) {
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  const L2 = dx * dx + dy * dy
  const t = L2 > 0 ? clamp(((px - s.x1) * dx + (py - s.y1) * dy) / L2, 0, 1) : 0
  return len(px - (s.x1 + t * dx), py - (s.y1 + t * dy))
}

function pointInPolygon(verts, x, y) {
  let inside = false
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const xi = verts[i].x, yi = verts[i].y
    const xj = verts[j].x, yj = verts[j].y
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (hit) inside = !inside
  }
  return inside
}

// ===== ラック（9ボールのダイヤモンド） =====
// apex（index0）は手球側（下）。rows は上方向へ広がる。
function diamond(cx, apexY) {
  const rowH = Math.sqrt(3) * R
  const gap = 0.5
  const rows = [1, 2, 3, 2, 1]
  const spots = []
  rows.forEach((count, k) => {
    const y = apexY - k * (rowH + gap)
    for (let i = 0; i < count; i++) {
      spots.push({ x: cx + (i - (count - 1) / 2) * (2 * R + gap), y })
    }
  })
  return spots
}

// ===== テーブル生成 =====
export function makeTable(shape = 'rect', pocketSize = 'm') {
  const pocketR = POCKET_SIZES[pocketSize] || POCKET_SIZES.m

  if (shape === 'circle') {
    const cx = 150, cy = 150, CR = 150
    const N = 36
    const verts = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2
      return { x: cx + CR * Math.cos(a), y: cy + CR * Math.sin(a) }
    })
    const pockets = Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2
      return { x: cx + CR * Math.cos(a), y: cy + CR * Math.sin(a) }
    })
    return {
      shape, pocketR,
      cw: 2 * cx + 2 * RAIL, ch: 2 * cy + 2 * RAIL,
      segments: segsFromVerts(verts),
      pockets,
      rackSpots: diamond(cx, cy + 8),
      cueSpot: { x: cx, y: cy + 80 },
      feltKind: 'circle', feltParams: { cx, cy, r: CR },
      contains: (x, y) => len(x - cx, y - cy) <= CR - R,
    }
  }

  if (shape === 'star') {
    const cx = 150, cy = 150, outerR = 150, innerR = 78
    const verts = []
    for (let k = 0; k < 5; k++) {
      const ao = (-90 + k * 72) * (Math.PI / 180)
      const ai = (-90 + 36 + k * 72) * (Math.PI / 180)
      verts.push({ x: cx + outerR * Math.cos(ao), y: cy + outerR * Math.sin(ao) })
      verts.push({ x: cx + innerR * Math.cos(ai), y: cy + innerR * Math.sin(ai) })
    }
    const pockets = []
    for (let k = 0; k < 5; k++) {
      const ao = (-90 + k * 72) * (Math.PI / 180)
      pockets.push({ x: cx + outerR * Math.cos(ao), y: cy + outerR * Math.sin(ao) })
    }
    const segments = segsFromVerts(verts)
    return {
      shape, pocketR,
      cw: 2 * cx + 2 * RAIL, ch: 2 * cy + 2 * RAIL,
      segments,
      pockets,
      rackSpots: diamond(cx, cy),
      cueSpot: { x: cx, y: cy + 45 },
      feltKind: 'star', feltParams: { verts },
      contains: (x, y) =>
        pointInPolygon(verts, x, y) && segments.every((s) => distToSeg(x, y, s) >= R),
    }
  }

  // rect（既定）
  const W = 300, H = 510
  const verts = [
    { x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H },
  ]
  const pockets = [
    { x: 0, y: 0 }, { x: W, y: 0 }, { x: 0, y: H }, { x: W, y: H },
    { x: 0, y: H / 2 }, { x: W, y: H / 2 },
  ]
  return {
    shape: 'rect', pocketR,
    cw: W + 2 * RAIL, ch: H + 2 * RAIL,
    segments: segsFromVerts(verts),
    pockets,
    rackSpots: diamond(W / 2, H * 0.40),
    cueSpot: { x: W / 2, y: H * 0.76 },
    feltKind: 'rect', feltParams: { W, H },
    contains: (x, y) => x >= R && x <= W - R && y >= R && y <= H - R,
  }
}

// ===== ゲーム生成 =====
export function createGame(options = {}) {
  const mode = ['english', 'kanji', 'kanji-old'].includes(options.mode) ? options.mode : 'number'
  const caseMode = options.caseMode || 'upper'
  const label = makeLabeler(mode, caseMode)
  const table = makeTable(options.shape, options.pocketSize)

  const spots = table.rackSpots
  const centerIdx = 3
  const others = shuffle([2, 3, 4, 5, 6, 7, 8])
  const orders = new Array(9)
  orders[0] = 1
  orders[centerIdx] = 9
  let oi = 0
  for (let i = 0; i < 9; i++) {
    if (i === 0 || i === centerIdx) continue
    orders[i] = others[oi++]
  }
  const balls = spots.map((s, i) => {
    const order = orders[i]
    return {
      isCue: false, order, label: label(order),
      color: BALL_COLORS[order], stripe: isStripe(order),
      x: s.x, y: s.y, vx: 0, vy: 0, active: true,
    }
  })
  balls.push({
    isCue: true, order: 0, label: null, color: BALL_COLORS[0], stripe: false,
    x: table.cueSpot.x, y: table.cueSpot.y, vx: 0, vy: 0, active: false,
  })
  return {
    balls, table, mode, caseMode,
    phase: 'ballInHand',
    target: 1, shots: 0, fouls: 0,
    message: 'しろたまを おくところを タップしてね',
  }
}

export const cueBall = (game) => game.balls.find((b) => b.isCue)
export const objectBalls = (game) => game.balls.filter((b) => !b.isCue)
export const targetBall = (game) => game.balls.find((b) => !b.isCue && b.order === game.target)
export const lowestActive = (game) => {
  const live = objectBalls(game).filter((b) => b.active).map((b) => b.order)
  return live.length ? Math.min(...live) : null
}

export function canPlaceCue(game, x, y) {
  const t = game.table
  if (!t.contains(x, y)) return false
  for (const p of t.pockets) {
    if (len(x - p.x, y - p.y) < t.pocketR + R) return false
  }
  for (const b of game.balls) {
    if (b.isCue || !b.active) continue
    if (len(x - b.x, y - b.y) < 2 * R + 1) return false
  }
  return true
}

export function placeCue(game, x, y) {
  const cue = cueBall(game)
  cue.x = x
  cue.y = y
  cue.vx = 0
  cue.vy = 0
  cue.active = true
  game.phase = 'aiming'
  game.message = ''
}

// ===== 物理：1固定ステップ進める =====
export function advance(balls, dt, shotInfo, table) {
  // 1) 移動＋摩擦
  for (const b of balls) {
    if (!b.active) continue
    const sp = len(b.vx, b.vy)
    if (sp === 0) continue
    b.x += b.vx * dt
    b.y += b.vy * dt
    const ns = sp - DECEL * dt
    if (ns <= STOP_EPS) {
      b.vx = 0
      b.vy = 0
    } else {
      const f = ns / sp
      b.vx *= f
      b.vy *= f
    }
  }
  // 2) ポケット判定（クッションより先に）
  for (const b of balls) {
    if (!b.active) continue
    for (const p of table.pockets) {
      if (len(b.x - p.x, b.y - p.y) < table.pocketR) {
        b.active = false
        b.vx = 0
        b.vy = 0
        shotInfo.pocketed.push(b.order)
        break
      }
    }
  }
  // 3) クッション（線分）反射
  for (const b of balls) {
    if (!b.active) continue
    for (const s of table.segments) {
      const dx = s.x2 - s.x1
      const dy = s.y2 - s.y1
      const L2 = dx * dx + dy * dy
      const t = L2 > 0 ? clamp(((b.x - s.x1) * dx + (b.y - s.y1) * dy) / L2, 0, 1) : 0
      const cxp = s.x1 + t * dx
      const cyp = s.y1 + t * dy
      let nx = b.x - cxp
      let ny = b.y - cyp
      const d = len(nx, ny)
      if (d >= R || d === 0) continue
      nx /= d
      ny /= d
      b.x = cxp + nx * R
      b.y = cyp + ny * R
      const vn = b.vx * nx + b.vy * ny
      if (vn < 0) {
        b.vx -= (1 + REST_WALL) * vn * nx
        b.vy -= (1 + REST_WALL) * vn * ny
      }
    }
  }
  // 4) ボール同士の衝突（等質量・弾性）
  for (let i = 0; i < balls.length; i++) {
    const a = balls[i]
    if (!a.active) continue
    for (let j = i + 1; j < balls.length; j++) {
      const b = balls[j]
      if (!b.active) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = len(dx, dy)
      if (d >= 2 * R || d === 0) continue
      const nx = dx / d
      const ny = dy / d
      const overlap = 2 * R - d
      a.x -= (nx * overlap) / 2
      a.y -= (ny * overlap) / 2
      b.x += (nx * overlap) / 2
      b.y += (ny * overlap) / 2
      const vRel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny
      if (vRel <= 0) continue
      const imp = ((1 + REST_BALL) / 2) * vRel
      a.vx -= imp * nx
      a.vy -= imp * ny
      b.vx += imp * nx
      b.vy += imp * ny
      if (shotInfo.firstHit === null && (a.isCue || b.isCue)) {
        shotInfo.firstHit = a.isCue ? b.order : a.order
      }
    }
  }
}

export function allStopped(balls) {
  for (const b of balls) {
    if (b.active && (b.vx !== 0 || b.vy !== 0)) return false
  }
  return true
}

function findRespot(game) {
  const t = game.table
  const cands = [...t.rackSpots, t.cueSpot]
  for (const c of cands) {
    if (canPlaceCue(game, c.x, c.y)) return c
  }
  return t.cueSpot
}

// ===== ショット解決 =====
export function resolveShot(game, shotInfo) {
  game.shots += 1
  const cue = cueBall(game)
  const target = game.target
  const targetRef = refOf(game, target)
  const scratch = !cue.active
  const pocketed9 = shotInfo.pocketed.includes(9)
  const wrongFirst = shotInfo.firstHit !== null && shotInfo.firstHit !== target
  const noHit = shotInfo.firstHit === null
  const foul = scratch || wrongFirst || noHit
  const pottedAny = shotInfo.pocketed.some((o) => o > 0)

  if (pocketed9) {
    if (!foul) {
      game.phase = 'won'
      game.message = `🏆 ${refOf(game, 9)} イン！クリア！`
      return game
    }
    const nine = game.balls.find((b) => b.order === 9 && !b.isCue)
    const spot = findRespot(game)
    nine.x = spot.x
    nine.y = spot.y
    nine.active = true
  }

  game.target = lowestActive(game) ?? 9

  if (foul) {
    game.fouls += 1
    cue.active = false
    game.phase = 'ballInHand'
    if (scratch) game.message = 'ファウル！しろたまを おきなおしてね'
    else if (wrongFirst) game.message = `ファウル！${targetRef}に さきに あてよう`
    else game.message = 'ファウル！どれにも あたらなかったよ'
    return game
  }

  game.phase = 'aiming'
  game.message = pottedAny ? 'ナイスイン！つぎを ねらおう' : `${refOf(game, game.target)}を ねらおう`
  return game
}

export function aimFromDrag(cue, px, py) {
  const dx = cue.x - px
  const dy = cue.y - py
  const d = len(dx, dy)
  if (d < 1) return { power: 0, dirx: 0, diry: 0, dist: 0 }
  const ratio = Math.min(d / POWER_MAX_DRAG, 1)
  return { power: ratio, dirx: dx / d, diry: dy / d, dist: d }
}
