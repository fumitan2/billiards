import { useEffect, useRef, useState } from 'react'
import {
  PW, PH, R, RAIL, POCKET_R, POCKETS, BALL_COLORS, isStripe,
  SHOT_MAX_SPEED, FIXED_DT,
  createGame, cueBall, canPlaceCue, placeCue, advance, allStopped, resolveShot, aimFromDrag,
} from './billiards.js'

const APP_VERSION = __APP_VERSION__
const APP_NAME = 'ナインボール'
const THEME_COLOR = '#1565c0'
const FELT_GREEN = '#1f7a44'
const RAIL_WOOD = '#6d4726'

const TW = PW + 2 * RAIL
const TH = PH + 2 * RAIL

// ===== 小物 =====
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function lerpColor(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)]
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)]
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

// ===== Canvas 描画 =====
function drawBall(ctx, x, y, n) {
  const color = BALL_COLORS[n]
  // 影
  ctx.beginPath()
  ctx.ellipse(x, y + R * 0.55, R * 0.95, R * 0.55, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.fill()
  // ベース
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, R, 0, Math.PI * 2)
  ctx.clip()
  if (isStripe(n)) {
    ctx.fillStyle = '#fdfcf8'
    ctx.fillRect(x - R, y - R, 2 * R, 2 * R)
    ctx.fillStyle = color
    ctx.fillRect(x - R, y - R * 0.58, 2 * R, R * 1.16)
  } else {
    ctx.fillStyle = color
    ctx.fillRect(x - R, y - R, 2 * R, 2 * R)
  }
  // 光沢
  const g = ctx.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R)
  g.addColorStop(0, 'rgba(255,255,255,0.6)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.12)')
  g.addColorStop(1, 'rgba(0,0,0,0.24)')
  ctx.fillStyle = g
  ctx.fillRect(x - R, y - R, 2 * R, 2 * R)
  ctx.restore()
  // 数字
  if (n !== 0) {
    ctx.beginPath()
    ctx.arc(x, y, R * 0.52, 0, Math.PI * 2)
    ctx.fillStyle = '#fdfcf8'
    ctx.fill()
    ctx.fillStyle = '#1a1a2e'
    ctx.font = `800 ${R * 0.72}px 'Nunito', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), x, y + R * 0.06)
  }
  // 輪郭
  ctx.beginPath()
  ctx.arc(x, y, R, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawAim(ctx, cue, aim) {
  const cx = cue.x + RAIL
  const cy = cue.y + RAIL
  const { dirx, diry, power } = aim
  // 予測ライン
  const L = 30 + power * 240
  ctx.save()
  ctx.setLineDash([8, 9])
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx + dirx * (R + 2), cy + diry * (R + 2))
  ctx.lineTo(cx + dirx * (R + L), cy + diry * (R + L))
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.arc(cx + dirx * (R + L), cy + diry * (R + L), 5, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
  // キュー（うしろに引く）
  const back = R + 8 + power * 36
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#d8b35a'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(cx - dirx * back, cy - diry * back)
  ctx.lineTo(cx - dirx * (back + 150), cy - diry * (back + 150))
  ctx.stroke()
  ctx.strokeStyle = '#7a4a22'
  ctx.beginPath()
  ctx.moveTo(cx - dirx * (back + 120), cy - diry * (back + 120))
  ctx.lineTo(cx - dirx * (back + 150), cy - diry * (back + 150))
  ctx.stroke()
  // パワーメーター（フェルト下部）
  const barW = PW * 0.6
  const bx = RAIL + (PW - barW) / 2
  const by = RAIL + PH - 14
  roundRect(ctx, bx, by, barW, 8, 4)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fill()
  if (power > 0) {
    roundRect(ctx, bx, by, barW * power, 8, 4)
    ctx.fillStyle = lerpColor('#4caf50', '#f44336', power)
    ctx.fill()
  }
}

// 手球プレースのゴースト
function drawGhost(ctx, x, y, ok) {
  ctx.save()
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.arc(x + RAIL, y + RAIL, R, 0, Math.PI * 2)
  ctx.fillStyle = ok ? '#fdfcf8' : '#f44336'
  ctx.fill()
  ctx.strokeStyle = ok ? '#1565c0' : '#b71c1c'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

// ===== ボールチップ（UI内のターゲット表示）=====
function BallChip({ n, size = 28 }) {
  const color = BALL_COLORS[n]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: isStripe(n) ? `linear-gradient(#fff 30%, ${color} 30%, ${color} 70%, #fff 70%)` : color,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        verticalAlign: 'middle',
      }}
    >
      <span
        style={{
          width: size * 0.56,
          height: size * 0.56,
          borderRadius: '50%',
          background: '#fdfcf8',
          color: '#1a1a2e',
          fontSize: size * 0.42,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {n}
      </span>
    </span>
  )
}

