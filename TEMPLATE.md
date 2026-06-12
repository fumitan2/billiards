# TEMPLATE.md — このテンプレートの使い方

新しいアプリを作るときの手順。**セットアップが終わったらこのファイルは削除すること。**

---

## 1. リポジトリの作成

1. GitHub でこのリポジトリをテンプレートに新リポジトリを作成（Private）
2. クローンして `npm install`

## 2. プレースホルダーの置換

以下をすべて置き換える。

| 置換対象 | ファイル | 内容 |
|---|---|---|
| `APP_NAME` | `index.html`（title） | アプリ名 |
| `APP_NAME` | `vite.config.js`（manifest の name / short_name） | アプリ名 |
| `APP_NAME` | `src/App.jsx`（`const APP_NAME`） | アプリ名 |
| `APP_NAME` | `README.md` / `SPEC.md` | アプリ名 |
| `APP_DESCRIPTION` | `vite.config.js`（manifest の description） | アプリの説明 |
| `APP_DESCRIPTION` | `README.md` | アプリの説明 |
| `#000000`（テーマカラー） | `vite.config.js`（theme_color） | SPEC.md で定義した色 |
| `#000000`（テーマカラー） | `src/App.jsx`（`const THEME_COLOR`） | SPEC.md で定義した色 |
| `kids-app-template` | `package.json`（name） | リポジトリ名 |

確認コマンド（ヒットが残っていれば置換漏れ）：

```bash
grep -rn "APP_NAME\|APP_DESCRIPTION\|kids-app-template" \
  index.html vite.config.js package.json README.md SPEC.md src/
```

## 3. ドキュメントの初期化

- [ ] `SPEC.md` の TODO をすべて埋める（テーマカラーはここで決める）
- [ ] `README.md` の機能欄を記載する
- [ ] `CHANGELOG.md` を初期化する：

```markdown
# 変更履歴

## [Unreleased]

## [1.0.0] - YYYY-MM-DD
### 最初のリリース
- 基本機能一式
```

- [ ] `package.json` の `version` を `1.0.0` に戻す
- [ ] `CLAUDE.md` が最新版か確認する（正は kids-app-template リポジトリ）

## 4. PWA アイコンの差し替え

`public/icons/` の `icon-192.png` / `icon-512.png` は仮アイコン（単色）。
アプリのアイコンを作成して差し替える。

## 5. 実装

- `src/App.jsx` のプレースホルダー（「ここに もんだいが はいります」）を問題コンポーネントに置き換える
- デザインは `CLAUDE.md` セクション7、しょうぶモードはセクション8に従う

## 6. 仕上げ

- [ ] `npm run build` が通ることを確認
- [ ] `npm run lint` が通ることを確認
- [ ] **この TEMPLATE.md を削除**
- [ ] コミットして main にプッシュ（Vercel が自動デプロイ）
