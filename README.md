# Weekend Market Board

Hyperliquidの24時間365日perp価格を使い、金・銀・原油・S&P500・日経225・ドル円などの週末変動を確認するライブボードです。

土日や祝日に公式市場が休場している間も、Hyperliquid HIP-3 perpの実取引価格を参考に、週末ニュースでどれだけ動いたかを確認できます。

---

## 主な機能

- Hyperliquid WebSocket `allMids` のリアルタイム購読
- HIP-3 `xyz` DEXの金属・原油・指数・為替perp表示
- `prevDayPx` を使った約24時間前比
- 金曜クローズ基準の参考セクション
- TradingViewチャートタブ
- 通貨強弱、経済指標、窓開け監視、EAチェックリストの別ページ
- Exness/HFM/Anya Goldストラテジー導線
- 固定追尾ナビ

---

## 技術スタック

- Vite
- React
- TypeScript
- Tailwind CSS
- ESLint
- Prettier
- npm

バックエンドはありません。ブラウザから外部Public API / widgetを直接利用します。

---

## クイックスタート

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

ブラウザで開く:

```text
http://127.0.0.1:5173/
```

---

## 主要ページ

| URL                         | 内容                   |
| --------------------------- | ---------------------- |
| `/`                         | 相場ボード             |
| `#/tools/currency-strength` | 通貨強弱・ヒートマップ |
| `#/tools/economic-calendar` | 経済指標カレンダー     |
| `#/tools/gap-watch`         | 窓開け監視ボード       |
| `#/tools/ea-checklist`      | EA運用チェックリスト   |

ハッシュルーティングのため、Cloudflare Pagesなどの静的ホスティングで追加rewriteなしに動作します。

---

## 開発コマンド

| コマンド               | 説明                    |
| ---------------------- | ----------------------- |
| `npm run dev`          | 開発サーバー            |
| `npm run build`        | TypeScript + Viteビルド |
| `npm run lint`         | ESLint                  |
| `npm run format`       | Prettier整形            |
| `npm run format:check` | Prettier確認            |

---

## 外部データソース

- Hyperliquid Public API / WebSocket
- TradingView external embedding widgets
- Investing.com economic calendar iframe
- HFM Copy Trading provider detail links
- Exness口座開設リンク
- lit.link/anyafx

詳細は [docs/data-sources.md](docs/data-sources.md) と [docs/operations/external-links.md](docs/operations/external-links.md) を参照してください。

---

## 品質確認

コード変更後は以下を通してください。

```bash
npm run format:check
npm run lint
npm run build
```

---

## Cloudflare Deploy

Cloudflare Workers側でDeploy commandが必須の画面を使う場合:

```text
Build command: npm run build
Deploy command: npx wrangler pages deploy dist --project-name anyanical_website
```

`dist/` をCloudflare Pagesへアップロードします。`--project-name` はCloudflare側のプロジェクト名に合わせています。

---

## 注意事項

本アプリの価格表示は情報提供のみを目的とした参考値です。公式スポット価格、CME/NYSE/東証/OTC FX、各社CFD価格とは差が生じる場合があります。

投資判断、売買推奨、価格保証を目的としたものではありません。実際の取引価格や条件は利用する取引所・証券会社で確認してください。
