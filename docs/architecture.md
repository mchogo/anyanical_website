# Architecture

## 概要

Weekend Market Board は、Vite + React + TypeScript で構成された静的SPAです。バックエンドは持たず、ブラウザからHyperliquid Public API、TradingView widget、Investing.com iframeへ直接接続します。

主な目的は、公式市場が休場している週末・祝日でも、24時間365日動く参考価格を表示することです。

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
4. `candleSnapshot` から金曜クローズ付近の比較価格と過去6時間チャートを取得する
5. `MarketBoard` と関連ツールに価格データを渡して表示する

## Discord認証

Discordログインはバックエンドなしの静的SPAで動かすため、OAuth2 implicit grantを使います。

責務:

- `src/hooks/useDiscordAuth.ts`: Discord認可URL生成、`state` 検証、アクセストークン期限管理、`/users/@me` の取得
- `src/components/LoginPage.tsx`: ログイン画面、Discordリダイレクト後の処理、ログアウト
- `src/components/FloatingNav.tsx`: ログイン状態、Discord名、ログアウト導線の表示

必要な環境変数:

```text
VITE_DISCORD_CLIENT_ID=Discord ApplicationのClient ID
VITE_DISCORD_REDIRECT_URI=https://example.com/
VITE_DISCORD_GUILD_ID=Discord Server ID
VITE_DISCORD_PREMIUM_ROLE_IDS=Premium Role ID,Premium Role ID 2
VITE_DISCORD_ADMIN_ROLE_IDS=Admin Role ID
```

`VITE_DISCORD_REDIRECT_URI` を省略した場合は、現在の `origin + pathname` を使います。Discord Developer Portal のOAuth2 Redirectsにも同じURLを登録してください。

注意点:

- 静的SPAのため、Discord Client Secretは置かない
- 基本スコープは `identify`。`VITE_DISCORD_GUILD_ID` 設定時はサーバーロール確認のため `guilds.members.read` も要求する
- ログイン後のアクセストークンとユーザー情報は `localStorage` に保存し、期限切れ時に破棄する
- 対象サーバーに未参加、またはメンバー情報取得に失敗した場合は `guest` 扱いにする
- ロール分岐はフロントエンド表示の切り替え用。秘密情報や有料APIを保護する場合は、サーバー側でDiscordトークン検証とロール確認を行う
- Discord側のリダイレクトは `#access_token=...` 形式になるため、ハッシュルーティングより先にOAuthコールバックとして処理する

## 外部Widget

TradingView widget はReact管理外のscript挿入を行うため、専用コンポーネント内に閉じ込めています。

注意点:

- scriptは `.tradingview-widget-container` 内へappendする
- 銘柄変更時はコンテナをクリアしてから再生成する
- 表示不可のシンボルがあるため、CFDや暗号資産はTradingViewで表示可能な代替シンボルを複数検討する

## デプロイ前提

静的ビルド成果物は `dist/` です。Discordログインを有効化する場合は `VITE_DISCORD_CLIENT_ID` を設定します。

```bash
npm run build
```

詳しくは [operations/deployment.md](operations/deployment.md) を参照してください。
