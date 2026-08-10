<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Walk to Wake — プロジェクト固有ルール

## プロジェクトの概要

早起きして外に出ることを、デポジット（預り金）の減額というペナルティで後押しする Web アプリ。ユーザーは目標地点・毎日のチェックイン期限時刻・チャレンジ期間を設定し、期間中は毎日その時刻までに目標地点付近でブラウザの位置情報を使ってチェックインする。失敗した日数に応じてペナルティ額が積み上がる。

アラーム機能は持たない。目標地点は「意味のある行き先」である必要はなく、家を出て歩いて行ける場所（近所のコンビニなど）であればよい。

**要件・スコープ・各種しきい値の正は [README.md](README.md)。実装に着手する前に必ず README を読むこと。** このファイルには数値を再掲しない（二重管理を避けるため）。

現在は**要件定義段階**であり、アプリ本体のコードはまだ存在しない（`app/` は create-next-app の初期状態）。実装に入る前に README の「未確定事項」を解消すること。

## ドメイン用語

- **チャレンジ (challenge)**: ユーザーが1件作成する「目標地点＋期限時刻＋期間＋金額設定」のセット。v1 では1ユーザーにつき同時に1件のみ。
- **目標地点 (target location)**: チャレンジで設定する緯度・経度。変更回数の上限は1アカウントにつき累積で管理する（チャレンジ単位でリセットされない）。`location_change_count` のような回数カウントはユーザー側に持たせる（上限値は README 参照）。
- **チェックイン (check-in)**: その日、期限時刻までにブラウザの Geolocation API で現在地を取得し、距離判定と時刻判定の両方をクリアした行為。1日1回。
- **失敗 (failure)**: 期限までにチェックインできなかった、または距離判定を満たさなかった日。失敗回数をチャレンジ単位で累積する。DB には書き込まず、表示のたびに動的算出する。
- **デポジット**: チャレンジ作成時にユーザーが自由入力する金額。v1 では実決済せず、DB 上の計算のみ行う。
- **ペナルティ単価**: 1失敗あたりに減額する固定金額。ユーザー入力ではなく `lib/config.ts` の定数（値は README 参照）。
- **早期失敗 / チャレンジ終了**: 残高（デポジット額 − 失敗回数 × ペナルティ単価）がペナルティ単価を下回った時点でチャレンジを即時終了させる状態。端数の残高は没収し返金しない。終了後はユーザーはすぐ新しいチャレンジを作成できる。
- **システム利用料**: デポジット額に対する一定率の運営収益。返金対象外。v2 以降で Stripe 決済に含める。

## 使用している技術

- **Bun** — パッケージマネージャ兼スクリプトランナー。`npm` / `npx` / `yarn` は使わない
- **Next.js 16 (App Router) + React 19 + TypeScript** — `src/` ディレクトリは使わず `app/` はリポジトリ直下
- **CSS Modules + SCSS** — スタイルは `*.module.scss` で書く（`sass` パッケージが必要）。CSS-in-JS やユーティリティクラス方式は使わない
- **MySQL + Prisma** — スキーマ定義・マイグレーション・クエリはすべて Prisma 経由で行う。生 SQL は原則書かない
- **Auth.js (next-auth)** — Google 等のソーシャルログイン。自前のパスワード管理は行わない
- **Geolocation API** — 位置情報はブラウザから取得する（サーバー側の IP ジオロケーションは使わない）。チェックイン時だけでなく目標地点の登録時にも使う。目標地点は現地でブラウザの Geolocation API から取得した座標をそのまま記録する方式とし、地図上でピンを指定する UI（Google Maps 等）は導入しない
- **Vitest** — 単体テスト（下記「テストや確認方法」参照）
- **（v2 以降）Stripe** — デポジットの決済・返金。v1 では API 呼び出しを一切行わない

未導入のものは、実際に使う段になってから `bun add` すること。先回りして依存を追加しない。

**現状との差分（実装着手時に解消すること）**: リポジトリは create-next-app の初期状態のため、Tailwind CSS v4（`@tailwindcss/postcss`、`app/globals.css`）と npm の `package-lock.json` がまだ残っている。上記の技術選定に合わせ、Tailwind の撤去・SCSS への移行・`package-lock.json` を `bun.lock` に置き換える作業が必要。

## よく使うコマンド

```bash
bun install      # 依存インストール
```

```bash
bun run dev      # 開発サーバー起動 (http://localhost:3000)
```

```bash
bun run build    # 本番ビルド。型エラーもここで出る
```

```bash
bun run lint     # ESLint
```

```bash
bun add <パッケージ名>        # 依存追加（開発用は -d を付ける）
```

Prisma 導入後は以下も使う（`npx` ではなく `bunx`）。

```bash
bunx prisma migrate dev --name <変更内容>   # スキーマ変更をマイグレーションとして作成・適用
```

```bash
bunx prisma generate                        # Prisma Client の型を再生成
```

```bash
bunx prisma studio                          # DB の中身を GUI で確認
```

## 編集してよいファイル / 触ってはいけないファイル

**触ってはいけない（自動生成物・手編集禁止）**

- `node_modules/`、`.next/` — ビルド生成物
- `next-env.d.ts` — Next.js が自動生成（gitignore 済み）
- `bun.lock` — 手編集せず、必ず `bun` コマンド経由で更新する（コミット対象。削除しない）
- このファイル冒頭の `<!-- BEGIN:nextjs-agent-rules -->` 〜 `<!-- END:nextjs-agent-rules -->` ブロック — `next dev` が再生成するため、消しても復活する
- `prisma/migrations/` の**適用済み**マイグレーションファイル — 過去のマイグレーションは書き換えず、新しいマイグレーションを追加して修正する
- `.env*` — 秘密情報。下記「秘密情報の扱い」参照

