# AGENTS.md — shumiya-pe 子ども練習アプリ シリーズ共通ルール

このファイルはすべてのアプリリポジトリのルートに置く。
Codex が作業を始める前に必ず読むこと。
各アプリ固有の仕様は `SPEC.md` を参照すること。

## 0. ws運用
`/Users/mbp/ws` から操作する場合も、このリポジトリを独立したGit管理単位として扱う。

- コミット・push・status確認は対象アプリのリポジトリ内で行う
- 教育アプリ全体の方針・進捗・ストア展開に関わる変更は `bun-hq` の該当STATE/README更新を検討する
- 一時ファイル・ローカル設定・生成物は原則コミットしない


---

## 1. シリーズ概要

小学校低学年〜中学年（主に1〜6年生）向けの練習アプリシリーズ。

- **視覚的**：SVGビジュアルや絵文字を使った直感的な問題表示
- **ひらがな中心**：UI文言は基本ひらがな
- **クイズ形式**：4択 + 正誤フィードバック + スコア表示
- **1セット完結**：10問前後で達成感を与える
- **スマホファースト**：タッチ操作対応、縦持ち優先レイアウト

---

## 2. 著作権・ライセンス

**All Rights Reserved（ライセンスなし）**

- このシリーズのすべてのコード・素材は shumiya-pe に著作権が帰属する
- リポジトリは Private で管理する
- LICENSE ファイルは作成しない
- 第三者への公開・再配布・商用利用は一切許可しない
- README.md の末尾に必ず以下を記載すること：

```
© 2026 shumiya-pe. All Rights Reserved.
```

---

## 3. 技術スタック（統一ルール）

| 項目 | 採用技術 |
|---|---|
| フレームワーク | React 19 + Vite |
| 言語 | JavaScript (JSX) |
| CSS | インラインスタイル（外部CSSライブラリは使わない） |
| PWA | vite-plugin-pwa（Service Worker + manifest） |
| デプロイ | Vercel（main ブランチ push で自動デプロイ） |
| 外部依存 | 最小限（UIライブラリは使わない） |
| フォント | Google Fonts CDN（Nunito 推奨） |

---

## 4. ファイル構成（標準）

```
{app-name}/
├── index.html
├── vite.config.js
├── package.json          # version フィールドでバージョン管理
├── package-lock.json
├── .gitignore
├── AGENTS.md             # 本ファイル
├── README.md             # アプリ説明・開発コマンド・© 表記
├── SPEC.md               # 仕様書（要件・問題設計・UI設計）
├── CHANGELOG.md          # バージョン別の変更履歴
├── twa-manifest.json     # TWA(Bubblewrap)設定（Google Play配信する場合のみ・§13）
├── scripts/              # アイコン生成スクリプト（§12）
│   ├── png-util.mjs      #   依存なしの PNG decode/encode/resize
│   ├── prep-icon.mjs     #   元画像の背景透過→trim→正方形化
│   └── gen-icons.js      #   透過ソースから各サイズ生成
├── public/
│   ├── {元画像}.png       # アイコン元画像（単色背景の PNG・例: clock-sheep.png）
│   ├── favicon.ico       # ブラウザタブ用（元画像から生成）
│   ├── apple-touch-icon-180x180.png  # iOS ホーム画面用（180px・元画像から生成）
│   ├── pwa-192x192.png   # PWA用（透過・purpose: any）
│   ├── pwa-512x512.png   # PWA用（透過・purpose: any）
│   └── maskable-icon-512x512.png     # Android用（背景付き・purpose: maskable・§12必須）
└── src/
    ├── main.jsx
    ├── index.css         # グローバルリセットのみ
    └── App.jsx           # アプリ本体（原則単一ファイルに集約）
```

※ `public/icon-source.png`（透過の中間生成物）は元画像から再生成できるため `.gitignore` に入れる。

---

## 5. バージョン管理ルール

### バージョン番号の形式

セマンティックバージョニング（`MAJOR.MINOR.PATCH`）を使う。