const styles = {
  container: {
    minHeight: '100dvh',
    backgroundColor: '#FFF8E7',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Nunito', sans-serif",
    maxWidth: 480,
    margin: '0 auto',
  },
  header: {
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 4px',
  },
  headerTitle: { fontSize: 22, fontWeight: 800, color: '#1a1a2e', flex: 1 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 16px',
    gap: 8,
  },
  targetBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 800,
    color: '#1a1a2e',
  },
  counter: { fontSize: 14, fontWeight: 700, color: '#666' },
  message: {
    minHeight: 24,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 800,
    color: THEME_COLOR,
    padding: '0 16px',
  },
  canvasWrap: { padding: '4px 12px 12px', display: 'flex', justifyContent: 'center' },
  canvas: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
    touchAction: 'none',
    display: 'block',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  modalTitle: { fontSize: 20, fontWeight: 800, marginBottom: 16, color: '#1a1a2e' },
  modalText: { fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 8 },
  closeBtn: {
    marginTop: 20,
    width: '100%',
    padding: 12,
    backgroundColor: THEME_COLOR,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    minHeight: 44,
  },
  versionText: { fontSize: 13, color: '#aaa', marginTop: 16, textAlign: 'right' },
  bigBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    border: 'none',
    background: THEME_COLOR,
    color: 'white',
    fontSize: 20,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
    minHeight: 64,
  },
  winCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    textAlign: 'center',
  },
}

function GuideModal({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalTitle}>あそびかた</div>
        <p style={styles.modalText}>🎱 1ばんから じゅんばんに ボールを ポケットに いれて、さいごに 9ばんを いれたら クリア！</p>
        <p style={styles.modalText}>① しろたまを おくところを <b>タップ</b></p>
        <p style={styles.modalText}>② がめんを <b>ドラッグ</b>して むき と つよさを きめる（うしろに ひくほど つよい）</p>
        <p style={styles.modalText}>③ ゆびを <b>はなす</b>と ショット！</p>
        <p style={styles.modalText}>つぎに ねらう ボールは うえに でるよ。</p>
        <button style={styles.closeBtn} onClick={onClose}>とじる</button>
      </div>
    </div>
  )
}

function SettingsModal({ onClose, onReset }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalTitle}>せってい</div>
        <button style={{ ...styles.closeBtn, backgroundColor: '#f4511e', marginTop: 0 }} onClick={onReset}>
          さいしょから やりなおす
        </button>
        <p style={styles.versionText}>v{APP_VERSION}</p>
        <button style={styles.closeBtn} onClick={onClose}>とじる</button>
      </div>
    </div>
  )
}