**編集してよい**

- `app/`、`components/`、`lib/`、`prisma/schema.prisma`、`README.md`、このファイルのルール部分（`# Walk to Wake` 以降）、各種設定ファイル

## コーディングルール

**ディレクトリ構成（実装時にこの形に育てる）**

- `app/` — ルーティングと画面。Route Handler もここ
- `components/` — 再利用する UI コンポーネント
- `lib/` — ドメインロジック。**距離判定・期限判定・ペナルティ金額計算は、DB やリクエストに依存しない純粋関数として必ずここに切り出す**（テスト対象にするため）
- `lib/config.ts` — しきい値・定数の集約先
- `prisma/schema.prisma` — DB スキーマ
- `app/globals.scss` — グローバルスタイル（リセット・フォント指定のみ。最小限に留める）
- `styles/_variables.scss` — 色・余白・ブレークポイントなどの SCSS 変数

**スタイル**

- スタイルは **CSS Modules（`*.module.scss`）** で書く。コンポーネントと同じ階層に `Foo.tsx` / `Foo.module.scss` の形で置く
- クラス名は **camelCase** で定義する（`styles.checkInButton` のようにドット記法で参照できるようにするため）
- 色・余白・ブレークポイントを各ファイルに直書きしない。`styles/_variables.scss` に集約して `@use` で読み込む
- SCSS のネストは深くしすぎない（3階層程度まで）
- グローバルスタイルに要素セレクタでの装飾を書き足さない。コンポーネント固有の見た目は必ず CSS Modules 側に置く

**ルール**

- **しきい値をハードコードしない。** 判定半径・期限の猶予・変更回数の上限・システム利用料率などの数値はすべて `lib/config.ts` に集約する。値そのものは README を正とする
- **Server Components をデフォルトにする。** `"use client"` は位置情報取得やフォーム操作などブラウザ API が必要なコンポーネントに限定し、できるだけ末端に置く
- **金額計算・距離計算をコンポーネント内に書かない。** 必ず `lib/` の純粋関数として実装し、コンポーネントからは呼ぶだけにする
- TypeScript は `strict: true`。`any` は使わない。型が付けられない場合は `unknown` を経由する
- import はパスエイリアス `@/` を使う（`@/lib/config` など）。相対パスの `../../` を連ねない
- 金額は**整数（円）**で扱う。浮動小数点で金額計算をしない
- **Stripe の決済 API を呼ぶコードを書かない。** v1 のスコープ外。金額計算ロジックまでに留める
- 位置情報は個人情報。**必要以上に保存せず、ログに座標を出力しない**

**記述言語**

- UI 文言、コード内コメント、コミットメッセージ、PR の説明: **日本語**
- 変数名・関数名・ファイル名などの識別子: **英語**

## テストや確認方法

テストは**重要なドメインロジックの単体テストに絞る**（Vitest）。網羅率は追わない。実行は `bunx vitest` を使う。

**テストを書く対象**

- 2点間の距離計算と、判定半径に対する内外判定
- 期限時刻の判定（日付境界・タイムゾーンを跨ぐケースを含む）
- ペナルティ金額・返金額の計算、および残高がペナルティ単価を下回った際の早期失敗判定（境界値のケースを必ず含める）
- 目標地点の変更回数が上限に達した際に変更を拒否する処理

**テストを書かない対象**

- 画面の見た目、Prisma のクエリそのもの、Auth.js の認証フロー

**変更後に必ず通すこと**

```bash
bun run lint
```

```bash
bun run build
```

位置情報が絡む画面は自動テストしない。Chrome DevTools の Sensors パネルで座標を偽装して手動確認する。

## コミットや PR のルール

**git flow に従う。** ブランチ運用は以下の通り。

- `master` — 本番相当。直接コミットしない。マージ元は `release/*` と `hotfix/*` のみ
- `develop` — 開発の統合ブランチ。通常の機能追加・修正の PR 先はここ
- `feature/<内容>` — 機能開発用。`develop` から分岐し、`develop` へ PR する
- `release/<バージョン>` — リリース準備用。`develop` から分岐し、`master` と `develop` の両方へマージする
- `hotfix/<内容>` — 本番の緊急修正用。`master` から分岐し、`master` と `develop` の両方へマージする

その他のルール:

- コミットメッセージは日本語で、何を変えたかが一文でわかるように書く
- PR を出す前に `bun run lint` と `bun run build` が通ることを確認する
- 要件に関わる変更をしたら、同じ PR で README も更新する。仕様と README がズレた状態でマージしない
- リモートは `origin` (https://github.com/suka-1102/walk_to_wake.git)

## 秘密情報の扱い

- 秘密情報は `.env.local` に置く。`.gitignore` で `.env*` は除外済みなので、**絶対にコミットしない**
- キー名だけを記した `.env.example`（値は空）は用意してコミットしてよい。実際の値は書かない
- このプロジェクトで扱う秘密情報:
  - `DATABASE_URL` — MySQL の接続文字列（パスワードを含む）
  - `AUTH_SECRET`、`AUTH_GOOGLE_ID`、`AUTH_GOOGLE_SECRET` — Auth.js と Google OAuth
  - （v2 以降）`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`
- **`NEXT_PUBLIC_` を付けた環境変数はブラウザに露出する。** 秘密情報には絶対に付けない
- 秘密情報の値を、コード・コミットメッセージ・PR の本文・README・ログ出力に書かない
- 秘密情報はサーバー側（Server Component / Route Handler）でのみ読む。Client Component から参照しない
