// HtfContextBoard/HtfContextSearchPageで共有する純粋な整形・判定ロジック。
// コンポーネントファイルに置くとreact-refresh/only-export-componentsに引っかかるため独立させている。

export const formatSymbolLabel = (symbol: string): string => {
  if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)}/USDT`;
  return symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol;
};

export const formatPrice = (symbol: string, value: number | null): string => {
  if (value === null) return '—';
  const decimals = symbol.endsWith('USDT')
    ? 1
    : symbol.includes('JPY')
      ? 3
      : symbol.startsWith('XAU') || symbol.startsWith('XAG')
        ? 2
        : 5;
  return value.toFixed(decimals);
};

// テーブル・カードのセルを描画するたびに生成すると無駄なので、モジュールスコープで一度だけ作る。
const barDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const updatedAtFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatBarDate = (barTime: number): string =>
  barDateFormatter.format(new Date(barTime));

export const formatUpdatedAt = (iso: string): string =>
  updatedAtFormatter.format(new Date(iso));

// TradingViewでその銘柄のチャートを開くための代表シンボル（docs/data-sources.mdの代表シンボル一覧に合わせる）。
// 表示互換性を優先しOANDA(FX/貴金属/指数)・BINANCE(仮想通貨)の代表シンボルを使う。完全一致を保証するものではない。
const getTradingViewSymbol = (symbol: string): string => {
  if (symbol.endsWith('USDT')) return `BINANCE:${symbol}`;
  return `OANDA:${symbol}`;
};

export const getTradingViewChartUrl = (symbol: string): string =>
  `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(getTradingViewSymbol(symbol))}`;

export type StateMeta = {
  icon: string;
  label: string;
  badgeClass: string;
  textClass: string;
};

export const getStateMeta = (state: number): StateMeta => {
  switch (state) {
    case 1:
      return {
        icon: '☀️',
        label: '上目線',
        badgeClass: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
        textClass: 'text-emerald-300',
      };
    case -1:
      return {
        icon: '🌧️',
        label: '下目線',
        badgeClass: 'border-rose-300/30 bg-rose-300/10 text-rose-200',
        textClass: 'text-rose-300',
      };
    case 2:
      return {
        icon: '⛅',
        label: 'レンジ(上)',
        badgeClass: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
        textClass: 'text-amber-300',
      };
    case -2:
      return {
        icon: '🌥️',
        label: 'レンジ(下)',
        badgeClass: 'border-orange-300/30 bg-orange-300/10 text-orange-200',
        textClass: 'text-orange-300',
      };
    default:
      return {
        icon: '🌫️',
        label: 'レンジ',
        badgeClass: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
        textClass: 'text-slate-300',
      };
  }
};

// refHigh(上ターゲット)/refLow(下ターゲット)は常にこの2値のみで、方向によってどちらが
// 「今狙っている側」かが変わる（上目線/レンジ(上)なら上、下目線/レンジ(下)なら下、レンジ(中立)なら両方とも参考値）。
export const isUpperActive = (state: number) => state === 1 || state === 2;
export const isLowerActive = (state: number) => state === -1 || state === -2;
