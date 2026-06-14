export type MarketCategory = 'metal' | 'energy' | 'index' | 'crypto' | 'fx' | 'stock';
export type MarketMode = 'weekend' | 'crypto' | 'forex' | 'ipo';

export type MarketConfig = {
  label: string;
  displayName: string;
  weekendDisplayName?: string;
  symbol: string;
  symbolCandidates: string[];
  category: MarketCategory;
  mode: MarketMode;
  sourceLabel: string;
  officialMarketLabel?: string;
  externalChartUrl?: string;
  fridayCloseUtc?: {
    hour: number;
    minute: number;
  };
};

export type MarketPrice = {
  symbol: string;
  activeSymbol: string | null;
  price: number | null;
  comparisonPrice: number | null;
  change: number | null;
  changePct: number | null;
  updatedAt: number | null;
};

const hyperliquidTradeUrl = (symbol: string) =>
  `https://app.hyperliquid.xyz/trade/${symbol}`;

const tradingViewChartUrl = (symbol: string) =>
  `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;

export const MARKETS: MarketConfig[] = [
  {
    label: 'SPCX',
    displayName: 'SpaceX',
    symbol: 'SPCX',
    symbolCandidates: ['SPCX', 'xyz:SPCX'],
    category: 'stock',
    mode: 'ipo',
    sourceLabel: 'SPCX参考価格 / IPO前後の参考マーケット',
    officialMarketLabel: 'Hyperliquid参考マーケット',
    externalChartUrl: hyperliquidTradeUrl('xyz:SPCX'),
  },
  {
    label: 'GOLD',
    displayName: 'ゴールド',
    weekendDisplayName: 'サンデーゴールド',
    symbol: 'GOLD',
    symbolCandidates: [
      'xyz:GOLD',
      'flx:GOLD',
      'km:GOLD',
      'cash:GOLD',
      'hyna:GOLD',
      'vntl:GOLDJM',
      'PAXG',
    ],
    category: 'metal',
    mode: 'weekend',
    sourceLabel: '24時間取引価格 / GOLD',
    officialMarketLabel: 'COMEX Gold',
    externalChartUrl: hyperliquidTradeUrl('xyz:GOLD'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'SILVER',
    displayName: 'シルバー',
    weekendDisplayName: 'サンデーシルバー',
    symbol: 'SILVER',
    symbolCandidates: [
      'xyz:SILVER',
      'flx:SILVER',
      'km:SILVER',
      'cash:SILVER',
      'hyna:SILVER',
      'vntl:SILVERJM',
    ],
    category: 'metal',
    mode: 'weekend',
    sourceLabel: '24時間取引価格 / SILVER',
    officialMarketLabel: 'COMEX Silver',
    externalChartUrl: hyperliquidTradeUrl('xyz:SILVER'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'WTI',
    displayName: 'WTI原油',
    weekendDisplayName: 'サンデー原油',
    symbol: 'WTI',
    symbolCandidates: ['xyz:CL', 'km:USOIL', 'cash:WTI', 'flx:OIL'],
    category: 'energy',
    mode: 'weekend',
    sourceLabel: '24時間取引価格 / 原油',
    officialMarketLabel: 'NYMEX WTI Crude Oil',
    externalChartUrl: hyperliquidTradeUrl('xyz:CL'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'S&P500',
    displayName: 'S&P500',
    weekendDisplayName: 'サンデーS&P500',
    symbol: 'SP500',
    symbolCandidates: ['xyz:SP500', 'flx:USA500', 'km:US500', 'cash:USA500'],
    category: 'index',
    mode: 'weekend',
    sourceLabel: '24時間取引価格 / 米国株価指数',
    officialMarketLabel: 'CME E-mini S&P 500',
    externalChartUrl: hyperliquidTradeUrl('xyz:SP500'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'NIKKEI225',
    displayName: '日経225',
    weekendDisplayName: 'サンデー日経225',
    symbol: 'JP225',
    symbolCandidates: ['xyz:JP225'],
    category: 'index',
    mode: 'weekend',
    sourceLabel: '24時間取引価格 / 日経225',
    officialMarketLabel: '大阪取引所・CME Nikkei 225',
    externalChartUrl: hyperliquidTradeUrl('xyz:JP225'),
    fridayCloseUtc: { hour: 6, minute: 0 },
  },
  {
    label: 'BTC',
    displayName: 'Bitcoin',
    symbol: 'BTC',
    symbolCandidates: ['BTC'],
    category: 'crypto',
    mode: 'crypto',
    sourceLabel: '24時間取引価格 / BTC',
    externalChartUrl: tradingViewChartUrl('OANDA:BTCUSD'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'ETH',
    displayName: 'Ethereum',
    symbol: 'ETH',
    symbolCandidates: ['ETH'],
    category: 'crypto',
    mode: 'crypto',
    sourceLabel: '24時間取引価格 / ETH',
    externalChartUrl: tradingViewChartUrl('OANDA:ETHUSD'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'HYPE',
    displayName: 'Hyperliquid',
    symbol: 'HYPE',
    symbolCandidates: ['HYPE'],
    category: 'crypto',
    mode: 'crypto',
    sourceLabel: '24時間取引価格 / HYPE',
    externalChartUrl: hyperliquidTradeUrl('HYPE'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'USD/JPY',
    displayName: 'USD/JPY',
    weekendDisplayName: 'サンデードル円',
    symbol: 'USDJPY',
    symbolCandidates: ['xyz:JPY'],
    category: 'fx',
    mode: 'weekend',
    sourceLabel: '24時間取引価格 / USDJPY参考',
    officialMarketLabel: 'OTC FX',
    externalChartUrl: hyperliquidTradeUrl('xyz:JPY'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'EUR/USD',
    displayName: 'ユーロドル',
    symbol: 'EURUSD',
    symbolCandidates: ['xyz:EUR'],
    category: 'fx',
    mode: 'forex',
    sourceLabel: '24時間取引価格 / EURUSD参考',
    officialMarketLabel: 'OTC FX',
    externalChartUrl: tradingViewChartUrl('OANDA:EURUSD'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'GBP/USD',
    displayName: 'ポンドドル',
    symbol: 'GBPUSD',
    symbolCandidates: ['xyz:GBP'],
    category: 'fx',
    mode: 'forex',
    sourceLabel: '24時間取引価格 / GBPUSD参考',
    officialMarketLabel: 'OTC FX',
    externalChartUrl: tradingViewChartUrl('OANDA:GBPUSD'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
  {
    label: 'USD/KRW',
    displayName: 'ドルウォン',
    symbol: 'USDKRW',
    symbolCandidates: ['xyz:KRW'],
    category: 'fx',
    mode: 'forex',
    sourceLabel: '24時間取引価格 / USDKRW参考',
    officialMarketLabel: 'OTC FX',
    externalChartUrl: tradingViewChartUrl('OANDA:USDKRW'),
    fridayCloseUtc: { hour: 21, minute: 0 },
  },
];

export const WEEKEND_MARKETS = MARKETS.filter((market) => market.mode === 'weekend');
export const CRYPTO_MARKETS = MARKETS.filter((market) => market.mode === 'crypto');
export const FOREX_MARKETS = MARKETS.filter((market) => market.mode === 'forex');
export const IPO_MARKETS = MARKETS.filter((market) => market.mode === 'ipo');

export const FRIDAY_CLOSE_REFERENCES = [
  {
    label: 'Gold futures',
    market: 'COMEX GC',
    pairedSymbol: 'GOLD',
  },
  {
    label: 'Silver futures',
    market: 'COMEX SI',
    pairedSymbol: 'SILVER',
  },
  {
    label: 'WTI crude oil',
    market: 'NYMEX CL',
    pairedSymbol: 'WTI',
  },
  {
    label: 'S&P 500 futures',
    market: 'CME ES',
    pairedSymbol: 'SP500',
  },
  {
    label: 'Nikkei 225 futures',
    market: 'OSE / CME NKD',
    pairedSymbol: 'JP225',
  },
  {
    label: 'USD/JPY',
    market: 'OTC FX',
    pairedSymbol: 'USDJPY',
  },
] as const;

export const CHART_SYMBOLS = [
  {
    label: 'XAUUSD',
    symbol: 'OANDA:XAUUSD',
    description: 'Gold spot CFD reference',
  },
  {
    label: 'XAGUSD',
    symbol: 'OANDA:XAGUSD',
    description: 'Silver spot CFD reference',
  },
  {
    label: 'USOIL',
    symbol: 'TVC:USOIL',
    description: 'WTI crude oil CFD reference',
  },
  {
    label: 'US500',
    symbol: 'OANDA:SPX500USD',
    description: 'S&P 500 CFD reference',
  },
  {
    label: 'JPN225',
    symbol: 'OANDA:JP225USD',
    description: 'Nikkei 225 CFD reference',
  },
  {
    label: 'USDJPY',
    symbol: 'FX:USDJPY',
    description: 'US dollar / Japanese yen',
  },
  {
    label: 'BTCUSD',
    symbol: 'BINANCE:BTCUSDT',
    description: 'Bitcoin / USDT reference',
  },
] as const;
