import { useId, useState } from 'react'

const APP_VERSION = __APP_VERSION__
const APP_NAME = 'アルファベットたまクイズ'
const THEME_COLOR = '#1565c0'
const BATTLE_COLOR = '#e91e63'

const SOLO_QUESTIONS = 10
const BATTLE_QUESTIONS_PER_ROUND = 3

// ===== アルファベットデータ（色は固定割り当て、A〜M=ソリッド / N〜Z=ストライプ） =====
const BALLS = [
  { letter: 'A', reading: 'エー', color: '#e53935' },
  { letter: 'B', reading: 'ビー', color: '#1e88e5' },
  { letter: 'C', reading: 'シー', color: '#fdd835' },
  { letter: 'D', reading: 'ディー', color: '#8e24aa' },
  { letter: 'E', reading: 'イー', color: '#fb8c00' },
  { letter: 'F', reading: 'エフ', color: '#43a047' },
  { letter: 'G', reading: 'ジー', color: '#6d4c41' },
  { letter: 'H', reading: 'エイチ', color: '#d81b60' },
  { letter: 'I', reading: 'アイ', color: '#00acc1' },
  { letter: 'J', reading: 'ジェー', color: '#3949ab' },
  { letter: 'K', reading: 'ケー', color: '#7cb342' },
  { letter: 'L', reading: 'エル', color: '#f4511e' },
  { letter: 'M', reading: 'エム', color: '#5e35b1' },
  { letter: 'N', reading: 'エヌ', color: '#c62828' },
  { letter: 'O', reading: 'オー', color: '#1565c0' },
  { letter: 'P', reading: 'ピー', color: '#f9a825' },
  { letter: 'Q', reading: 'キュー', color: '#00897b' },
  { letter: 'R', reading: 'アール', color: '#ad1457' },
  { letter: 'S', reading: 'エス', color: '#558b2f' },
  { letter: 'T', reading: 'ティー', color: '#ef6c00' },
  { letter: 'U', reading: 'ユー', color: '#4527a0' },
  { letter: 'V', reading: 'ブイ', color: '#0277bd' },
  { letter: 'W', reading: 'ダブリュー', color: '#9e9d24' },
  { letter: 'X', reading: 'エックス', color: '#6a1b9a' },
  { letter: 'Y', reading: 'ワイ', color: '#00838f' },
  { letter: 'Z', reading: 'ゼット', color: '#37474f' },
]
const BALL_MAP = Object.fromEntries(BALLS.map(b => [b.letter, b]))
const isStripe = (letter) => letter >= 'N'

// ===== ビリヤードボール SVG コンポーネント =====
function BilliardBall({ char, size = 110 }) {
  const uid = useId()
  const letter = char.toUpperCase()
  const { color } = BALL_MAP[letter]
  const stripe = isStripe(letter)
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={char}>
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="47" />
        </clipPath>
        <radialGradient id={`${uid}-shine`} cx="0.35" cy="0.28" r="0.85">
          <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${uid}-clip)`}>
        <rect x="0" y="0" width="100" height="100" fill={stripe ? '#fdfcf5' : color} />
        {stripe && <rect x="0" y="25" width="100" height="50" fill={color} />}
      </g>
      <circle cx="50" cy="50" r="21" fill="#fdfcf5" />
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="30"
        fontWeight="800"
        fontFamily="'Nunito', sans-serif"
        fill="#1a1a2e"
      >
        {char}
      </text>
      <circle cx="50" cy="50" r="47" fill={`url(#${uid}-shine)`} />
      <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
    </svg>
  )
}

// ===== 問題生成 =====
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function charFor(letter, difficulty) {
  if (difficulty === 'easy') return letter
  if (difficulty === 'hard') return letter.toLowerCase()
  return Math.random() < 0.5 ? letter : letter.toLowerCase()
}