| 種別 | 例 | 上げるとき |
|---|---|---|
| PATCH | 1.0.0 → 1.0.1 | バグ修正・文言修正・見た目の微調整 |
| MINOR | 1.0.0 → 1.1.0 | 新機能追加・問題モード追加 |
| MAJOR | 1.0.0 → 2.0.0 | UIの全面刷新・根本的な設計変更 |

### バージョンの置き場

`package.json` の `version` フィールドを正として一元管理する。
アプリ内への埋め込みは `vite.config.js` の `define` で行う：

```js
// vite.config.js
import { readFileSync } from 'fs'
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // ...
})
```

アプリ内での参照：
```js
const APP_VERSION = __APP_VERSION__
```

### バージョンのアプリ内表示

- ⚙️ 設定パネルの中に `v1.0.0` の形式で表示する
- 子どもが見るエリアには表示しない

### バージョンアップ時の作業セット（必須）

1. `package.json` の `version` を上げる
2. `CHANGELOG.md` に変更内容を追記する
3. アプリ内の `__APP_VERSION__` は自動で反映される（追加作業不要）

---

## 6. CHANGELOG.md の書き方

```markdown
# 変更履歴

## [Unreleased]

## [1.0.1] - 2026-05-30
### バグ修正
- ○○の不具合を修正しました。

## [1.0.0] - 2026-05-29
### 最初のリリース
- 基本機能一式
```

- セクション見出し：`新機能` / `バグ修正` / `改善` / `削除`
- 文体：「〜しました」調
- `[Unreleased]` セクションに作業中の変更を随時追加し、リリース時にバージョン番号に変える

---

## 7. UIデザインの共通ルール

このシリーズのデザイン基準は **なんじかな？（clock-practice）** と **かんじれんしゅう（kanji-plactice）**。
新しいアプリは必ずこのテイストに合わせること。

### 全体の雰囲気

- **あたたかく・やわらかく・子どもらしく**
- クールなビジネス系・フラットデザインにしない
- 青白・グレー系の無機質な配色は使わない

### カラーパレット（全アプリ統一）

| 役割 | カラー | 備考 |
|---|---|---|
| 背景 | `#FFF8E7` | クリーム系・あたたかみのある白 |
| 正解色 | `#4caf50` | グリーン |
| 不正解色 | `#f44336` | レッド |
| テキスト（メイン） | `#1a1a2e` | ダークネイビー |
| テキスト（サブ） | `#666` | グレー |
| テーマカラー | アプリごとに SPEC.md で定義 | ヘッダー・アクセントに使用 |

### フォント

```html
<!-- index.html の <head> に必ず追加 -->
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
```

```js
// App.jsx のルート要素に適用
fontFamily: "'Nunito', sans-serif"
```

### ヘッダー

- **背景なし・透明**（青や色のベタ塗りにしない）
- アプリ名はダークネイビー（`#1a1a2e`）の大きめ太字
- ℹ️・⚙️ボタンは **白背景の丸いボタン**、アイコンはダークネイビー

```js
// ヘッダーのスタイル例
header: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  background: 'transparent',
}

// ℹ️⚙️ボタンのスタイル例
iconButton: {
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  background: 'white',
  border: 'none',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  fontSize: '20px',
  cursor: 'pointer',
}
```

### 選択肢ボタン

- **色付き塗りつぶし**（白地＋ボーダーのみは使わない）
- 角丸大きめ（`borderRadius: '16px'` 以上）
- テーマカラーかそのバリエーションを使う
- タップ領域：最小 44px × 44px（実際は 64px 以上推奨）

```js
// 選択肢ボタンのスタイル例
choiceButton: {
  padding: '16px',
  borderRadius: '16px',
  border: 'none',
  background: '#FF6B6B',   // テーマカラー
  color: 'white',
  fontSize: '20px',
  fontWeight: '700',
  fontFamily: "'Nunito', sans-serif",
  cursor: 'pointer',
  boxShadow: '0 4px 0 rgba(0,0,0,0.15)',  // 立体感
}
```

### インタラクション

- 正誤フィードバックはアニメーション付き（0.3s 程度）
- 不正解時は正解を必ず表示する
- ボタンの hover/active で軽い縮小アニメーション（`transform: scale(0.97)`）

