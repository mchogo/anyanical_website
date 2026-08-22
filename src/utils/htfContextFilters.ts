import {
  HTF_CONTEXT_CATEGORIES,
  HTF_CONTEXT_TIMEFRAME_BY_PINECODE,
  HTF_CONTEXT_TIMEFRAMES,
  type HtfContextCategoryId,
  type HtfContextTimeframeId,
} from '../config/htfContextSymbols';
import type { HtfContextState } from '../hooks/useHtfContext';

// 目線フィルターの選択肢（getStateMeta()の5パターンと対応させる）。
export const STATE_FILTER_OPTIONS: { value: number; label: string; icon: string }[] = [
  { value: 1, label: '上目線', icon: '☀️' },
  { value: -1, label: '下目線', icon: '🌧️' },
  { value: 2, label: 'レンジ(上)', icon: '⛅' },
  { value: -2, label: 'レンジ(下)', icon: '🌥️' },
  { value: 0, label: 'レンジ(中立)', icon: '🌫️' },
];

export const REVERSAL_FILTER_OPTIONS: { value: 'warning' | 'none'; label: string }[] = [
  { value: 'warning', label: '⚠️ 反転警戒あり' },
  { value: 'none', label: '反転警戒なし' },
];

export const ALL_STATES = STATE_FILTER_OPTIONS.map((o) => o.value);
export const ALL_REVERSAL: Array<'warning' | 'none'> = ['warning', 'none'];
export const ALL_CATEGORIES = HTF_CONTEXT_CATEGORIES.map((c) => c.id);
export const ALL_TIMEFRAMES = HTF_CONTEXT_TIMEFRAMES.map((tf) => tf.id);

// 目線ショートカット
export const STATE_SHORTCUT_UP = [1, 2];
export const STATE_SHORTCUT_DOWN = [-1, -2];
export const STATE_SHORTCUT_RANGE = [2, -2, 0];
export const STATE_SHORTCUT_TREND = [1, -1];

// 時間足ショートカット
export const TIMEFRAME_SHORTCUT_HIGHER: HtfContextTimeframeId[] = ['MN1', 'W1', 'D1'];
export const TIMEFRAME_SHORTCUT_SHORT_TERM: HtfContextTimeframeId[] = ['D1', 'H4'];

export type HtfSearchFilters = {
  states: number[];
  reversal: Array<'warning' | 'none'>;
  categories: HtfContextCategoryId[];
  timeframes: HtfContextTimeframeId[];
  favoriteOnly: boolean;
};

export type HtfSearchFiltersSet = {
  states: Set<number>;
  reversal: Set<'warning' | 'none'>;
  categories: Set<HtfContextCategoryId>;
  timeframes: Set<HtfContextTimeframeId>;
  favoriteOnly: boolean;
};

export const DEFAULT_FILTERS: HtfSearchFilters = {
  states: ALL_STATES,
  reversal: ALL_REVERSAL,
  categories: ALL_CATEGORIES,
  timeframes: ALL_TIMEFRAMES,
  favoriteOnly: false,
};

export const filtersToSet = (f: HtfSearchFilters): HtfSearchFiltersSet => ({
  states: new Set(f.states),
  reversal: new Set(f.reversal),
  categories: new Set(f.categories),
  timeframes: new Set(f.timeframes),
  favoriteOnly: f.favoriteOnly,
});

export const filtersFromSet = (f: HtfSearchFiltersSet): HtfSearchFilters => ({
  states: [...f.states],
  reversal: [...f.reversal],
  categories: [...f.categories],
  timeframes: [...f.timeframes],
  favoriteOnly: f.favoriteOnly,
});

const sortedArray = <T>(arr: T[]): T[] => [...arr].sort();

// 保存済み/未保存の比較・URL共有用に、配列順序の違いを無視した正規形へ変換する。
export const normalizeFiltersForCompare = (f: HtfSearchFilters): string =>
  JSON.stringify({
    states: [...f.states].sort((a, b) => a - b),
    reversal: sortedArray(f.reversal),
    categories: sortedArray(f.categories),
    timeframes: sortedArray(f.timeframes),
    favoriteOnly: f.favoriteOnly,
  });

export const filtersEqual = (a: HtfSearchFilters, b: HtfSearchFilters): boolean =>
  normalizeFiltersForCompare(a) === normalizeFiltersForCompare(b);

// サーバー・localStorage双方から受け取ったJSONを安全に正規化する（クライアントも
// サーバーからのレスポンスを無条件に信用しない）。配列が渡された場合は空でもそのまま
// 尊重する（「全解除」は正当な検索条件）。未指定・不正な型のときだけ既定値へフォールバックする。
export const normalizeFiltersInput = (input: unknown): HtfSearchFilters => {
  const obj = (input && typeof input === 'object' ? input : {}) as Record<
    string,
    unknown
  >;

  const states = Array.isArray(obj.states)
    ? obj.states.filter(
        (v): v is number => typeof v === 'number' && ALL_STATES.includes(v),
      )
    : ALL_STATES;
  const reversal = Array.isArray(obj.reversal)
    ? obj.reversal.filter(
        (v): v is 'warning' | 'none' =>
          typeof v === 'string' && (ALL_REVERSAL as string[]).includes(v),
      )
    : ALL_REVERSAL;
  const categories = Array.isArray(obj.categories)
    ? obj.categories.filter(
        (v): v is HtfContextCategoryId =>
          typeof v === 'string' && (ALL_CATEGORIES as string[]).includes(v),
      )
    : ALL_CATEGORIES;
  const timeframes = Array.isArray(obj.timeframes)
    ? obj.timeframes.filter(
        (v): v is HtfContextTimeframeId =>
          typeof v === 'string' && (ALL_TIMEFRAMES as string[]).includes(v),
      )
    : ALL_TIMEFRAMES;
  const favoriteOnly = obj.favoriteOnly === true;

  return { states, reversal, categories, timeframes, favoriteOnly };
};

