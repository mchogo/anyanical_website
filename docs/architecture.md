# Architecture

## 概要

Weekend Market Board は、Vite + React + TypeScript で構成された静的SPAです。バックエンドは持たず、ブラウザからHyperliquid Public API、TradingView widget、Investing.com iframeへ直接接続します。

主な目的は、公式市場が休場している週末・祝日でも、Hyperliquid上で24時間365日取引されるperp価格を参考値として表示することです。

## アプリ構成

```text
src/
├── App.tsx
├── components/
├── config/
├── hooks/
├── index.css
└── main.tsx
```

責務:

- `App.tsx`: ハッシュルーティング、ページ構成、共通データ取得の接続
- `components/`: 相場ボード、チャート、説明セクション、ツールページ、固定ナビ
- `config/`: 銘柄定義、チャートシンボル、ナビゲーション、外部リンク
- `hooks/`: Hyperliquid API/WebSocketとの接続

## ルーティング

React Router は使わず、`window.location.hash` ベースの簡易ルーティングを採用しています。

理由:

- Cloudflare Pagesなどの静的ホスティングでrewrite設定なしに動作する
- ページ数が少なく、ルート定義が単純
- 外部ツール埋め込み中心のMVPとして依存を増やさない

現在の主要ルート:

- `/`
- `#/tools/currency-strength`
- `#/tools/economic-calendar`
- `#/tools/gap-watch`
- `#/tools/ea-checklist`
- `#/tools/strategy`
- `#/tools/community`
- `#/tools/participation`

## データフロー

1. `src/config/markets.ts` で表示対象銘柄を定義する
2. `useHyperliquidMids` がHyperliquid WebSocketへ接続する
3. `allMids` と `dex: "xyz"` の価格を購読する
4. `metaAndAssetCtxs.prevDayPx` から約24時間前比の比較価格を取得する
5. `MarketBoard` と関連ツールに価格データを渡して表示する

## 外部Widget

TradingView widget はReact管理外のscript挿入を行うため、専用コンポーネント内に閉じ込めています。

注意点:

- scriptは `.tradingview-widget-container` 内へappendする
- 銘柄変更時はコンテナをクリアしてから再生成する
- 表示不可のシンボルがあるため、CFDや暗号資産はTradingViewで表示可能な代替シンボルを複数検討する

## デプロイ前提

静的ビルド成果物は `dist/` です。環境変数は現状不要です。

```bash
npm run build
```

詳しくは [operations/deployment.md](operations/deployment.md) を参照してください。
