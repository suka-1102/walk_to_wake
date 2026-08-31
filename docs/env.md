# 環境変数・秘密情報

秘密情報は `.env.local` に置き、**絶対にコミットしない**（`.env*` は gitignore 済み）。キー名だけを記した [.env.example](../.env.example)（値は空）は例外的にコミットする。

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
