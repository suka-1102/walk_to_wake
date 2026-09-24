# スタイル規約

CSS Modules + SCSS で書く。CSS-in-JS やユーティリティクラス方式（Tailwind 等）は使わない。

**配色は移行中。** `styles/_variables.scss` には旧デザイン（B｜計器盤、フラット・角丸なし）と新デザイン（`$color2-*` 接頭辞、ネイビー＋スカイブルー＋イエロー、角丸あり）の2系統が同居している。新しい画面・コンポーネントを書くときは `$color2-*` 側を使う。既存画面（`/login`・`/terms`・`/privacy`・`/tokushoho`）はまだ旧トークンのままで、順次新デザインへ移行する（[roadmap.md](roadmap.md) 決定ログ 2026-09-18）。全画面の移行が終わったら旧トークンは削除する。

## ファイル配置

- `*.module.scss` をコンポーネントと同階層に置く（`Foo.tsx` / `Foo.module.scss`）
- `app/globals.scss` — リセット CSS の読み込みとフォント指定のみ。最小限に留める
- `styles/_variables.scss` — 色・余白・ブレークポイント

## 書き方

- クラス名は camelCase（`styles.checkInButton` のようにドット記法で参照するため）
- 色・余白・ブレークポイントを直書きせず、`styles/_variables.scss` を `@use` で読み込む
- ネストは3階層程度まで
- グローバルスタイルに要素セレクタでの装飾を足さない。コンポーネント固有の見た目は CSS Modules 側に置く
