# CLAUDE.md

Weekend Market Board のプロジェクト固有ガイド。詳細な運用ルールは [AGENTS.md](AGENTS.md) と `docs/` にまとまっているため、ここでは要点と、AGENTS.md作成時点では未導入だった Cloudflare Workers + D1 バックエンドの実態を補足する。

## プロジェクト概要

Hyperliquid の24時間perp価格を使い、週末・祝日で公式市場が休場中でも参考価格を確認できるSPA。加えて、Discord OAuthログイン、コピートレード/EA案内ページ、そして自分の損益を記録・共有できる「損益カレンダー」機能を持つ。

- フロントエンド: Vite + React + TypeScript + Tailwind CSS(静的SPA、`window.location.hash`ベースのルーティング)
- バックエンド: Cloudflare Workers + D1(`worker/index.ts`、損益カレンダーの永続化とコピトレページ向け公開APIのみ)

## ディレクトリ構成

```
src/
├── components/   # 表示コンポーネント、ツールページ、固定ナビ
├── config/       # 銘柄定義、ナビゲーション定義
├── hooks/        # Hyperliquid接続、Discord認証、損益カレンダーAPI呼び出し
├── utils/        # canvas生成など純粋ロジック(例: pnlCard.ts)
├── App.tsx
└── main.tsx
worker/
└── index.ts      # Cloudflare Workers エントリ。全APIハンドラをここに集約
migrations/        # D1スキーマ(0001_pnl_calendar.sql, 0002_user_settings.sql, 0003_game_data.sql)
docs/              # 設計・運用・実装メモ(architecture, data-sources, ui-ux-guidelines, coding-standards, operations)
```

## 開発コマンド

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173   # Vite dev server(worker APIは別途 wrangler dev が必要)
npm run build                                  # tsc -b && vite build
npm run lint
npm run format / format:check
npx wrangler dev --port 8788                   # worker + D1 をローカルで動かす場合
```

`Makefile` があるので反復作業では `make dev` / `make check` を使ってよい。

## Cloudflare Workers + D1 バックエンド

`worker/index.ts` が全APIを1ファイルで処理する。大きく3種類のハンドラがある:

1. **認証必須API** (`handleApi`): `/api/pnl/*`(accounts, records CRUD)、`/api/favorites`、`/api/gap-predictions`、`/api/quiz-results`、`/api/admin/*`。すべて`Authorization: Bearer <Discordアクセストークン>`を`verifyToken`でDiscord APIに検証させ、`discord_user_id`でスコープする。`ADMIN_USER_IDS`(カンマ区切り、wrangler secret)に含まれるユーザーのみ`/api/admin/*`にアクセス可。
2. **公開API** (`handleShowcase`): `GET /api/pnl/showcase`のみ。認証不要で、コピトレページ(`CopyTradeGuidePage`)に埋め込む損益カード用データを返す。`SHOWCASE_ACCOUNT_IDS`(カンマ区切り、wrangler secret)で指定した口座**のみ**を対象にし、`notes`列は常にSELECTしない(個人の取引メモを公開ページに漏らさないため)。`year`/`month`クエリで今月から12ヶ月前まで遡れるが、範囲外はサーバー側でも400を返して二重に防御している。
3. **静的アセット配信**: 上記以外は`env.ASSETS.fetch(request)`にフォールバックする(SPA本体)。

D1テーブル(`migrations/`):
- `accounts(id, discord_user_id, name, unit, created_at)` / `daily_records(id, account_id, discord_user_id, date, pnl, notes, UNIQUE(account_id, date))` — 損益カレンダー本体
- `user_settings(discord_user_id, favorites_json)` — お気に入り
- `gap_predictions`, `quiz_results` — ゲーム機能

**ローカル開発**: `wrangler dev`は`.dev.vars`(gitignore対象)を自動で読む。`.dev.vars.example`をコピーして`ADMIN_USER_IDS`/`SHOWCASE_ACCOUNT_IDS`を埋める。本番はwrangler secretで設定し、`wrangler.jsonc`にはコミットしない。

**新しい公開エンドポイントを追加するとき**は、認証をバイパスする以上、レスポンスに含めるカラムを都度精査すること(`notes`のような個人情報カラムを不用意に含めない)。

## フロントエンド実装ルール(AGENTS.mdより抜粋)

- Hyperliquid接続は`src/hooks/useHyperliquidMids.ts`に集約。新銘柄は`src/config/markets.ts`の`symbolCandidates`に複数候補を持たせる
- Discord認証は`src/hooks/useDiscordAuth.ts`(OAuth2 implicit grant、Client Secretは置かない)
- TradingView widgetは`.tradingview-widget-container`内へscriptをappendする既存パターンに従う
- 損益カード(canvas生成PNG)は`src/utils/pnlCard.ts`に集約。`PnLCalendar.tsx`(自分の損益カレンダー編集画面)と`BrandPages.tsx`の`PnLShowcaseCard`(コピトレページの公開実績表示)の両方から再利用している
- 表示文言は「参考情報」「参考値」のトーンを守り、「保証」「必ず」「勝てる」等は禁止

## セキュリティ・コンプライアンス

- APIキー、Discord Client Secret、口座ログイン情報、`.dev.vars`をコミットしない
- 損益カレンダーのdaily_recordsは`discord_user_id`でスコープされたユーザー自身のデータ。公開エンドポイント追加時は必ずスコープと除外カラムを確認する
- 外部リンク・アフィリエイトリンクは`docs/operations/external-links.md`または`src/config/navigation.ts`に集約する

## 品質ゲート

コード変更後は必ず実行する:

```bash
npm run format:check
npm run lint
npm run build
```

UI変更時は、モバイル幅(375px)での崩れ、固定ナビとの重なりを目視確認する。worker/D1を変更した場合は`npx wrangler dev`でエンドポイントをcurl確認する。

## ブランチ・コミット運用

- ユーザーの明示依頼なしにコミット・プッシュしない
- ユーザーの既存の変更を無断で戻さない
- コミットメッセージはConventional Commits形式(例: `feat: add pnl showcase tabs`)

## 参考ドキュメント

- [AGENTS.md](AGENTS.md) — AIエージェント向け詳細ガイド(このファイルの元)
- [README.md](README.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/data-sources.md](docs/data-sources.md)
- [docs/ui-ux-guidelines.md](docs/ui-ux-guidelines.md)
- [docs/coding-standards/frontend.md](docs/coding-standards/frontend.md)
- [docs/operations/external-links.md](docs/operations/external-links.md)
- [docs/operations/deployment.md](docs/operations/deployment.md)
