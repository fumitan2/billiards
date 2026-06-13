# ナインボール

ビリヤードのナインボールで あそべる、子ども向けゲームアプリです。
（あとから 教育要素を ついかしていく ベースとして 作っています）

## あそびかた

1. しろたま（てだま）を おくところを **タップ**
2. がめんを **ドラッグ**して むき と つよさを きめる（うしろに ひくほど つよい）
3. ゆびを **はなす**と ショット！
4. 1ばん→9ばんの じゅんに ポケットに いれて、さいごに 9ばんを いれたら クリア！

## 機能

- 自前の軽量2D物理エンジン（クッション反射・ボール同士の弾性衝突・ポケット判定）
- タップで手球を配置 → ドラッグで角度＆パワー → リリースでショット
- ナインボールの基本ルール（最小番号を先に当てる／9番でクリア／ファウル＝手球フリー）
- Canvas描画＋本物らしいボール（ソリッド＆9番ストライプ）と木枠＋緑フェルトのテーブル
- PWA対応（ホーム画面に追加してオフラインで遊べる）

## 開発コマンド

```bash
npm install       # 依存インストール
npm run dev       # 開発サーバー → http://localhost:5173/
npm run build     # 本番ビルド → dist/
npm run preview   # ビルド結果のローカル確認
```

## デプロイ

- **Web**：`main` ブランチへの push で Vercel が自動デプロイ（Vite プリセット、`dist/` を配信）
- **Google Play（将来）**：PWA を [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) で TWA としてラップして AAB を生成 → Play Console に投入する想定。`vite-plugin-pwa` の manifest（standalone / portrait / アイコン）とHTTPS配信（Vercel）が前提条件を満たしています。公開後は `public/.well-known/assetlinks.json`（署名鍵のフィンガープリント）を追加します。

## 技術スタック

- React 19 + Vite
- JavaScript (JSX)
- Canvas 2D（ゲーム描画）＋ 自前物理（`src/billiards.js`）
- vite-plugin-pwa（PWA対応）

---

© 2026 fumitan2. All Rights Reserved.
