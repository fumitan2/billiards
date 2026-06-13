// billiards.js — ナインボール用の軽量2D物理＆ルール（Reactに依存しない純粋ロジック）
// 座標系は「フェルト面ローカル」: x ∈ [0, PW], y ∈ [0, PH]、原点は左上、yは下向き。
//
// 各ボールは「order（プレイ順 1..9）」と「label（盤面の表示文字）」を持つ。
// ルールは order で動き、label は数字 "1".."9" でも英字 "A".."N" でもよい。

// ===== テーブル定数（論理単位）=====
export const PW = 300 // フェルト幅
export const PH = 560 // フェルト高さ
export const RAIL = 26 // レール（クッション枠）の太さ
export const R = 10 // ボール半径
export const POCKET_R = 20 // ポケットの吸い込み半径

// 物理定数
export const DECEL = 460 // ころがり摩擦による減速 (units/s^2)
export const REST_WALL = 0.86 // クッション反発
export const REST_BALL = 0.95 // ボール同士の反発
export const STOP_EPS = 7 // この速さ未満で停止扱い (units/s)
export const FIXED_DT = 1 / 240 // 物理の固定ステップ
export const SHOT_MAX_SPEED = 1450 // 最大ショット速度
export const POWER_MAX_DRAG = 200 // この距離ドラッグで最大パワー

// ポケット位置（4隅 + 長辺の中央2つ）
export const POCKETS = [
  { x: 0, y: 0 },
  { x: PW, y: 0 },
  { x: 0, y: PH },
  { x: PW, y: PH },
  { x: 0, y: PH / 2 },
  { x: PW, y: PH / 2 },
]

// order（1..9）ごとのボール色（1〜8=ソリッド、9=ストライプ）。0=手球（白）。
export const BALL_COLORS = {
  0: '#fdfcf8',
  1: '#f6c500',
  2: '#1763b8',
  3: '#e0322a',
  4: '#6a2c91',
  5: '#e87211',
  6: '#1f8a3b',
  7: '#8a2f2f',
  8: '#1a1a1a',
  9: '#f6c500', // ストライプ
}
export const isStripe = (order) => order === 9

// ===== ベクトル小物 =====
const len = (x, y) => Math.hypot(x, y)

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ===== ラベル生成 =====
// 英語モード：開始文字をランダムに選び、そこから連続9文字（order 1..9 に対応）。
// 開始は A..R（index 0..17）に限定して Z を超えないようにする。
function makeLabeler(mode, caseMode) {
  if (mode !== 'english') {
    return (order) => String(order)
  }
  const start = Math.floor(Math.random() * 18) // A..R
  const letters = Array.from({ length: 9 }, (_, k) => String.fromCharCode(65 + start + k))
  const cased = letters.map((ch) => {
    if (caseMode === 'lower') return ch.toLowerCase()
    if (caseMode === 'mix') return Math.random() < 0.5 ? ch : ch.toLowerCase()
    return ch // upper
  })
  return (order) => cased[order - 1]
}

// order を人が読む参照（メッセージ用）。数字は「Nばん」、英語はそのまま。
export function refOf(game, order) {
  const b = game.balls.find((x) => !x.isCue && x.order === order)
  const label = b ? b.label : String(order)
  return game.mode === 'english' ? label : `${label}ばん`
}

// ===== ラック生成（9ボールのダイヤモンド）=====
function rackPositions() {
  const cx = PW / 2
  const apexY = PH * 0.40
  const rowH = Math.sqrt(3) * R
  const gap = 0.5
  const rows = [1, 2, 3, 2, 1]
  const spots = []
  rows.forEach((count, k) => {
    const y = apexY - k * (rowH + gap)
    for (let i = 0; i < count; i++) {
      const x = cx + (i - (count - 1) / 2) * (2 * R + gap)
      spots.push({ x, y })
    }
  })
  return spots
}

export function createGame(options = {}) {
  const mode = options.mode === 'english' ? 'english' : 'number'
  const caseMode = options.caseMode || 'upper'
  const label = makeLabeler(mode, caseMode)

  const spots = rackPositions()
  const centerIdx = 3 // 頂点=0、中央行の真ん中=3
  const others = shuffle([2, 3, 4, 5, 6, 7, 8])
  const orders = new Array(9)
  orders[0] = 1 // 頂点＝最初に狙う
  orders[centerIdx] = 9 // 中央＝最後（マネーボール）
  let oi = 0
  for (let i = 0; i < 9; i++) {
    if (i === 0 || i === centerIdx) continue
    orders[i] = others[oi++]
  }
  const balls = spots.map((s, i) => {
    const order = orders[i]
    return {
      isCue: false,
      order,
      label: label(order),
      color: BALL_COLORS[order],
      stripe: isStripe(order),
      x: s.x,
      y: s.y,
      vx: 0,
      vy: 0,
      active: true,
    }
  })
  // 手球（未配置）
  balls.push({
    isCue: true,
    order: 0,
    label: null,
    color: BALL_COLORS[0],
    stripe: false,
    x: PW / 2,
    y: PH * 0.78,
    vx: 0,
    vy: 0,
    active: false,
  })
  return {
    balls,
    mode,
    caseMode,
    phase: 'ballInHand', // ballInHand | aiming | shooting | won
    target: 1,
    shots: 0,
    fouls: 0,
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
  if (x < R || x > PW - R || y < R || y > PH - R) return false
  for (const p of POCKETS) {
    if (len(x - p.x, y - p.y) < POCKET_R + R) return false
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
// shotInfo = { firstHit: order|null, pocketed: order[] }
export function advance(balls, dt, shotInfo) {
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
  for (const b of balls) {
    if (!b.active) continue
    for (const p of POCKETS) {
      if (len(b.x - p.x, b.y - p.y) < POCKET_R) {
        b.active = false
        b.vx = 0
        b.vy = 0
        shotInfo.pocketed.push(b.order)
        break
      }
    }
  }
  for (const b of balls) {
    if (!b.active) continue
    if (b.x < R) {
      b.x = R
      b.vx = -b.vx * REST_WALL
    } else if (b.x > PW - R) {
      b.x = PW - R
      b.vx = -b.vx * REST_WALL
    }
    if (b.y < R) {
      b.y = R
      b.vy = -b.vy * REST_WALL
    } else if (b.y > PH - R) {
      b.y = PH - R
      b.vy = -b.vy * REST_WALL
    }
  }
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

function findFreeSpot(game, startX, startY) {
  for (let step = 0; step < 60; step++) {
    const y = startY + step * (2 * R)
    if (y > PH - R) break
    if (canPlaceCue(game, startX, y)) return { x: startX, y }
  }
  return { x: startX, y: startY }
}

// ===== ショット解決：phase と message を更新して返す =====
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
    const spot = findFreeSpot(game, PW / 2, PH * 0.25)
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

// ドラッグ量からショットのベクトルを計算（スリングショット式：引いた逆向きに飛ぶ）
export function aimFromDrag(cue, px, py) {
  const dx = cue.x - px
  const dy = cue.y - py
  const d = len(dx, dy)
  if (d < 1) return { power: 0, dirx: 0, diry: 0, dist: 0 }
  const ratio = Math.min(d / POWER_MAX_DRAG, 1)
  return { power: ratio, dirx: dx / d, diry: dy / d, dist: d }
}