### モーダル

- 使い方ガイド：`ℹ️` ボタンから開く
- 設定パネル：`⚙️` ボタンから開く（バージョン番号を必ず表示）
- モーダル背景：`rgba(0,0,0,0.5)` のオーバーレイ
- モーダル本体：白背景・角丸（`borderRadius: '20px'`）・`padding: '24px'`

### スプラッシュスクリーン

起動直後に一瞬だけ表示し、自動でフェードアウトして本編に入る。**全アプリ共通**で実装する。

#### 表示ルール

- アプリ起動時に **1回だけ** 表示する（`splashDone` を App ルートの state で管理し、`!splashDone` の間だけ描画）。
- **自動で消える**（タップ不要）。表示 → フェードアウトの目安タイミング：
  - `1400ms` 表示 → `opacity` を `0.5s ease` でフェード → `1900ms` で `onDone()`
- 全画面オーバーレイ：`position: fixed / inset: 0 / zIndex: 9999 / pointerEvents: 'none'`
- 背景は **アプリ背景色（`#FFF8E7`）**。装飾としてテーマカラー/アクセント色の淡い `radial-gradient` を重ねてよい（透明度 `~0.2` 程度）。

#### 構成要素（上から縦並び・中央寄せ）

| 要素 | 内容 | スタイル目安 |
|---|---|---|
| アイコン | `public/pwa-192x192.png` を流用 | `120px` 角丸 `28px`・ドロップシャドウ |
| アプリ名 | 例「なんじかな？」 | 太字 `900`・`28px`・メインテキスト色 |
| サブタイトル | ひらがなの副題（例「とけいれんしゅう」） | 太字 `800`・`14px`・サブ色 |
| バージョン | `v{pkg.version}` | `700`・`12px`・薄いグレー |

- 各要素は `@keyframes pop`（`scale(0) → 1.18 → 1`）で **少しずつ遅延**させて登場させる（`delay: 0 / .15s / .25s / .35s`）。
- アイコンは PWA 用画像（`pwa-192x192.png`）をそのまま使い、**スプラッシュ専用画像は作らない**。

#### バージョン表示について

§5 では「バージョンは子どもが見るエリアには表示しない」としているが、**スプラッシュ末尾の小さな薄色表示は例外として許可**する（一瞬かつ目立たないため）。設定パネル内の表示（§5）と二重に出してよい。

```jsx
// スプラッシュの実装例（App ルート）
function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1400)
    const t2 = setTimeout(() => onDone(), 1900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  // 背景 #FFF8E7 + radial-gradient、アイコン/アプリ名/サブ/バージョンを pop で登場
}

// App 本体
if (!splashDone) {
  return (<><style>{GLOBAL_CSS}</style><SplashScreen onDone={() => setSplashDone(true)} /></>)
}
```

---

## 8. しょうぶモード 共通仕様

### 基本コンセプト

- **2プレイヤー・同一端末パス方式**：ひとつのスマホを交互に渡してプレイする
- **サーバー不要**：スコアはすべてクライアント側 state で管理する
- **プレイヤー表記**：「プレイヤー1（🙋）」「プレイヤー2（🙋‍♂️）」に統一する

### しょうぶカラー

しょうぶモード専用のアクセントカラーを定義し、セットアップ・結果画面などで使う。

```js
const BATTLE_COLOR = '#e91e63' // ピンク系推奨（アプリのテーマカラーと被る場合は調整）
```

### フェーズ管理

しょうぶモードは以下のフェーズを state で管理する。
アプリのラウンド構造によってフェーズの粒度は変わるが、**必ずハンドオフ画面を挟む**こと。

```js
const BATTLE_PHASE = {
  SETUP:        'setup',         // セットアップ（ラウンド数・難易度選択）
  P1_HANDOFF:   'p1-handoff',    // P1 スタート前のハンドオフ画面
  P1_PLAYING:   'p1-playing',    // P1 プレイ中
  P2_HANDOFF:   'p2-handoff',    // P2 スタート前のハンドオフ画面（P1のスコアを表示）
  P2_PLAYING:   'p2-playing',    // P2 プレイ中
  ROUND_RESULT: 'round-result',  // ラウンド結果（Nせん方式の場合）
  FINAL:        'final',         // 最終結果
}
```

