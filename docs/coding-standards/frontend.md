# Frontend Coding Standards

## 基本

- React + TypeScript の関数コンポーネントを使う
- UIはTailwind CSS中心で実装する
- 型は明示し、`any` は避ける
- 小さな設定値は `src/config/` へ寄せる
- 外部API接続はhookに集約する

## コンポーネント

- 表示責務を持つコンポーネントは `src/components/` に置く
- データ取得を直接コンポーネントへ散らさない
- 同じカード/セクション構造を繰り返す場合は配列定義でレンダリングする
- 外部リンクは `target="_blank"` と `rel="noopener noreferrer"` を付ける

## Hooks

- Hyperliquid接続は `useHyperliquidMids.ts` に集約する
- WebSocketはunmount時にcloseする
- REST取得は失敗しても画面全体を落とさず、状態として扱う
- 価格比較のfallbackはユーザーに誤解を与えない名称にする

## 設定

銘柄追加時に確認する場所:

- `src/config/markets.ts`
- `src/components/ChartSection.tsx`
- `docs/data-sources.md`

ナビゲーション追加時に確認する場所:

- `src/config/navigation.ts`
- `src/components/FloatingNav.tsx`
- `src/components/ExplainerSections.tsx`
- `README.md`

## TradingView Widget

TradingViewのscriptはReact管理外のDOM操作です。

守ること:

- コンテナを `ref` で持つ
- 銘柄・widget種別変更時に中身をクリアする
- scriptを `.tradingview-widget-container` 内へappendする
- widgetが表示できないシンボルをハードコードし続けない

## スタイリング

- ダークテーマを基調にしつつ、色は単一色に寄せすぎない
- ボタン、カード、タブの角丸は控えめにする
- モバイル幅で横スクロールやテキスト重なりが起きないようにする
- 固定ナビがある画面では本文末尾の下余白を確保する

## 禁止事項

- 価格保証や投資助言に見える文言
- APIキーやログイン情報のコミット
- ユーザーの既存変更を無断で戻すこと
- 外部widget scriptを複数箇所へ無秩序に分散すること

## 検証

コード変更後は以下を実行します。

```bash
npm run format:check
npm run lint
npm run build
```
