# Data Sources

## 方針

本アプリの価格・チャート・カレンダーはすべて参考情報です。公式市場価格、各ブローカーのCFD価格、OTC FX価格、約定可能価格とは差が生じる場合があります。

## Hyperliquid

用途:

- 週末モードの24時間取引価格
- 金曜クローズ付近を基準にした週末変動
- 窓開け監視の参考値

接続先:

- WebSocket: `wss://api.hyperliquid.xyz/ws`
- REST: `https://api.hyperliquid.xyz/info`

使用データ:

- `allMids`: 現在のmid price
- `candleSnapshot`: 金曜クローズ付近の参考価格と過去6時間チャート
- `dex: "xyz"`: 金属・原油・指数・為替の24時間取引価格取得

実装場所:

- `src/hooks/useHyperliquidMids.ts`
- `src/config/markets.ts`

注意:

- 24時間取引市場の参考価格であり、CME/NYSE/東証/店頭FXの公式価格ではありません
- 祝日や週末は公式市場側が止まるため、差分表示の意味を画面上で説明する必要があります
- 銘柄名は変更・追加される可能性があるため、`symbolCandidates` には候補を複数持たせます

## TradingView

用途:

- 実チャート表示
- 通貨強弱
- クロスレート
- 経済指標カレンダー

使用Widget:

- Advanced Chart
- Forex Heat Map
- Forex Cross Rates
- Events Calendar

実装場所:

- `src/components/ChartSection.tsx`
- `src/components/RelatedTools.tsx`

代表シンボル:

- `OANDA:XAUUSD`
- `OANDA:XAGUSD`
- `TVC:USOIL`
- `OANDA:SPX500USD`
- `OANDA:JP225USD`
- `OANDA:USDJPY`
- `BINANCE:BTCUSDT`

注意:

- TradingView上のみ利用可能なシンボルは外部サイト埋め込みで表示できないことがあります
- 先物シンボルより、表示互換性の高いCFD/FX/cryptoシンボルを優先します

## Investing.com

用途:

- 経済指標カレンダーの代替確認先

実装場所:

- `src/components/RelatedTools.tsx`

注意:

- TradingView側に表示制限が発生した場合の確認リンクとして扱います
- 表示言語・タイムゾーンは外部側の仕様変更の影響を受けます

## SNS話題まとめ（matome_entries）

用途:

- `#/matome` ページに表示するXの話題投稿＋あにゃのコメント
- market-digest-bot（Discord日次ダイジェスト）の「🔥 昨日のSNS話題」セクションが同じAPIを参照

データの出所:

- 投稿・生成はHermes Agentが担当（`scripts/prompts/research_matome.md`）。本アプリはHermesが生成したJSONを検証・保存・表示するだけで、SNS検索やコメント文生成のロジックは持たない
- 選定・コメントは全自動（人間の事前レビューなし）。誤情報・不適切投稿の掲載リスクを許容した上での運用方針（2026-08-13、ユーザー承認済み）。問題があれば管理者が`hidden`フラグで非表示にする

実装場所:

- `migrations/0008_matome_entries.sql`（D1テーブル）
- `worker/index.ts` の `handleMatomeEntries`（`GET /api/matome/entries` 公開、`POST /api/matome/entries` は `MATOME_WRITE_KEY` 共有シークレットで保護）、および `PATCH /api/admin/matome-entries/:id`（管理者のみ、非表示切替）
- `scripts/publish-matome-entry.mjs`（HermesのJSON標準出力を検証してAPIへPOSTする一次スクリプト）
- `src/hooks/useMatomeEntries.ts` / `src/components/MatomePage.tsx`

注意:

- `POST`/`PATCH`はDiscord OAuthを経由しない（HermesはDiscordトークンを持たない）ため、`MATOME_WRITE_KEY`のみで保護している。この鍵はWebhook URLやAPIキーと同様、回答・ログ・新規ファイルへ転記しない
- 掲載は投稿者本人の許諾を得たものではない。運営窓口への削除依頼があれば`hidden=1`で即座に非表示にする運用を前提とする

## HFM / Exness / lit.link

用途:

- 口座開設、コピートレード、サブスク、Discordなどの外部リンク

リンク管理:

- `src/config/navigation.ts`
- `src/components/ExplainerSections.tsx`
- [operations/external-links.md](operations/external-links.md)

注意:

- 紹介リンクや短縮URLは変更時にドキュメントも更新します
- 投資助言・利益保証に見える文言は避けます