const CATEGORY_LABEL_BY_ID = new Map(HTF_CONTEXT_CATEGORIES.map((c) => [c.id, c.label]));
const STATE_LABEL_BY_VALUE = new Map(STATE_FILTER_OPTIONS.map((o) => [o.value, o.label]));

const summarizeAxis = <T>(
  selected: T[],
  all: T[],
  labelFor: (v: T) => string,
): string => {
  if (selected.length === 0) return 'なし';
  if (selected.length === all.length) return 'すべて';
  return selected.map(labelFor).join('・');
};

// 検索パネルに表示する「今の条件」の要約テキスト（例: 上目線・下目線 / D1・H4 / 反転警戒なし / クロス円・貴金属）。
export const summarizeFilters = (f: HtfSearchFilters): string => {
  const parts = [
    summarizeAxis(f.states, ALL_STATES, (v) => STATE_LABEL_BY_VALUE.get(v) ?? String(v)),
    summarizeAxis(f.timeframes, ALL_TIMEFRAMES, (v) => v),
    summarizeAxis(f.categories, ALL_CATEGORIES, (v) => CATEGORY_LABEL_BY_ID.get(v) ?? v),
    summarizeAxis(f.reversal, ALL_REVERSAL, (v) =>
      v === 'warning' ? '反転警戒あり' : '反転警戒なし',
    ),
  ];
  if (f.favoriteOnly) parts.push('お気に入りのみ');
  return parts.join(' / ');
};

const CATEGORY_IDS_BY_SYMBOL = (() => {
  const map = new Map<string, HtfContextCategoryId[]>();
  for (const category of HTF_CONTEXT_CATEGORIES) {
    for (const symbol of category.symbols) {
      map.set(symbol, [...(map.get(symbol) ?? []), category.id]);
    }
  }
  return map;
})();

// 検索結果・おすすめ双方で共有する「この行が今の検索条件に合致するか」の判定。
// favoriteOnlyはfavoritesを渡さない限り無視される（渡さない呼び出し側はお気に入り機能を
// 使わない文脈だと分かっているため、意図的にオプショナルにしている）。
export const passesHtfSearchFilters = (
  symbol: string,
  row: HtfContextState,
  filters: HtfSearchFilters,
  favorites?: string[],
): boolean => {
  if (!filters.states.includes(row.state)) return false;
  const reversalBucket = row.reversalWarning ? 'warning' : 'none';
  if (!filters.reversal.includes(reversalBucket)) return false;
  const categories = CATEGORY_IDS_BY_SYMBOL.get(symbol) ?? [];
  if (!categories.some((c) => filters.categories.includes(c))) return false;
  const timeframeId = HTF_CONTEXT_TIMEFRAME_BY_PINECODE.get(row.timeframe);
  if (!timeframeId || !filters.timeframes.includes(timeframeId)) return false;
  if (filters.favoriteOnly && favorites && !favorites.includes(symbol)) return false;
  return true;
};

export type HtfSearchResultItem = {
  symbol: string;
  timeframeId: HtfContextTimeframeId;
  row: HtfContextState;
};

const symbolPriorityIndex = (symbol: string, priority: string[]): number => {
  const index = priority.indexOf(symbol);
  return index === -1 ? priority.length : index;
};

const timeframePriorityIndex = (timeframeId: HtfContextTimeframeId): number =>
  HTF_CONTEXT_TIMEFRAMES.findIndex((tf) => tf.id === timeframeId);

// 全銘柄×全時間足のデータから、検索条件に合う行を優先順位順に並べて返す。
export const computeSearchResults = (
  data: HtfContextState[],
  filters: HtfSearchFilters,
  priority: string[],
  favorites?: string[],
): HtfSearchResultItem[] => {
  const results: HtfSearchResultItem[] = [];
  for (const row of data) {
    if (!passesHtfSearchFilters(row.symbol, row, filters, favorites)) continue;
    const timeframeId = HTF_CONTEXT_TIMEFRAME_BY_PINECODE.get(row.timeframe);
    if (!timeframeId) continue;
    results.push({ symbol: row.symbol, timeframeId, row });
  }
  return results.sort((a, b) => {
    const symbolDiff =
      symbolPriorityIndex(a.symbol, priority) - symbolPriorityIndex(b.symbol, priority);
    if (symbolDiff !== 0) return symbolDiff;
    return timeframePriorityIndex(a.timeframeId) - timeframePriorityIndex(b.timeframeId);
  });
};

// 空結果の原因を特定する（原因別メッセージ・復旧操作の出し分けに使う）。
export type HtfSearchEmptyReason =
  | 'no-timeframes'
  | 'no-states'
  | 'no-categories'
  | 'no-reversal'
  | 'no-favorites'
  | 'no-match'
  | 'no-data';

export const getEmptyReason = (
  filters: HtfSearchFilters,
  hasAnyData: boolean,
): HtfSearchEmptyReason => {
  if (filters.timeframes.length === 0) return 'no-timeframes';
  if (filters.states.length === 0) return 'no-states';
  if (filters.categories.length === 0) return 'no-categories';
  if (filters.reversal.length === 0) return 'no-reversal';
  if (!hasAnyData) return 'no-data';
  return 'no-match';
};