function makeQuestions(count, qtype, difficulty) {
  const questions = []
  let prev = null
  for (let i = 0; i < count; i++) {
    let letter
    do {
      letter = BALLS[Math.floor(Math.random() * BALLS.length)].letter
    } while (letter === prev)
    prev = letter
    const wrongs = shuffle(BALLS.filter(b => b.letter !== letter)).slice(0, 3)
    const options = shuffle([letter, ...wrongs.map(b => b.letter)]).map(l => ({
      letter: l,
      char: charFor(l, difficulty),
    }))
    questions.push({
      qtype: qtype === 'mix' ? (Math.random() < 0.5 ? 'b2m' : 'm2b') : qtype,
      letter,
      char: charFor(letter, difficulty),
      options,
    })
  }
  return questions
}

// ===== スタイル =====
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
    padding: '16px',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#1a1a2e',
    flex: 1,
  },
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
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 16px 24px',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  bigBtn: (color) => ({
    width: '100%',
    padding: '18px',
    borderRadius: 16,
    border: 'none',
    background: color,
    color: 'white',
    fontSize: 20,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
    minHeight: 64,
  }),
  subBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 12,
    border: 'none',
    background: '#fff',
    color: '#666',
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    minHeight: 44,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: '#666',
    marginBottom: 8,
  },
  pillRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  pill: (active, color) => ({
    flex: '1 1 0',
    minWidth: 90,
    padding: '10px 8px',
    borderRadius: 14,
    border: active ? `3px solid ${color}` : '3px solid #e0e0e0',
    background: active ? color : '#fff',
    color: active ? '#fff' : '#666',
    fontSize: 14,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    minHeight: 48,
  }),
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    fontSize: 15,
    fontWeight: 800,
    color: '#666',
  },
  question: {
    fontSize: 18,
    fontWeight: 800,
    color: '#1a1a2e',
    textAlign: 'center',
  },
  readingBig: {
    fontSize: 40,
    fontWeight: 800,
    color: '#1a1a2e',
    textAlign: 'center',
    letterSpacing: 2,
  },
  choiceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    width: '100%',
  },
  choiceText: (bg, dim) => ({
    padding: '14px 8px',
    borderRadius: 16,
    border: 'none',
    background: bg,
    color: 'white',
    fontSize: 19,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
    minHeight: 64,
    opacity: dim ? 0.45 : 1,
  }),
  choiceBall: (border, dim) => ({
    padding: 10,
    borderRadius: 20,
    border: `4px solid ${border}`,
    background: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 0 rgba(0,0,0,0.12)',
    opacity: dim ? 0.45 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  }),
  feedback: (ok) => ({
    width: '100%',
    borderRadius: 16,
    padding: '14px 16px',
    background: ok ? '#4caf50' : '#f44336',
    color: '#fff',
    fontSize: 20,
    fontWeight: 800,
    textAlign: 'center',
    animation: 'popIn 0.3s ease',
  }),
  correctAnswerBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: '#fff',
    borderRadius: 16,
    padding: '10px 16px',
    width: '100%',
    fontSize: 18,
    fontWeight: 800,
    color: '#1a1a2e',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  playerBadge: (player) => ({
    backgroundColor: player === 1 ? THEME_COLOR : BATTLE_COLOR,
    color: '#fff',
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 14,
    fontWeight: 800,
    display: 'inline-block',
  }),
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  scoreNum: (color) => ({
    fontSize: 44,
    fontWeight: 800,
    color,
  }),
  vsText: {
    fontSize: 20,
    fontWeight: 800,
    color: '#aaa',
  },
  bigMessage: {
    fontSize: 26,
    fontWeight: 800,
    color: '#1a1a2e',
    textAlign: 'center',
    animation: 'popIn 0.3s ease',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 16,
    color: '#1a1a2e',
  },
  modalText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 1.7,
    marginBottom: 8,
  },
  closeBtn: {
    marginTop: 20,
    width: '100%',
    padding: '12px',
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
  versionText: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 16,
    textAlign: 'right',
  },
}

