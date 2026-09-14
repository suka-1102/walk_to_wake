# 環境変数・秘密情報

秘密情報は `.env` に置き、**絶対にコミットしない**（`.env*` は gitignore 済み）。キー名だけを記した [.env.example](../.env.example)（値は空）は例外的にコミットする。

**置き場は `.env` 1つに揃える。** Next.js は `.env.local` も読むが、[prisma7.config.ts](../prisma7.config.ts) の `dotenv/config` は `.env` しか見ない。分けると `bunx prisma` 系のコマンドから `DATABASE_URL` が見えなくなる。

## 扱うキー

| キー | 用途 |
|---|---|
| `DATABASE_URL` | MySQL の接続文字列（パスワードを含む） |
| `AUTH_SECRET` | Auth.js のセッション暗号化 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | v2 以降。v1 では不要 |

## ルール

- **`NEXT_PUBLIC_` を秘密情報に絶対に付けない。** ブラウザに露出する
- サーバー側（Server Component / Route Handler）でのみ読む。Client Component から参照しない
- 値をコード・コミットメッセージ・PR・README・ログ出力に書かない
- キーを追加したら `.env.example` と上の表も更新する

## このマシンでの開発サーバー起動について

このPCはAvast（アンチウイルス）がHTTPS通信を検査のために横取りしており、Node.jsが標準では持たないAvastの証明書を信頼させないと、外部との通信（Google OAuthなど）が `fetch failed` で失敗する。

**Claude Codeのプレビュー機能（`.claude/launch.json` 経由）で起動すると、環境変数の設定が反映されない場合がある。** その場合は、別のターミナルを自分で開いて次のように起動する。

```powershell
$env:NODE_EXTRA_CA_CERTS = "C:\ProgramData\Avast Software\Avast\wscert.pem"
bun run dev
```

`.env` に `NODE_EXTRA_CA_CERTS` を書いても効かない（Next.js が読み込むタイミングでは Node.js 側のTLS初期化が既に終わっているため）。ターミナルで直接、コマンドの前に環境変数として渡す必要がある。