※ 1問ごとに交互にプレイする方式（かんじれんしゅう・なんじかな？ 型）では
  `ROUND_RESULT` を省略し、`P1_HANDOFF → P1_PLAYING → P2_HANDOFF → P2_PLAYING` を1問ごとにループする。

### ラウンド構造の2パターン

| パターン | 説明 | 採用アプリ例 |
|---|---|---|
| **Nせんしょうぶ（ベスト方式）** | N ラウンドを戦い、勝ちラウンド数が多い方が優勝。ラウンドあたりの問題数は SPEC.md で定義する（1問〜複数問）。 | こっきクイズ・たんいれんしゅう |
| **N問合計ポイント方式** | N 問を交互に解き、合計正解数が多い方が優勝。ラウンド概念なし。 | かんじれんしゅう・なんじかな？ |

どちらを採用するかは SPEC.md で定義すること。

### セットアップ画面（共通項目）

以下を必ず設定できるようにする。アプリ固有の項目は SPEC.md で追加定義。

| 項目 | 内容 | 選択肢の例 |
|---|---|---|
| ラウンド数 / 問題数 | 何回（問）しょうぶするか | 1・3・5 または 3・5・10 |
| プレイヤーごとの難易度 | P1・P2 が個別に選べる | アプリ固有（年生・やさしい〜むずかしい など） |
| 問題のしゅるい（任意） | 複数問題タイプがある場合 | おまかせ含む |

```js
// セットアップ画面の実装例
function BattleSetup({ onStart }) {
  const [rounds, setRounds] = useState(3)
  const [p1Difficulty, setP1Difficulty] = useState('easy')
  const [p2Difficulty, setP2Difficulty] = useState('easy')
  // ...
}
```

### ハンドオフ画面

プレイヤー交代時に必ず表示する。**前プレイヤーのスコアを画面に出したまま端末を渡さないこと**（相手に見えてしまうため）。

```
【プレイヤー1 ハンドオフ画面の表示内容】
- 「🙋 プレイヤー1 のばん！」を大きく表示
- ラウンド番号・難易度などのプレイ情報
- 「スタート！」ボタン（タップするまで問題を表示しない）

【プレイヤー2 ハンドオフ画面の表示内容】
- プレイヤー1 のスコア（「おわり！ X てん」）
- 「スマホを 🙋‍♂️ プレイヤー2 に わたしてね」のメッセージ
- 「プレイヤー2 スタート！」ボタン
```

### スコア・勝敗判定

```js
// Nせん方式
const roundWinner = p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : 0
// ひきわけはどちらにも勝利カウントを加算しない

// 合計ポイント方式
const winner = p1Total > p2Total ? 1 : p2Total > p1Total ? 2 : 0
// ひきわけ（0）は「🤝 ひきわけ！」と表示
```

### 結果画面

```
【ラウンド結果画面（Nせん方式のみ）】
- P1・P2 のラウンドスコアを横並びで大きく表示（VS レイアウト）
- ラウンド勝者を発表
- 累計勝利数を表示
- 「つぎのラウンドへ」または「さいしゅうけっかをみる」ボタン

【最終結果画面（共通）】
- 勝者を大きく発表（🏆 または 🤝）
- 最終スコアを VS レイアウトで表示
- 「もういちど しょうぶ」ボタン（同じ設定で再挑戦）
- 「せってい にもどる」またはホームへ戻るボタン
```

### UIスタイル指針

```js
// プレイヤーバッジ（プレイヤー1=テーマカラー、プレイヤー2=BATTLE_COLOR）
// 表示例：「🙋 プレイヤー1」「🙋‍♂️ プレイヤー2」
playerBadge: (player) => ({
  backgroundColor: player === 1 ? THEME_COLOR : BATTLE_COLOR,
  color: '#fff',
  borderRadius: 20,
  padding: '4px 14px',
  fontSize: 14,
  fontWeight: 800,
})

// VS レイアウト（スコア横並び）
scoreRow: {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
}
```

