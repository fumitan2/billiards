# CLAUDE.md — fumitan2 子ども練習アプリ シリーズ共通ルール

このファイルはすべてのアプリリポジトリのルートに置く。
Claude Code が作業を始める前に必ず読むこと。
各アプリ固有の仕様は `SPEC.md` を参照すること。

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

- このシリーズのすべてのコード・素材は fumitan2 に著作権が帰属する
- リポジトリは Private で管理する
- LICENSE ファイルは作成しない
- 第三者への公開・再配布・商用利用は一切許可しない
- README.md の末尾に必ず以下を記載すること：

```
© 2026 fumitan2. All Rights Reserved.
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
├── CLAUDE.md             # 本ファイル
├── README.md             # アプリ説明・開発コマンド・© 表記
├── SPEC.md               # 仕様書（要件・問題設計・UI設計）
├── CHANGELOG.md          # バージョン別の変更履歴
├── public/
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── src/
    ├── main.jsx
    ├── index.css         # グローバルリセットのみ
    └── App.jsx           # アプリ本体（原則単一ファイルに集約）
```

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

## 9. 開発コマンド（標準）

```bash
npm install       # 依存インストール
npm run dev       # 開発サーバー → http://localhost:5173/
npm run build     # 本番ビルド → dist/
npm run preview   # ビルド結果のローカル確認
```

---

## 10. 作業時の注意

- コードはシンプルに保つ（動作の安定性を最優先）
- 外部 API・サーバー不要（完全クライアントサイド）
- ランダム問題生成は前の問題と同じにならないよう注意
- 機能を変えたら必ず `package.json` と `CHANGELOG.md` を更新する
- LICENSE ファイルは作成しない
