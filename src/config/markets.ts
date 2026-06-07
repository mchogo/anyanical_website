export type MarketCategory = 'metal' | 'energy' | 'index' | 'crypto' | 'fx';
export type MarketMode = 'weekend' | 'crypto' | 'forex';

export type MarketConfig = {
  label: string;
  displayName: string;
  symbol: string;
  symbolCandidates: string[];
  category: MarketCategory;
  mode: MarketMode;
  sourceLabel: string;
  officialMarketLabel?: string;
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

export const MARKETS: MarketConfig[] = [
  {
    label: 'GOLD',
    displayName: 'サンデーゴールド',
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
    sourceLabel: 'Hyperliquid HIP-3 / GOLD perp',
    officialMarketLabel: 'COMEX Gold',
  },
  {
    label: 'SILVER',
    displayName: 'サンデーシルバー',
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
    sourceLabel: 'Hyperliquid HIP-3 / SILVER perp',
    officialMarketLabel: 'COMEX Silver',
  },
  {
    label: 'WTI',
    displayName: 'サンデー原油',
    symbol: 'WTI',
    symbolCandidates: ['xyz:CL', 'km:USOIL', 'cash:WTI', 'flx:OIL'],
    category: 'energy',
    mode: 'weekend',
    sourceLabel: 'Hyperliquid HIP-3 / crude oil perp',
    officialMarketLabel: 'NYMEX WTI Crude Oil',
  },
  {
    label: 'S&P500',
    displayName: 'サンデーS&P500',
    symbol: 'SP500',
    symbolCandidates: ['xyz:SP500', 'flx:USA500', 'km:US500', 'cash:USA500'],
    category: 'index',
    mode: 'weekend',
    sourceLabel: 'Hyperliquid HIP-3 / US index perp',
    officialMarketLabel: 'CME E-mini S&P 500',
  },
  {
    label: 'NIKKEI225',
    displayName: 'サンデー日経225',
    symbol: 'JP225',
    symbolCandidates: ['xyz:JP225'],
    category: 'index',
    mode: 'weekend',
    sourceLabel: 'Hyperliquid HIP-3 / JP225 perp',
    officialMarketLabel: '大阪取引所・CME Nikkei 225',
  },
  {
    label: 'BTC',
    displayName: 'Bitcoin',
    symbol: 'BTC',
    symbolCandidates: ['BTC'],
    category: 'crypto',
    mode: 'crypto',
    sourceLabel: 'Hyperliquid / BTC perp',
  },
  {
    label: 'ETH',
    displayName: 'Ethereum',
    symbol: 'ETH',
    symbolCandidates: ['ETH'],
    category: 'crypto',
    mode: 'crypto',
    sourceLabel: 'Hyperliquid / ETH perp',
  },
  {
    label: 'HYPE',
    displayName: 'Hyperliquid',
    symbol: 'HYPE',
    symbolCandidates: ['HYPE'],
    category: 'crypto',
    mode: 'crypto',
    sourceLabel: 'Hyperliquid / HYPE perp',
  },
  {
    label: 'USD/JPY',
    displayName: 'サンデードル円',
    symbol: 'USDJPY',
    symbolCandidates: ['xyz:JPY'],
    category: 'fx',
    mode: 'weekend',
    sourceLabel: 'Hyperliquid HIP-3 / JPY perp',
    officialMarketLabel: 'OTC FX',
  },
  {
    label: 'EUR/USD',
    displayName: 'ユーロドル',
    symbol: 'EURUSD',
    symbolCandidates: ['xyz:EUR'],
    category: 'fx',
    mode: 'forex',
    sourceLabel: 'Hyperliquid HIP-3 / EUR perp',
    officialMarketLabel: 'OTC FX',
  },
  {
    label: 'GBP/USD',
    displayName: 'ポンドドル',
    symbol: 'GBPUSD',
    symbolCandidates: ['xyz:GBP'],
    category: 'fx',
    mode: 'forex',
    sourceLabel: 'Hyperliquid HIP-3 / GBP perp',
    officialMarketLabel: 'OTC FX',
  },
  {
    label: 'USD/KRW',
    displayName: 'ドルウォン',
    symbol: 'USDKRW',
    symbolCandidates: ['xyz:KRW'],
    category: 'fx',
    mode: 'forex',
    sourceLabel: 'Hyperliquid HIP-3 / KRW perp',
    officialMarketLabel: 'OTC FX',
  },
];

export const WEEKEND_MARKETS = MARKETS.filter((market) => market.mode === 'weekend');
export const CRYPTO_MARKETS = MARKETS.filter((market) => market.mode === 'crypto');
export const FOREX_MARKETS = MARKETS.filter((market) => market.mode === 'forex');

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