---

## 9. コード管理ルール

| 項目 | ルール |
|---|---|
| リポジトリ | Private |
| ブランチ | `main` 単一ブランチで運用 |
| コミットメッセージ | 英語・命令形（例：`Fix elapsed time bug`） |
| 認証 | SSH（ED25519 鍵） |
| 自動デプロイ | main への push で Vercel が自動デプロイ |

---

## 10. 開発コマンド（標準）

```bash
npm install       # 依存インストール
npm run dev       # 開発サーバー → http://localhost:5173/
npm run build     # 本番ビルド → dist/
npm run preview   # ビルド結果のローカル確認
```

---

## 11. 作業時の注意

- コードはシンプルに保つ（動作の安定性を最優先）
- 外部 API・サーバー不要（完全クライアントサイド）
- ランダム問題生成は前の問題と同じにならないよう注意
- 機能を変えたら必ず `package.json` と `CHANGELOG.md` を更新する
- LICENSE ファイルは作成しない

---

## 12. アイコン生成（共通手順）

キャラクター等の**1枚の元画像**から、PWA / favicon / Android maskable 用のアイコンを
**依存ライブラリなしの純 Node スクリプト**で生成する。ImageMagick・sharp は不要。

### 元画像の条件

- **単色の背景**を持つ正方形に近い PNG（背景透過処理がしやすい）
- `public/{元画像}.png` に置く（例: `clock-sheep.png`）

### スクリプト構成（`scripts/`）

| ファイル | 役割 |
|---|---|
| `png-util.mjs` | 依存なしの PNG decode / encode / resize（既存の zlib のみ使用） |
| `prep-icon.mjs` | 元画像の単色背景を四隅から floodfill で透過 → trim → 透過パディングで正方形化 → `public/icon-source.png` |
| `gen-icons.js` | `icon-source.png` から各サイズを生成（pwa-192x192/pwa-512x512 透過、maskable-icon-512x512 背景付き、apple-touch-icon-180x180、favicon.ico） |

### npm スクリプト

```json
// package.json
"scripts": {
  "prep-icon": "node scripts/prep-icon.mjs",
  "icons": "npm run prep-icon && node scripts/gen-icons.js"
}
```

- `npm run icons` … 透過処理 → 全アイコン生成（前準備込み）

### maskable アイコンは必須（Android スプラッシュ対策）

Android は **スプラッシュ画面とアダプティブアイコンを円形等にマスク**し、
**透過部分を黒く塗る**。透過 PNG をそのまま `purpose: "maskable"` に指定すると
「円の中が黒背景＋ロゴ」になる不具合が出る。

→ **背景色（`background_color` と同じ）を全面に敷き、ロゴを安全領域（中央 ~72%）に
  配置した専用 maskable アイコン**を別途生成し、それを maskable に割り当てる。
  透過版は `any` 用に残す。

```js
// vite.config.js の manifest.icons
// vite-plugin-pwa 標準命名に統一。any と maskable を名前で取り違えないこと。
icons: [
  { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
]
```

### favicon / apple-touch-icon

- 同じ元画像から `public/favicon.ico` と 180x180 の `public/apple-touch-icon-180x180.png` を生成し、`index.html` で参照する。

```html
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
```

### 確認方法

- 生成物は colorType 6（RGBA）になっているか確認する。
- maskable は「円マスクしてもロゴが欠けず、背景に黒が出ない」ことを確認する。
- 反映後 Android で黒い円が出る場合は **PWA を再インストール**（OS がアイコンを強くキャッシュするため）。

---

## 13. TWA化 / Google Play 配信（共通手順）

PWA を **Bubblewrap CLI** で TWA（Trusted Web Activity）として AAB 化し、Google Play に配信する。
※ PWABuilder は不安定なことがあるため **Bubblewrap を標準**とする。

### 前提ツール

