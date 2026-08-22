# Deployment

## 前提

Weekend Market Board は静的SPAです。ビルド成果物 `dist/` を静的ホスティングへ配置します。

推奨:

- Node.js 22系
- npm
- HTTPS配信

## ローカル確認

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

## ビルド

```bash
npm run build
```

成果物:

```text
dist/
```

## Cloudflare Pages例

| 項目                   | 値                       |
| ---------------------- | ------------------------ |
| Build command          | `npm run build`          |
| Build output directory | `dist`                   |
| Framework preset       | Vite                     |
| Environment variables  | `VITE_DISCORD_CLIENT_ID` |

ハッシュルーティングのため、`#/tools/...` のページは追加rewriteなしで動作します。

## Discordログイン設定

Discord Developer PortalでApplicationを作成し、OAuth2 Redirectsに本番URLを登録します。

例:

```text
https://example.com/
```

Cloudflare側の環境変数:

```text
VITE_DISCORD_CLIENT_ID=Discord ApplicationのClient ID
VITE_DISCORD_REDIRECT_URI=https://example.com/
VITE_DISCORD_GUILD_ID=Discord Server ID
VITE_DISCORD_PREMIUM_ROLE_IDS=Premium Role ID
VITE_DISCORD_ADMIN_ROLE_IDS=Admin Role ID
```

`VITE_DISCORD_REDIRECT_URI` は省略可能ですが、本番では明示しておくとプレビューURLや独自ドメイン差し替え時の事故を避けやすくなります。

ロールIDを使う場合:

- Discordユーザー設定の詳細設定で開発者モードを有効にする
- 対象サーバーを右クリックしてサーバーIDをコピーする
- 対象ロールを右クリックしてロールIDをコピーする
- 複数ロールは `,` 区切りで環境変数へ指定する

## Cloudflare Workers Static Assets例

Cloudflare側の画面でDeploy commandが必須で、プロジェクトがWorkerとして作成されている場合は、Workers Static Assetsとしてデプロイします。

| 項目           | 値                    |
| -------------- | --------------------- |
| Build command  | `npm run build`       |
| Deploy command | `npx wrangler deploy` |

`wrangler.jsonc` の `name` はCloudflare側のWorker名 `anyanicalwebsite` に合わせています。

`assets.directory` は `./dist` です。SPAとして動かすため、`assets.not_found_handling` は `single-page-application` にしています。

## Wrangler secrets

管理者向けAPIやSNS話題まとめの書き込みAPIは、`wrangler secret put <NAME>` で設定するシークレットに依存します（`.dev.vars`はローカル専用、本番はwrangler secret）。

