# Weekend Market Board エージェント向けガイド

> 対象: OpenAI Codex / GitHub Copilot / Cursor などのAIエージェントおよび支援を受ける開発者
> 目的: Hyperliquid 24/7 perp価格を使った週末相場ボードを、安全かつ一貫した方針で保守する

---

## 1. TL;DR

- **日本語で回答する**: ユーザー向け説明、レビュー、PR文面は原則日本語で行う
- **小さく変更する**: UI、データ取得、外部リンク、ドキュメントの責務を混ぜすぎない
- **外部データは参考値として扱う**: Hyperliquid perp、TradingView、Investing.com、HFM/Exnessリンクは価格保証や投資助言として表現しない
- **検証必須**: コード変更後は `npm run format:check`、`npm run lint`、`npm run build` を通す
- **秘密情報を置かない**: APIキー、口座ログイン情報、個人情報、アフィリエイト管理画面情報をコミットしない
- **UIはレスポンシブ優先**: スマホでの可読性、固定ナビとの重なり、横スクロールの破綻を確認する
- **TradingView埋め込みはDOM構造を守る**: `.tradingview-widget-container` 内にscriptをappendする既存パターンに従う
- **コミット/プッシュ禁止**: ユーザーから明示依頼があるまでコミット・プッシュはしない

---

## 2. リポジトリ概要

```
.
├── src/
│  ├── components/       # 表示コンポーネント、ツールページ、固定ナビ
│  ├── config/           # 銘柄定義、ナビゲーション定義
│  ├── hooks/            # Hyperliquid API/WebSocket接続
│  ├── App.tsx           # ハッシュルーティングとページ構成
│  ├── main.tsx          # Reactエントリ
│  └── index.css         # Tailwindとグローバル背景
├── worker/index.ts      # Cloudflare Workers バックエンド（全APIエンドポイント集約）
├── migrations/          # D1 SQLマイグレーション（連番 000N_*.sql）
├── wrangler.jsonc       # Workers/D1設定
├── docs/                # 設計・運用・実装メモ
├── package.json         # npm scripts
├── vite.config.ts       # Vite設定
└── tailwind.config.ts   # Tailwind設定
```

バックエンドは Cloudflare Workers + D1（2026-07時点で導入済み。認証はDiscord OAuthトークンを`verifyToken`で検証し、`discord_user_id`でデータをスコープする）。価格データはブラウザからHyperliquid Public API/WebSocketを直接利用。マイグレーションの適用は `npx wrangler d1 migrations apply <db>` をユーザーが実行する。

---

## 3. 開発環境

前提:

- Node.js 22系以上を推奨
- npmを使用

初回セットアップ:

```bash
npm install
```

開発サーバー:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

本番ビルド:

```bash
npm run build
```

---

## 4. npm / Make コマンド方針

| コマンド               | 用途                          |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Vite開発サーバー              |
| `npm run build`        | TypeScript build + Vite build |
| `npm run lint`         | ESLint                        |
| `npm run format`       | Prettier整形                  |
| `npm run format:check` | Prettier確認                  |

`Makefile` がある場合は、反復作業では `make install` / `make dev` / `make check` を優先してよい。

---

## 5. 実装ルール

### データ取得

- Hyperliquid WebSocketは `src/hooks/useHyperliquidMids.ts` に集約する
- `allMids` は通常perpと `dex: "xyz"` の両方を購読する
- 約24時間前比は `metaAndAssetCtxs.prevDayPx` を優先し、取得不可時のみ初回取得価格へフォールバックする
- 新しい銘柄は `src/config/markets.ts` の `symbolCandidates` に候補を複数定義する
- 実在確認はHyperliquid Public APIで行い、存在しない銘柄は「データなし」として扱う

### UI

- 主要画面は金融ダッシュボード風のダークテーマを維持する
- 固定ナビは `FloatingNav.tsx` に集約し、本文に重ならないよう `App.tsx` の下余白も考慮する
- Toolページはハッシュルーティング `#/tools/...` で提供する。Cloudflare Pagesで追加設定なしに動くことを優先する
- TradingView widgetは既存の `TradingViewScriptWidget` / `TradingViewWidget` のDOM構造に従う
- 外部リンクは `rel="noopener noreferrer"` を付ける。広告/紹介系は必要に応じて `nofollow` も付ける

### 文言

- 表示価格は「参考情報」「perp実取引値」として表現する
- 「必ず儲かる」「保証」「公式価格と同一」などの表現は禁止
- 口座開設、EA、ストラテジーへの誘導はリスク説明や確認事項とセットで扱う

---

## 6. セキュリティ・コンプライアンス

- APIキーやログイン情報をリポジトリに置かない
- URL短縮リンク、紹介リンク、ストラテジーURLは `docs/operations/external-links.md` または `src/config/navigation.ts` / 該当コンポーネントに集約する
- 外部iframe/scriptは信頼済みソースに限定する
- ユーザー入力を保存・送信する機能は現状なし。追加する場合は入力検証、XSS対策、プライバシー方針を先に設計する

---

## 7. 品質ゲート

コード変更後は以下を実行する:

```bash
npm run format:check
npm run lint
npm run build
```

UI変更時は、少なくとも以下を目視確認する:

- トップページ
- `#/tools/currency-strength`
- `#/tools/economic-calendar`
- `#/tools/gap-watch`
- `#/tools/ea-checklist`
- モバイル幅で固定ナビが本文を隠しすぎないこと

---

## 8. ブランチ・コミット運用

- コード変更開始前に `git status --short` を確認する
- ユーザー変更を勝手に戻さない
- ユーザーの明示依頼なしにコミット・プッシュしない
- コミットメッセージを提案する場合は Conventional Commits 形式を使う
  - 例: `feat: add floating tool navigation`
  - 例: `docs: add agent guide and architecture notes`

---

## 9. 参考ドキュメント

- [README.md](README.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/data-sources.md](docs/data-sources.md)
- [docs/ui-ux-guidelines.md](docs/ui-ux-guidelines.md)
- [docs/operations/external-links.md](docs/operations/external-links.md)
- [docs/operations/deployment.md](docs/operations/deployment.md)
- [docs/coding-standards/frontend.md](docs/coding-standards/frontend.md)
