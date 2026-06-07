# External Links

## 管理方針

外部リンクは、ユーザー導線と運用上の変更頻度が高いため、この文書にも記録します。リンクを変更した場合は、該当コンポーネントとこの文書を同時に更新してください。

## 口座開設

| 用途           | URL                  | 表示場所             |
| -------------- | -------------------- | -------------------- |
| Exness口座開設 | `https://x.gd/CxfuR` | 説明セクション / CTA |

## HFM Copy Trading

| ストラテジー   | ID          | ロット比率                | URL                                                                      |
| -------------- | ----------- | ------------------------- | ------------------------------------------------------------------------ |
| Anya Gold Cent | `153191918` | `0.01ロット / 2000セント` | `https://my.hfm.com/jp/copy-trading/provider-details?provider=153191918` |
| Anya Gold      | `147038068` | `0.01ロット / 1000ドル`   | `https://my.hfm.com/jp/copy-trading/provider-details?provider=147038068` |

表示時の注意:

- 半裁量EA・全自動EAを利用できる旨は、過度な利益訴求にならない形で書く
- 資金量、ロット比率、口座タイプの確認を促す
- 利益保証や損失回避を示唆しない

## その他リンク

| 用途                          | URL                       | 表示場所              |
| ----------------------------- | ------------------------- | --------------------- |
| サブスク / Discord / 各種案内 | `https://lit.link/anyafx` | 固定ナビ / 関連ツール |

## 外部Widget

| 用途       | 提供元        | 実装場所                          |
| ---------- | ------------- | --------------------------------- |
| 実チャート | TradingView   | `src/components/ChartSection.tsx` |
| 通貨強弱   | TradingView   | `src/components/RelatedTools.tsx` |
| 経済指標   | Investing.com | `src/components/RelatedTools.tsx` |

## リンク属性

外部リンクには原則として以下を付与します。

```tsx
rel = 'noopener noreferrer';
target = '_blank';
```

紹介・広告性のあるリンクは、必要に応じて `nofollow` も検討します。