const DIFF_OPTIONS = [
  { value: 'easy', label: 'やさしい', note: 'おおもじ' },
  { value: 'normal', label: 'ふつう', note: 'おおもじ＋こもじ' },
  { value: 'hard', label: 'むずかしい', note: 'こもじ' },
]
const DIFF_LABEL = Object.fromEntries(DIFF_OPTIONS.map(d => [d.value, d.label]))
const TYPE_LABEL = { b2m: 'ボール→もじ', m2b: 'もじ→ボール', mix: 'おまかせ' }

function OptionPills({ options, value, onChange, color }) {
  return (
    <div style={styles.pillRow}>
      {options.map(opt => (
        <button
          key={opt.value}
          className="btn"
          style={styles.pill(value === opt.value, color)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
          {opt.note && (
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, opacity: 0.85 }}>
              {opt.note}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ===== クイズ本体（ひとりで・しょうぶで共用） =====
function QuizRunner({ questions, accent, badge, onFinish, onQuit }) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState(null)

  const q = questions[idx]
  const correctIdx = q.options.findIndex(o => o.letter === q.letter)
  const answered = picked !== null
  const isCorrect = answered && picked === correctIdx
  const isLast = idx === questions.length - 1

  const handlePick = (i) => {
    if (answered) return
    setPicked(i)
    if (i === correctIdx) setScore(s => s + 1)
  }
  const handleNext = () => {
    if (isLast) {
      onFinish(score)
    } else {
      setIdx(idx + 1)
      setPicked(null)
    }
  }

  return (
    <>
      <div style={styles.progressRow}>
        <span>{badge}</span>
        <span>もんだい {idx + 1}/{questions.length}</span>
        <span>⭐ {score}</span>
      </div>

      {q.qtype === 'b2m' ? (
        <>
          <div style={styles.question}>このボールの もじは どれかな？</div>
          <BilliardBall char={q.char} size={150} />
          <div style={styles.choiceGrid}>
            {q.options.map((opt, i) => {
              let bg = accent
              if (answered) {
                if (i === correctIdx) bg = '#4caf50'
                else if (i === picked) bg = '#f44336'
              }
              return (
                <button
                  key={opt.letter}
                  className="btn"
                  style={styles.choiceText(bg, answered && i !== correctIdx && i !== picked)}
                  onClick={() => handlePick(i)}
                >
                  {BALL_MAP[opt.letter].reading}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div style={styles.question}>このよみかたの ボールは どれかな？</div>
          <div style={styles.readingBig}>「{BALL_MAP[q.letter].reading}」</div>
          <div style={styles.choiceGrid}>
            {q.options.map((opt, i) => {
              let border = 'transparent'
              if (answered) {
                if (i === correctIdx) border = '#4caf50'
                else if (i === picked) border = '#f44336'
              }
              return (
                <button
                  key={opt.letter}
                  className="btn"
                  style={styles.choiceBall(border, answered && i !== correctIdx && i !== picked)}
                  onClick={() => handlePick(i)}
                >
                  <BilliardBall char={i === correctIdx ? q.char : opt.char} size={96} />
                </button>
              )
            })}
          </div>
        </>
      )}

      {answered && (
        <>
          <div style={styles.feedback(isCorrect)}>
            {isCorrect ? '⭕ せいかい！' : '❌ ざんねん…'}
          </div>
          {!isCorrect && (
            <div style={styles.correctAnswerBox}>
              <span>せいかいは</span>
              <BilliardBall char={q.char} size={56} />
              <span>「{BALL_MAP[q.letter].reading}」</span>
            </div>
          )}
          <button className="btn" style={styles.bigBtn(accent)} onClick={handleNext}>
            {isLast ? 'けっかをみる' : 'つぎへ ▶'}
          </button>
        </>
      )}

      {!answered && onQuit && (
        <button className="btn" style={{ ...styles.subBtn, marginTop: 'auto' }} onClick={onQuit}>
          やめる
        </button>
      )}
    </>
  )
}

// ===== ひとりでモード =====
function SoloSetup({ onStart, onBack }) {
  const [qtype, setQtype] = useState('b2m')
  const [difficulty, setDifficulty] = useState('easy')
  return (
    <div style={styles.card}>
      <div style={{ ...styles.modalTitle, textAlign: 'center' }}>ひとりで れんしゅう</div>
      <div style={styles.sectionLabel}>もんだいの しゅるい</div>
      <OptionPills
        options={[
          { value: 'b2m', label: 'ボール→もじ' },
          { value: 'm2b', label: 'もじ→ボール' },
          { value: 'mix', label: 'ミックス' },
        ]}
        value={qtype}
        onChange={setQtype}
        color={THEME_COLOR}
      />
      <div style={styles.sectionLabel}>むずかしさ</div>
      <OptionPills options={DIFF_OPTIONS} value={difficulty} onChange={setDifficulty} color={THEME_COLOR} />
      <button className="btn" style={styles.bigBtn(THEME_COLOR)} onClick={() => onStart(qtype, difficulty)}>
        スタート！
      </button>
      <button className="btn" style={{ ...styles.subBtn, marginTop: 12 }} onClick={onBack}>
        ← もどる
      </button>
    </div>
  )
}

function soloMessage(score) {
  if (score === SOLO_QUESTIONS) return '🏆 パーフェクト！すごい！'
  if (score >= 8) return '🌟 とてもよくできました！'
  if (score >= 5) return '😊 よくできました！'
  return '💪 つぎは もっとできるよ！'
}

function SoloResult({ score, onRetry, onHome }) {
  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={styles.bigMessage}>{soloMessage(score)}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>
        <span style={{ fontSize: 52, color: THEME_COLOR }}>{score}</span>
        <span style={{ color: '#666' }}> / {SOLO_QUESTIONS} もん せいかい</span>
      </div>
      <button className="btn" style={styles.bigBtn(THEME_COLOR)} onClick={onRetry}>
        もういちど
      </button>
      <button className="btn" style={styles.subBtn} onClick={onHome}>
        ホームへ もどる
      </button>
    </div>
  )
}

// ===== しょうぶモード =====
const BATTLE_PHASE = {
  SETUP: 'setup',
  P1_HANDOFF: 'p1-handoff',
  P1_PLAYING: 'p1-playing',
  P2_HANDOFF: 'p2-handoff',
  P2_PLAYING: 'p2-playing',
  ROUND_RESULT: 'round-result',
  FINAL: 'final',
}

function BattleSetup({ onStart, onBack }) {
  const [rounds, setRounds] = useState(3)
  const [qtype, setQtype] = useState('mix')
  const [p1Difficulty, setP1Difficulty] = useState('easy')
  const [p2Difficulty, setP2Difficulty] = useState('easy')
  return (
    <div style={styles.card}>
      <div style={{ ...styles.modalTitle, textAlign: 'center', color: BATTLE_COLOR }}>
        ふたりで しょうぶ
      </div>
      <div style={styles.sectionLabel}>なんかい しょうぶする？（1ラウンド {BATTLE_QUESTIONS_PER_ROUND}もん）</div>
      <OptionPills
        options={[
          { value: 1, label: '1かい' },
          { value: 3, label: '3かい' },
          { value: 5, label: '5かい' },
        ]}
        value={rounds}
        onChange={setRounds}
        color={BATTLE_COLOR}
      />
      <div style={styles.sectionLabel}>もんだいの しゅるい</div>
      <OptionPills
        options={[
          { value: 'mix', label: 'おまかせ' },
          { value: 'b2m', label: 'ボール→もじ' },
          { value: 'm2b', label: 'もじ→ボール' },
        ]}
        value={qtype}
        onChange={setQtype}
        color={BATTLE_COLOR}
      />
      <div style={styles.sectionLabel}>
        <span style={styles.playerBadge(1)}>🙋 プレイヤー1</span> の むずかしさ
      </div>
      <OptionPills options={DIFF_OPTIONS} value={p1Difficulty} onChange={setP1Difficulty} color={THEME_COLOR} />
      <div style={styles.sectionLabel}>
        <span style={styles.playerBadge(2)}>🙋‍♂️ プレイヤー2</span> の むずかしさ
      </div>
      <OptionPills options={DIFF_OPTIONS} value={p2Difficulty} onChange={setP2Difficulty} color={BATTLE_COLOR} />
      <button
        className="btn"
        style={styles.bigBtn(BATTLE_COLOR)}
        onClick={() => onStart({ rounds, qtype, p1Difficulty, p2Difficulty })}
      >
        しょうぶ スタート！
      </button>
      <button className="btn" style={{ ...styles.subBtn, marginTop: 12 }} onClick={onBack}>
        ← もどる
      </button>
    </div>
  )
}

function BattleMode({ onHome }) {
  const [phase, setPhase] = useState(BATTLE_PHASE.SETUP)
  const [config, setConfig] = useState(null)
  const [round, setRound] = useState(1)
  const [wins, setWins] = useState({ p1: 0, p2: 0 })
  const [roundScores, setRoundScores] = useState({ p1: 0, p2: 0 })
  const [questions, setQuestions] = useState([])

  const startBattle = (cfg) => {
    setConfig(cfg)
    setRound(1)
    setWins({ p1: 0, p2: 0 })
    setPhase(BATTLE_PHASE.P1_HANDOFF)
  }

  const startPlay = (player) => {
    const difficulty = player === 1 ? config.p1Difficulty : config.p2Difficulty
    setQuestions(makeQuestions(BATTLE_QUESTIONS_PER_ROUND, config.qtype, difficulty))
    setPhase(player === 1 ? BATTLE_PHASE.P1_PLAYING : BATTLE_PHASE.P2_PLAYING)
  }

  const finishP1 = (score) => {
    setRoundScores({ p1: score, p2: 0 })
    setPhase(BATTLE_PHASE.P2_HANDOFF)
  }

  const finishP2 = (score) => {
    const newScores = { ...roundScores, p2: score }
    setRoundScores(newScores)
    const roundWinner = newScores.p1 > newScores.p2 ? 1 : newScores.p2 > newScores.p1 ? 2 : 0
    if (roundWinner === 1) setWins(w => ({ ...w, p1: w.p1 + 1 }))
    if (roundWinner === 2) setWins(w => ({ ...w, p2: w.p2 + 1 }))
    setPhase(BATTLE_PHASE.ROUND_RESULT)
  }

  const nextRound = () => {
    if (round >= config.rounds) {
      setPhase(BATTLE_PHASE.FINAL)
    } else {
      setRound(round + 1)
      setPhase(BATTLE_PHASE.P1_HANDOFF)
    }
  }

  if (phase === BATTLE_PHASE.SETUP) {
    return <BattleSetup onStart={startBattle} onBack={onHome} />
  }

  if (phase === BATTLE_PHASE.P1_HANDOFF || phase === BATTLE_PHASE.P2_HANDOFF) {
    const player = phase === BATTLE_PHASE.P1_HANDOFF ? 1 : 2
    const difficulty = player === 1 ? config.p1Difficulty : config.p2Difficulty
    return (
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        {player === 2 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#666' }}>
              <span style={styles.playerBadge(1)}>🙋 プレイヤー1</span> おわり！{' '}
              <span style={{ color: THEME_COLOR, fontSize: 22 }}>{roundScores.p1} てん</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#666' }}>
              スマホを 🙋‍♂️ プレイヤー2 に わたしてね
            </div>
          </>
        )}
        <div style={styles.bigMessage}>
          {player === 1 ? '🙋 プレイヤー1 のばん！' : '🙋‍♂️ プレイヤー2 のばん！'}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#666' }}>
          ラウンド {round}/{config.rounds} ・ {DIFF_LABEL[difficulty]} ・ {TYPE_LABEL[config.qtype]}
        </div>
        <button
          className="btn"
          style={styles.bigBtn(player === 1 ? THEME_COLOR : BATTLE_COLOR)}
          onClick={() => startPlay(player)}
        >
          {player === 1 ? 'スタート！' : 'プレイヤー2 スタート！'}
        </button>
      </div>
    )
  }

  if (phase === BATTLE_PHASE.P1_PLAYING || phase === BATTLE_PHASE.P2_PLAYING) {
    const player = phase === BATTLE_PHASE.P1_PLAYING ? 1 : 2
    return (
      <QuizRunner
        key={`r${round}-p${player}`}
        questions={questions}
        accent={player === 1 ? THEME_COLOR : BATTLE_COLOR}
        badge={player === 1 ? '🙋 P1' : '🙋‍♂️ P2'}
        onFinish={player === 1 ? finishP1 : finishP2}
      />
    )
  }

  if (phase === BATTLE_PHASE.ROUND_RESULT) {
    const roundWinner = roundScores.p1 > roundScores.p2 ? 1 : roundScores.p2 > roundScores.p1 ? 2 : 0
    const isLastRound = round >= config.rounds
    return (
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#666' }}>
          ラウンド {round}/{config.rounds} けっか
        </div>
        <div style={styles.scoreRow}>
          <div style={{ textAlign: 'center' }}>
            <span style={styles.playerBadge(1)}>🙋 プレイヤー1</span>
            <div style={styles.scoreNum(THEME_COLOR)}>{roundScores.p1}</div>
          </div>
          <div style={styles.vsText}>VS</div>
          <div style={{ textAlign: 'center' }}>
            <span style={styles.playerBadge(2)}>🙋‍♂️ プレイヤー2</span>
            <div style={styles.scoreNum(BATTLE_COLOR)}>{roundScores.p2}</div>
          </div>
        </div>
        <div style={styles.bigMessage}>
          {roundWinner === 0
            ? '🤝 ひきわけ！'
            : roundWinner === 1
              ? '🙋 プレイヤー1 のかち！'
              : '🙋‍♂️ プレイヤー2 のかち！'}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#666' }}>
          るいけい：プレイヤー1 {wins.p1} しょう ー プレイヤー2 {wins.p2} しょう
        </div>
        <button className="btn" style={styles.bigBtn(BATTLE_COLOR)} onClick={nextRound}>
          {isLastRound ? 'さいしゅうけっかをみる' : 'つぎのラウンドへ ▶'}
        </button>
      </div>
    )
  }

  // FINAL
  const winner = wins.p1 > wins.p2 ? 1 : wins.p2 > wins.p1 ? 2 : 0
  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#666' }}>さいしゅうけっか</div>
      <div style={styles.bigMessage}>
        {winner === 0
          ? '🤝 ひきわけ！'
          : winner === 1
            ? '🏆 🙋 プレイヤー1 のゆうしょう！'
            : '🏆 🙋‍♂️ プレイヤー2 のゆうしょう！'}
      </div>
      <div style={styles.scoreRow}>
        <div style={{ textAlign: 'center' }}>
          <span style={styles.playerBadge(1)}>🙋 プレイヤー1</span>
          <div style={styles.scoreNum(THEME_COLOR)}>{wins.p1}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#666' }}>しょう</div>
        </div>
        <div style={styles.vsText}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <span style={styles.playerBadge(2)}>🙋‍♂️ プレイヤー2</span>
          <div style={styles.scoreNum(BATTLE_COLOR)}>{wins.p2}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#666' }}>しょう</div>
        </div>
      </div>
      <button className="btn" style={styles.bigBtn(BATTLE_COLOR)} onClick={() => startBattle(config)}>
        もういちど しょうぶ
      </button>
      <button className="btn" style={styles.subBtn} onClick={() => setPhase(BATTLE_PHASE.SETUP)}>
        せってい にもどる
      </button>
      <button className="btn" style={styles.subBtn} onClick={onHome}>
        ホームへ もどる
      </button>
    </div>
  )
}

// ===== モーダル =====
function GuideModal({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>つかいかた</div>
        <p style={styles.modalText}>🎱 ビリヤードのボールで アルファベットを おぼえよう！</p>
        <p style={styles.modalText}>・<b>ボール→もじ</b>：ボールのもじの よみかたを えらぶ</p>
        <p style={styles.modalText}>・<b>もじ→ボール</b>：よみかたに あう ボールを えらぶ</p>
        <p style={styles.modalText}>・むずかしさで おおもじ・こもじが かわるよ</p>
        <p style={styles.modalText}>・「ふたりで しょうぶ」は スマホを こうたいで つかってあそぶよ</p>
        <button style={styles.closeBtn} onClick={onClose}>とじる</button>
      </div>
    </div>
  )
}

function SettingsModal({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>せってい</div>
        <p style={styles.modalText}>もんだいの しゅるいや むずかしさは、それぞれの モードの さいしょの がめんで えらべます。</p>
        <p style={styles.versionText}>v{APP_VERSION}</p>
        <button style={styles.closeBtn} onClick={onClose}>とじる</button>
      </div>
    </div>
  )
}

// ===== ホーム画面 =====
function Home({ onSolo, onBattle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <BilliardBall char="A" size={88} />
        <BilliardBall char="b" size={88} />
        <BilliardBall char="C" size={88} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#666', textAlign: 'center' }}>
        ビリヤードのボールで アルファベットを おぼえよう！
      </div>
      <button className="btn" style={styles.bigBtn(THEME_COLOR)} onClick={onSolo}>
        🎱 ひとりで れんしゅう
      </button>
      <button className="btn" style={styles.bigBtn(BATTLE_COLOR)} onClick={onBattle}>
        ⚔️ ふたりで しょうぶ
      </button>
    </div>
  )
}

// ===== アプリ本体 =====
const SCREEN = {
  HOME: 'home',
  SOLO_SETUP: 'solo-setup',
  SOLO_PLAY: 'solo-play',
  SOLO_RESULT: 'solo-result',
  BATTLE: 'battle',
}

export default function App() {
  const [screen, setScreen] = useState(SCREEN.HOME)
  const [showGuide, setShowGuide] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [soloConfig, setSoloConfig] = useState(null)
  const [soloQuestions, setSoloQuestions] = useState([])
  const [soloScore, setSoloScore] = useState(0)
  const [soloRun, setSoloRun] = useState(0)

  const startSolo = (qtype, difficulty) => {
    setSoloConfig({ qtype, difficulty })
    setSoloQuestions(makeQuestions(SOLO_QUESTIONS, qtype, difficulty))
    setSoloRun(n => n + 1)
    setScreen(SCREEN.SOLO_PLAY)
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .btn { transition: transform 0.1s ease; }
        .btn:active { transform: scale(0.97); }
      `}</style>
      <header style={styles.header}>
        <span style={styles.headerTitle}>{APP_NAME}</span>
        <button style={styles.iconBtn} onClick={() => setShowGuide(true)} aria-label="つかいかた">
          ℹ️
        </button>
        <button style={styles.iconBtn} onClick={() => setShowSettings(true)} aria-label="せってい">
          ⚙️
        </button>
      </header>

      <main style={styles.main}>
        {screen === SCREEN.HOME && (
          <Home onSolo={() => setScreen(SCREEN.SOLO_SETUP)} onBattle={() => setScreen(SCREEN.BATTLE)} />
        )}
        {screen === SCREEN.SOLO_SETUP && (
          <SoloSetup onStart={startSolo} onBack={() => setScreen(SCREEN.HOME)} />
        )}
        {screen === SCREEN.SOLO_PLAY && (
          <QuizRunner
            key={soloRun}
            questions={soloQuestions}
            accent={THEME_COLOR}
            badge="🎱"
            onFinish={(score) => {
              setSoloScore(score)
              setScreen(SCREEN.SOLO_RESULT)
            }}
            onQuit={() => setScreen(SCREEN.HOME)}
          />
        )}
        {screen === SCREEN.SOLO_RESULT && (
          <SoloResult
            score={soloScore}
            onRetry={() => startSolo(soloConfig.qtype, soloConfig.difficulty)}
            onHome={() => setScreen(SCREEN.HOME)}
          />
        )}
        {screen === SCREEN.BATTLE && <BattleMode onHome={() => setScreen(SCREEN.HOME)} />}
      </main>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
