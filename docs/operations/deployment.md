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

| 項目                   | 値              |
| ---------------------- | --------------- |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Framework preset       | Vite            |
| Environment variables  | 現状不要        |

ハッシュルーティングのため、`#/tools/...` のページは追加rewriteなしで動作します。

## Cloudflare Pages Deploy Command例

Cloudflare側の画面でDeploy commandが必須の場合は、Pages deployで `dist` とプロジェクト名を明示します。

| 項目           | 値                                                               |
| -------------- | ---------------------------------------------------------------- |
| Build command  | `npm run build`                                                  |
| Deploy command | `npx wrangler pages deploy dist --project-name anyanicalwebsite` |

`dist/` をCloudflare Pagesへアップロードします。`--project-name` はCloudflare側のプロジェクト名に合わせています。

`dist` と `--project-name` をコマンド側で明示するため、`wrangler.jsonc` は不要です。

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
- `#/tools/ea-checklist` が表示される
- 固定ナビがモバイルで本文を隠しすぎない

## 障害時の切り分け

価格が出ない:

- ブラウザDevToolsでWebSocket接続を確認する
- Hyperliquid側の銘柄名変更を疑い、`src/config/markets.ts` の `symbolCandidates` を見直す
- `prevDayPx` がない場合は比較価格なしとして扱う

チャートが出ない:

- TradingViewで該当シンボルが外部widget表示に対応しているか確認する
- 先物シンボルではなくOANDA/TVC/BINANCEなどの代替シンボルを試す
- script挿入先が `.tradingview-widget-container` 内になっているか確認する

経済指標が出ない:

- Investing.com iframeのURL変更や埋め込み制限を確認する
- 必要であれば代替カレンダー表示を検討する