export default function App() {
  const canvasRef = useRef(null)
  const gameRef = useRef(createGame())
  const aimRef = useRef(null)
  const ghostRef = useRef(null)

  const [showGuide, setShowGuide] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [ui, setUi] = useState({ phase: 'ballInHand', target: 1, message: '', shots: 0, fouls: 0 })

  const syncUI = () => {
    const g = gameRef.current
    setUi({ phase: g.phase, target: g.target, message: g.message, shots: g.shots, fouls: g.fouls })
  }

  const resetGame = () => {
    gameRef.current = createGame()
    aimRef.current = null
    ghostRef.current = null
    syncUI()
    setShowSettings(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    let raf
    let acc = 0
    let lastT = performance.now()
    let dragging = false
    let shotInfo = null

    // 描画サイズ調整
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const cssW = canvas.clientWidth
      const cssH = cssW * (TH / TW)
      canvas.style.height = `${cssH}px`
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
    }

    const toFelt = (e) => {
      const rect = canvas.getBoundingClientRect()
      const tx = ((e.clientX - rect.left) / rect.width) * TW
      const ty = ((e.clientY - rect.top) / rect.height) * TH
      return { x: tx - RAIL, y: ty - RAIL }
    }

    const render = () => {
      const ctx = canvas.getContext('2d')
      ctx.setTransform(canvas.width / TW, 0, 0, canvas.height / TH, 0, 0)
      ctx.clearRect(0, 0, TW, TH)
      // レール（木枠）
      roundRect(ctx, 0, 0, TW, TH, RAIL * 0.7)
      ctx.fillStyle = RAIL_WOOD
      ctx.fill()
      roundRect(ctx, 4, 4, TW - 8, TH - 8, RAIL * 0.5)
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'
      ctx.lineWidth = 2
      ctx.stroke()
      // フェルト
      roundRect(ctx, RAIL, RAIL, PW, PH, 10)
      ctx.fillStyle = FELT_GREEN
      ctx.fill()
      // ポケット
      for (const p of POCKETS) {
        ctx.beginPath()
        ctx.arc(p.x + RAIL, p.y + RAIL, POCKET_R * 1.05, 0, Math.PI * 2)
        ctx.fillStyle = '#14141a'
        ctx.fill()
      }
      const g = gameRef.current
      // 照準
      if (g.phase === 'aiming' && aimRef.current && aimRef.current.power > 0) {
        drawAim(ctx, cueBall(g), aimRef.current)
      }
      // ゴースト（手球配置）
      if (g.phase === 'ballInHand' && ghostRef.current) {
        drawGhost(ctx, ghostRef.current.x, ghostRef.current.y, ghostRef.current.ok)
      }
      // ボール
      for (const b of g.balls) {
        if (b.active) drawBall(ctx, b.x + RAIL, b.y + RAIL, b.n)
      }
    }

    const frame = (t) => {
      const g = gameRef.current
      const dt = Math.min((t - lastT) / 1000, 0.05)
      lastT = t
      if (g.phase === 'shooting') {
        acc += dt
        while (acc >= FIXED_DT) {
          advance(g.balls, FIXED_DT, shotInfo)
          acc -= FIXED_DT
        }
        if (allStopped(g.balls)) {
          resolveShot(g, shotInfo)
          shotInfo = null
          syncUI()
        }
      }
      render()
      raf = requestAnimationFrame(frame)
    }

    const onDown = (e) => {
      const g = gameRef.current
      const p = toFelt(e)
      if (g.phase === 'ballInHand') {
        if (canPlaceCue(g, p.x, p.y)) {
          placeCue(g, p.x, p.y)
          ghostRef.current = null
          syncUI()
        }
        return
      }
      if (g.phase === 'aiming') {
        dragging = true
        canvas.setPointerCapture?.(e.pointerId)
        aimRef.current = aimFromDrag(cueBall(g), p.x, p.y)
      }
    }

    const onMove = (e) => {
      const g = gameRef.current
      const p = toFelt(e)
      if (g.phase === 'ballInHand') {
        ghostRef.current = { x: p.x, y: p.y, ok: canPlaceCue(g, p.x, p.y) }
        return
      }
      if (g.phase === 'aiming' && dragging) {
        aimRef.current = aimFromDrag(cueBall(g), p.x, p.y)
      }
    }

    const onUp = (e) => {
      const g = gameRef.current
      if (g.phase === 'aiming' && dragging) {
        dragging = false
        canvas.releasePointerCapture?.(e.pointerId)
        const aim = aimRef.current
        if (aim && aim.power > 0.06) {
          const cue = cueBall(g)
          const speed = aim.power * SHOT_MAX_SPEED
          cue.vx = aim.dirx * speed
          cue.vy = aim.diry * speed
          shotInfo = { firstHit: null, pocketed: [] }
          acc = 0
          g.phase = 'shooting'
          g.message = ''
          aimRef.current = null
          syncUI()
        } else {
          aimRef.current = null
        }
      }
    }

    fit()
    render()
    raf = requestAnimationFrame(frame)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    window.addEventListener('resize', fit)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      window.removeEventListener('resize', fit)
    }
  }, [])

  const hint =
    ui.phase === 'ballInHand'
      ? 'しろたまを おくところを タップしてね'
      : ui.phase === 'aiming'
        ? 'ドラッグして ねらって、はなして ショット！'
        : ui.phase === 'shooting'
          ? 'ころがり中…'
          : ''

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <span style={styles.headerTitle}>{APP_NAME}</span>
        <button style={styles.iconBtn} onClick={() => setShowGuide(true)} aria-label="あそびかた">ℹ️</button>
        <button style={styles.iconBtn} onClick={() => setShowSettings(true)} aria-label="せってい">⚙️</button>
      </header>

      <div style={styles.statusBar}>
        <div style={styles.targetBox}>
          <span>ねらう</span>
          <BallChip n={ui.target} />
        </div>
        <div style={styles.counter}>ショット {ui.shots}・ファウル {ui.fouls}</div>
      </div>

      <div style={styles.message}>{ui.message || hint}</div>

      <div style={styles.canvasWrap}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onReset={resetGame} />}

      {ui.phase === 'won' && (
        <div style={styles.overlay}>
          <div style={styles.winCard}>
            <div style={{ fontSize: 56 }}>🏆</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '8px 0' }}>クリア！</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#666', marginBottom: 20 }}>
              {ui.shots} ショット・ファウル {ui.fouls}かい
            </div>
            <button style={styles.bigBtn} onClick={resetGame}>もういちど</button>
          </div>
        </div>
      )}
    </div>
  )
}
