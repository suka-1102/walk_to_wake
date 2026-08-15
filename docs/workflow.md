# git / PR

リモートは `origin` (https://github.com/suka-1102/walk_to_wake.git)。

## ブランチ運用（git flow）

| ブランチ | 用途 | 分岐元 | マージ先 |
|---|---|---|---|
| `master` | 本番相当。**直接コミットしない** | — | — |
| `develop` | 開発の統合ブランチ | `master` | — |
| `feature/<内容>` | 通常の機能追加・修正 | `develop` | `develop` |
| `release/<バージョン>` | リリース準備 | `develop` | `master` と `develop` の両方 |
| `hotfix/<内容>` | 本番の緊急修正 | `master` | `master` と `develop` の両方 |

`master` へのマージ元は `release/*` と `hotfix/*` のみ。

## PR を出す前に

- `bun run lint` と `bun run build` が通ることを確認する
- 要件に関わる変更なら、同じ PR で AGENTS.md の「仕様（決定事項）」も更新する。実装と仕様がズレた状態でマージしない
- 秘密情報の値がコード・コミットメッセージ・PR 本文に含まれていないか確認する

## 書き方

コミットメッセージと PR は日本語。何を変えたかが一文でわかるように書く。