| ツール | 備考 |
|---|---|
| Node.js | 既存 |
| `@bubblewrap/cli` | `npm i -g @bubblewrap/cli` |
| JDK 17 + Android SDK | **方法A（推奨）**: `bubblewrap init` 実行時に「自動インストールするか」と聞かれ Yes で `~/.bubblewrap/` に入る。TWA用途だけならこれで十分。<br>**方法B**: システムに Temurin JDK17 + Android cmdline-tools を入れる（Android開発全般をやる場合のみ） |

### 手順

```bash
# 1. CLI
npm i -g @bubblewrap/cli

# 2. init（Webリポジトリとは別の空ディレクトリで実行）
mkdir -p ~/ws/{app-name}-twa && cd ~/ws/{app-name}-twa
bubblewrap init --manifest https://{app}.vercel.app/manifest.webmanifest

# 3. build → app-release-bundle.aab（Play用）, app-release-signed.apk（実機確認用）
bubblewrap build
```

**init の入力**（manifest から自動入力されるので大半は Enter）:
- **Domain** … Web のドメイン（`{app}.vercel.app`）。アプリIDと間違えやすいので注意
- **Application ID** … ここだけ手入力。`com.{developer}.{app}` 形式（例: `com.shumiya.nanjikana`）
- **Key store password / Key password** … **自分で決めて控える**

### 署名キーストアの扱い（重要）

- **`android.keystore` と init で決めたパスワードは絶対に紛失しない。** 失うとアプリ更新が永久に不可。
- **git にコミットしない**（private リポジトリでも禁止）。git の外で安全にバックアップする。
- パスワードは twa-manifest.json には保存されない（build 時入力）ため、設定ファイル自体に秘密情報はない。

### 版管理の方針

- **TWA プロジェクト本体は Web リポジトリと別管理**（`~/ws/{app-name}-twa/` のまま）。
  gradle 一式・`app/` は `bubblewrap build`/`update` で再生成できるので git 化しなくてよい。
- **版管理するのは `twa-manifest.json` だけ**（Web リポジトリ直下に置く）。これで構成を再現できる。
- **コミットしないもの**: `android.keystore` / `*.aab` / `*.apk` / `.gradle/` / `build/` / `app/build/`。

### SHA256 フィンガープリント（assetlinks 用）

署名済み APK からパスワード不要で取得できる:

```bash
keytool -printcert -jarfile app-release-signed.apk | grep "SHA256:"
```

**Play アプリ署名鍵の SHA-256 を Play Console から取得する手順**（assetlinks には基本こちらを使う）:

1. アプリページ左メニューの **「Google Play による保護」** をクリック
2. **「Google Play ストアの保護」** セクションを展開（下矢印）
3. **「アプリ署名鍵の保護」** の横の **「Play アプリ署名の管理」** ボタンをクリック
4. **「アプリの署名」** ページ（URL 末尾 `/keymanagement`）が開く
5. **「アプリ署名鍵の証明書」** セクションに SHA-256 フィンガープリントが表示される
   - 内部テスト中は **「アップロード鍵の証明書」** の SHA-256 も併記しておくと確実


### assetlinks.json（アドレスバーを消すために必須）

`https://{app}.vercel.app/.well-known/assetlinks.json`（= `public/.well-known/assetlinks.json`）に配置:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.{developer}.{app}",
    "sha256_cert_fingerprints": ["<SHA-256>"]
  }
}]
```

⚠️ **Play アプリ署名を使う場合（新規アプリは通常自動で有効）**、`assetlinks.json` に入れるのは
**ローカル keystore の SHA-256 ではなく、Play Console の「アプリの整合性 → アプリ署名鍵証明書」に
表示される Google の SHA-256**。ローカル鍵の値だと TWA のアドレスバーが消えない。
内部テスト用に両方の SHA-256 を配列に入れておくと確実。

### Play Console 側（手動・Codex では代行不可）

- 開発者登録（初回 $25）と**新規アプリの初回登録・AAB アップロードは Web の Play Console から手動**で行う。
- Google アカウント認証が必要なため Codex では代行できない。
- アップロード後に表示される Google の署名鍵 SHA-256 を取得 → assetlinks.json に反映 → デプロイ。
