import { useState } from 'react'

const APP_VERSION = __APP_VERSION__
const APP_NAME = 'APP_NAME'
const THEME_COLOR = '#000000' // TODO: replace with app theme color

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
    fontSize: 22,
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
    justifyContent: 'center',
    padding: '24px 16px',
    gap: 16,
  },
  placeholder: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    width: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  // 選択肢ボタンのサンプルスタイル（実装時にテーマカラーに合わせて調整）
  choiceButton: {
    padding: '16px',
    borderRadius: 16,
    border: 'none',
    background: THEME_COLOR,
    color: 'white',
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
    minHeight: 64,
    width: '100%',
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

function GuideModal({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>つかいかた</div>
        {/* TODO: アプリに合わせて使い方の説明を追加する */}
        <p style={styles.modalText}>① もんだいをよむ</p>
        <p style={styles.modalText}>② こたえのボタンをタップする</p>
        <p style={styles.modalText}>③ せいかい・ふせいかいがわかる</p>
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
        {/* TODO: アプリに合わせて設定項目を追加する */}
        <p style={styles.modalText}>（せってい項目をここに追加してください）</p>
        <p style={styles.versionText}>v{APP_VERSION}</p>
        <button style={styles.closeBtn} onClick={onClose}>とじる</button>
      </div>
    </div>
  )
}

export default function App() {
  const [showGuide, setShowGuide] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div style={styles.container}>
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
        <div style={styles.placeholder}>
          {/* TODO: ここに問題コンポーネントを実装する */}
          ここに もんだいが はいります
        </div>
      </main>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