| シークレット名                                   | 用途                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_USER_IDS`                                 | `/api/admin/*` を叩けるDiscordユーザーID（カンマ区切り）                                                                                                                                                                                                                                                                                                                        |
| `SHOWCASE_ACCOUNT_IDS`                           | `/api/pnl/showcase` で公開する口座ID（カンマ区切り）                                                                                                                                                                                                                                                                                                                            |
| `MATOME_WRITE_KEY`                               | `POST /api/matome/entries`（market-digest-bot/Hermes自動投稿）を保護する共有キー。Hermes側の環境変数`MATOME_WRITE_KEY`と同じ値を設定する                                                                                                                                                                                                                                        |
| `HTF_CONTEXT_WRITE_KEY`                          | `POST /api/htf-context`（TradingView Anyanical Toolkit 3.0/3.1のAI環境認識アラートWebhook）を保護する共有キー。TradingViewのWebhookアラートはカスタムHTTPヘッダーを指定できないため、Webhook URLを`https://anyanical.com/api/htf-context?key=<この値>`のようにクエリパラメータ形式で設定する（`X-Htf-Context-Write-Key`ヘッダーもcurl等の手動確認用に後方互換として受け付ける） |
| `HTF_DIGEST_WEBHOOK_H4` / `_D1` / `_W1` / `_MN1` | HTFコンテキストDiscordダイジェスト（`scheduled()`のCron Trigger）の送信先Discord Incoming Webhook URL。時間足ごとに送信先を分ける設計のため4つ個別に設定する。未設定の時間足はダイジェスト送信自体をスキップする                                                                                                                                                                |

新規デプロイ・鍵ローテーション時は`npx wrangler secret put MATOME_WRITE_KEY`（または他のシークレット名）で更新し、送信側（Hermes / TradingViewアラート設定）も同時に更新する。

`GET /api/htf-context`・`GET`/`PUT /api/htf-context/favorites`（プレミアム会員向けの表示・お気に入り保存）は新規シークレットを増やさず、既存の`DISCORD_GUILD_ID`/`GPT_ALLOWED_ROLE_IDS`（`GET /api/gpt/access`と同じプレミアムロール判定）・Discord OAuthアクセストークンをそのまま流用する。

## Cron Trigger

`wrangler.jsonc`の`triggers.crons`にHTFコンテキストDiscordダイジェスト用の4つのスケジュールを定義している。

D1/W1/MN1のアンカーはUTC 00:00(=JST 09:00)固定。対象銘柄の大半を占める為替/貴金属の日足終値（NYクローズ17:00、夏時間JST06:00・冬時間JST07:00）から2〜3時間のバッファを取れる時刻として選定した（日足以上は数時間のズレが実害になりにくいため、夏/冬時間の自動追従はせず固定時刻のまま）。

H4だけは4時間ごとの実際のローソク境界からのズレが鮮度に直結するため、`worker/index.ts`側で動的に判定する。Cron自体は`*/10 * * * *`で10分おきに発火するが、`isH4DigestDue()`が米国夏時間/冬時間を`isUsSummerTime()`（`gas/tradingview_discord_alert/Ananical AI.gs`の`isUSSummerTime()`と同じ計算式）で判定し、「NYクローズ(17:00 NY)から30分後」を基準に4時間おきの6タイミングだけ実際に送信する（それ以外の10分おきの呼び出しは即returnで実質無料）。

| 時間足 | Cron式(UTC)                | 送信タイミング                                                                                   |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------ |
| H4     | `*/10 * * * *`（動的判定） | 夏時間: JST 06:30/10:30/14:30/18:30/22:30/02:30、冬時間: JST 07:30/11:30/15:30/19:30/23:30/03:30 |
| D1     | `0 0 * * *`                | 毎日JST09:00                                                                                     |
| W1     | `0 0 * * 1`                | 毎週月曜JST09:00                                                                                 |
| MN1    | `0 0 1 * *`                | 毎月1日JST09:00                                                                                  |

`wrangler deploy`で自動的に本番へ登録される。動作確認は`npx wrangler dev --test-scheduled`でローカル起動し、`curl "http://localhost:8788/__scheduled?cron=<URLエンコードしたcron式>"`で手動発火できる（ローカルでは`wrangler.jsonc`の`assets.run_worker_first`を一時的に`true`にしないと`/__scheduled`がWorkerまで届かないので注意。確認後は必ず`["/api/*"]`に戻す）。

## D1マイグレーション

`migrations/0008_matome_entries.sql`（SNS話題まとめ用テーブル）、`migrations/0010_htf_context.sql`（HTF環境認識ボード用テーブル）、`migrations/0011_htf_context_favorites.sql`（HTFコンテキストお気に入り列追加）、`migrations/0012_htf_digest_last_sent.sql`（Discordダイジェスト重複送信防止）、`migrations/0013_htf_context_search_presets.sql`（検索条件プリセットテーブル、新規）を含め、本番D1への適用はユーザーが実行する。

```bash
npx wrangler d1 migrations apply pnl-calendar --remote
```

### ローカル検証手順（0013適用時に実施した内容）

新しいマイグレーションを追加したときは、リモート適用の前にローカルD1で以下を確認する。

```bash
# 適用前後のテーブル一覧・スキーマ・件数を比較する
npx wrangler d1 execute pnl-calendar --local --command "SELECT name FROM sqlite_master WHERE type='table';"
npx wrangler d1 migrations apply pnl-calendar --local
npx wrangler d1 execute pnl-calendar --local --command "PRAGMA table_info(<新テーブル名>);"
npx wrangler d1 execute pnl-calendar --local --command "SELECT COUNT(*) FROM <新テーブル名>;"
```

`htf_context_search_presets`は「同一ユーザーにつき既定プリセットは最大1件」を部分ユニークインデックス（`WHERE is_default = 1`）で強制している。ローカルD1へ同一`discord_user_id`で`is_default=1`の行を2件INSERTしようとして`UNIQUE constraint failed`が返ることを確認済み。

認可（他ユーザーのプリセットが見えない・操作できない）の検証は、`verifyToken()`に一時的な検証用分岐（`token.startsWith('testuser:')`で任意のIDを返す）を追加し、`wrangler dev --local`起動中に`curl`で複数の疑似ユーザーIDから叩いて確認したあと、**その分岐は必ず元に戻してから**コミット・デプロイする（本番コードに認証バイパスを残さない）。

```bash
npx wrangler dev --local --port 8788
curl -H "Authorization: Bearer testuser:userA" http://localhost:8788/api/htf-context/search-presets
```

## デプロイ前チェック

```bash
npm run format:check
npm run lint
npm run build
```

目視確認:

- トップページでHyperliquid価格が更新される
- TradingViewチャートが初期表示される
- `#/tools/currency-strength` が表示される
- `#/tools/economic-calendar` が表示される
- `#/tools/gap-watch` が表示される
- `#/matome` が表示される（データ0件でも「この月のまとめはまだありません。」が出ればOK）
- `#/tools/ea-checklist` が表示される
- `#/tools/htf-context`（Anyanical Market Dashboard）が、非プレミアムではプレミアム案内＋サンプル画像＋Toolkitリンク、プレミアムでは時間足タブ（MN1/W1/D1/H4）・強調詳細バー（TradingViewで開くリンク付き）・お気に入り・カテゴリ別一覧表（データ未着なら「データ待ち」表示、行/カードクリックで詳細バーに反映）として表示される
- `#/login` にDiscordログインボタンが表示される
- 固定ナビがモバイルで本文を隠しすぎない

## 障害時の切り分け

価格が出ない:

- ブラウザDevToolsでWebSocket接続を確認する
- Hyperliquid側の銘柄名変更を疑い、`src/config/markets.ts` の `symbolCandidates` を見直す
- `candleSnapshot` が取得できない場合は金曜基準価格なしとして扱う

チャートが出ない:

- TradingViewで該当シンボルが外部widget表示に対応しているか確認する
- 先物シンボルではなくOANDA/TVC/BINANCEなどの代替シンボルを試す
- script挿入先が `.tradingview-widget-container` 内になっているか確認する

経済指標が出ない:

- Investing.com iframeのURL変更や埋め込み制限を確認する
- 必要であれば代替カレンダー表示を検討する
