export type HtfContextCategoryId =
  | 'main'
  | 'usd-straight'
  | 'jpy-cross'
  | 'other-fx'
  | 'metal'
  | 'crypto'
  | 'index';

export type HtfContextCategory = {
  id: HtfContextCategoryId;
  label: string;
  symbols: string[];
};

// 為替28銘柄（ドルストレート7+クロス円6+その他通貨15）・貴金属2・仮想通貨2・指数3は、既存のGAS通知
// (gas/tradingview_discord_alert/Ananical AI.gs の SYMBOL_GROUPS)で実際に運用している銘柄群と一致させている。
// 「メイン」はドルストレート/貴金属から抜粋した参照用ハイライトタブで、新しい銘柄を追加するものではない
// （他カテゴリと重複表示になる）。増やす場合はTradingView側のアラート追加（銘柄×時間足の数だけ手動設定が
// 必要）とあわせてここと worker/index.ts の HTF_CONTEXT_ALLOWED_SYMBOLS / HTF_DIGEST_GROUPS も更新する。
export const HTF_CONTEXT_CATEGORIES: HtfContextCategory[] = [
  {
    id: 'main',
    label: 'メイン',
    symbols: ['USDJPY', 'XAUUSD', 'EURUSD', 'GBPUSD'],
  },
  {
    id: 'usd-straight',
    label: 'ドルストレート',
    symbols: ['AUDUSD', 'EURUSD', 'GBPUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY'],
  },
  {
    id: 'jpy-cross',
    label: 'クロス円',
    symbols: ['EURJPY', 'GBPJPY', 'AUDJPY', 'NZDJPY', 'CADJPY', 'CHFJPY'],
  },
  {
    id: 'other-fx',
    label: 'その他通貨',
    symbols: [
      'AUDCAD',
      'AUDCHF',
      'AUDNZD',
      'CADCHF',
      'EURAUD',
      'EURCAD',
      'EURCHF',
      'EURGBP',
      'EURNZD',
      'GBPAUD',
      'GBPCAD',
      'GBPCHF',
      'GBPNZD',
      'NZDCAD',
      'NZDCHF',
    ],
  },
  {
    id: 'metal',
    label: '貴金属',
    symbols: ['XAUUSD', 'XAGUSD'],
  },
  {
    id: 'crypto',
    label: '仮想通貨',
    symbols: ['BTCUSDT', 'ETHUSDT'],
  },
  {
    id: 'index',
    label: '指数',
    symbols: ['NAS100USD', 'SPX500USD', 'JP225YJPY'],
  },
];

export const HTF_CONTEXT_ALL_SYMBOLS = Array.from(
  new Set(HTF_CONTEXT_CATEGORIES.flatMap((category) => category.symbols)),
);

// 銘柄が実際に属するカテゴリを解決する（カテゴリ切替時の選択銘柄整合、URL復元の両方で使う共通ロジック）。
// preferredCategoryIdが指定され、かつその銘柄を含む場合はそれを優先する（「メイン」タブで選んだ
// USDJPYは「メイン」のまま扱う等）。含まない場合は先頭から探した最初のカテゴリへ補正する。
export const getCategoryForSymbol = (
  symbol: string,
  preferredCategoryId?: HtfContextCategoryId | null,
): HtfContextCategoryId => {
  if (preferredCategoryId) {
    const preferred = HTF_CONTEXT_CATEGORIES.find((c) => c.id === preferredCategoryId);
    if (preferred && preferred.symbols.includes(symbol)) return preferredCategoryId;
  }
  const found = HTF_CONTEXT_CATEGORIES.find((c) => c.symbols.includes(symbol));
  return found ? found.id : HTF_CONTEXT_CATEGORIES[0].id;
};

// 初期お気に入り（未設定ユーザーのデフォルト）。サーバー側(worker/index.ts)と一致させる。
export const HTF_CONTEXT_DEFAULT_FAVORITES = ['USDJPY', 'XAUUSD'];

export type HtfContextTimeframeId = 'MN1' | 'W1' | 'D1' | 'H4';

export type HtfContextTimeframe = {
  id: HtfContextTimeframeId;
  label: string;
  // TradingViewのPine時間足コード（tfh入力にそのまま渡す値、アラートJSONのtimeframeフィールドと一致させる）
  pineCode: string;
};

export const HTF_CONTEXT_TIMEFRAMES: HtfContextTimeframe[] = [
  { id: 'MN1', label: 'MN1', pineCode: '1M' },
  { id: 'W1', label: 'W1', pineCode: '1W' },
  { id: 'D1', label: 'D1', pineCode: '1D' },
  { id: 'H4', label: 'H4', pineCode: '240' },
];

export const HTF_CONTEXT_DEFAULT_TIMEFRAME: HtfContextTimeframeId = 'D1';

// 「良い条件」判定で参照する上位足（worker/index.tsのHTF_DIGEST_HIGHER_TIMEFRAMEと一致させる）。
// MN1には上位足がないため確認対象外（反転警戒なし・レンジでない、のみで判定する）。
export const HTF_CONTEXT_HIGHER_TIMEFRAME: Partial<
  Record<HtfContextTimeframeId, HtfContextTimeframeId>
> = {
  H4: 'D1',
  D1: 'W1',
  W1: 'MN1',
};

// Discordダイジェスト（worker/index.tsのHTF_DIGEST_PICK_PRIORITY）と同じ優先順位。
// 検索ページの「おすすめ」欄も同じ厳選ロジック・同じ並び順で使うために複製している
// （workerはCloudflare Workers用に自己完結したファイルにする設計のため、共有importはしていない）。
export const HTF_CONTEXT_DIGEST_PRIORITY: string[] = [
  // メイン
  'USDJPY',
  'XAUUSD',
  'EURUSD',
  'GBPUSD',
  // ドルストレート残り + クロス円
  'AUDUSD',
  'NZDUSD',
  'USDCAD',
  'USDCHF',
  'EURJPY',
  'GBPJPY',
  'AUDJPY',
  'NZDJPY',
  'CADJPY',
  'CHFJPY',
  // 指数
  'NAS100USD',
  'SPX500USD',
  'JP225YJPY',
  // その他（その他通貨 + 貴金属残り + 仮想通貨）
  'AUDCAD',
  'AUDCHF',
  'AUDNZD',
  'CADCHF',
  'EURAUD',
  'EURCAD',
  'EURCHF',
  'EURGBP',
  'EURNZD',
  'GBPAUD',
  'GBPCAD',
  'GBPCHF',
  'GBPNZD',
  'NZDCAD',
  'NZDCHF',
  'XAGUSD',
  'BTCUSDT',
  'ETHUSDT',
];

// timeframeId(MN1/W1/D1/H4)⇄pineCode(1M/1W/1D/240)の相互変換。検索セクション等で
// レンダーのたびにMapを作り直さないよう、静的なマスタとしてモジュールスコープで一度だけ作る。
export const HTF_CONTEXT_PINECODE_BY_TIMEFRAME: ReadonlyMap<
  HtfContextTimeframeId,
  string
> = new Map(HTF_CONTEXT_TIMEFRAMES.map((tf) => [tf.id, tf.pineCode]));

export const HTF_CONTEXT_TIMEFRAME_BY_PINECODE: ReadonlyMap<
  string,
  HtfContextTimeframeId
> = new Map(HTF_CONTEXT_TIMEFRAMES.map((tf) => [tf.pineCode, tf.id]));
