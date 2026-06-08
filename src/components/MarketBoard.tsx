import { useState } from 'react';

import {
  CRYPTO_MARKETS,
  FOREX_MARKETS,
  WEEKEND_MARKETS,
  type MarketCategory,
  type MarketConfig,
  type MarketPrice,
} from '../config/markets';
import type {
  Alert,
  AlertCondition,
  NotificationPermissionStatus,
} from '../hooks/useAlerts';
import type { PriceHistoryPoint } from '../hooks/useHyperliquidMids';
import { MarketCard } from './MarketCard';
import { FridayCloseReferences } from './FridayCloseReferences';

type MarketBoardProps = {
  prices: Record<string, MarketPrice>;
  priceHistory: Record<string, PriceHistoryPoint[]>;
  now: number;
  isWeekendMode: boolean;
  alerts: Alert[];
  addAlert: (symbol: string, condition: AlertCondition, threshold: number) => void;
  removeAlert: (alertId: string) => void;
  requestPermission: () => Promise<void>;
  permissionStatus: NotificationPermissionStatus;
};

const categoryFilters: Array<{
  value: MarketCategory | 'all';
  label: string;
}> = [
  { value: 'all', label: 'すべて' },
  { value: 'metal', label: '貴金属' },
  { value: 'energy', label: 'エネルギー' },
  { value: 'index', label: '株価指数' },
  { value: 'crypto', label: '暗号資産' },
  { value: 'fx', label: 'FX' },
];

const filterMarkets = (
  markets: MarketConfig[],
  categoryFilter: MarketCategory | 'all',
) =>
  categoryFilter === 'all'
    ? markets
    : markets.filter((market) => market.category === categoryFilter);

const renderMarketCards = (
  markets: MarketConfig[],
  props: MarketBoardProps,
  gridClassName = 'grid gap-4 md:grid-cols-2 xl:grid-cols-3',
) => (
  <div className={gridClassName}>
    {markets.map((market, index) => (
      <MarketCard
        key={market.symbol}
        market={market}
        price={props.prices[market.symbol]}
        now={props.now}
        isWeekendMode={props.isWeekendMode}
        priceHistory={props.priceHistory[market.symbol] ?? []}
        alerts={props.alerts}
        addAlert={props.addAlert}
        removeAlert={props.removeAlert}
        requestPermission={props.requestPermission}
        permissionStatus={props.permissionStatus}
        index={index}
      />
    ))}
  </div>
);

export const MarketBoard = ({
  prices,
  priceHistory,
  now,
  isWeekendMode,
  alerts,
  addAlert,
  removeAlert,
  requestPermission,
  permissionStatus,
}: MarketBoardProps) => {
  const [categoryFilter, setCategoryFilter] = useState<MarketCategory | 'all'>('all');
  const filteredWeekendMarkets = filterMarkets(WEEKEND_MARKETS, categoryFilter);
  const filteredCryptoMarkets = filterMarkets(CRYPTO_MARKETS, categoryFilter);
  const filteredForexMarkets = filterMarkets(FOREX_MARKETS, categoryFilter);
  const cardProps = {
    prices,
    priceHistory,
    now,
    isWeekendMode,
    alerts,
    addAlert,
    removeAlert,
    requestPermission,
    permissionStatus,
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="animate-slide-left text-sm font-semibold text-cyan-200">
            {isWeekendMode ? 'Weekend mode' : 'Market mode'}
          </p>
          <h2 className="animate-fade-up stagger-1 mt-1 text-2xl font-bold text-white">24時間価格モニター</h2>
        </div>
        <p className="text-sm text-slate-400">
          {isWeekendMode
            ? '公式市場が休みの間も動く参考価格で、週末ニュースへの反応を確認します。'
            : '通常の銘柄名で24時間取引価格を確認します。週末時はサンデー相場表示に切り替わります。'}
        </p>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {categoryFilters.map((filter) => {
          const isActive = categoryFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setCategoryFilter(filter.value)}
              className={`btn-press shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                isActive
                  ? 'bg-cyan-300 text-slate-950 ring-cyan-200'
                  : 'bg-white/[0.04] text-slate-200 ring-white/10 hover:bg-cyan-300/10 hover:text-cyan-100 hover:ring-cyan-300/30'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {filteredWeekendMarkets.length > 0
        ? renderMarketCards(filteredWeekendMarkets, cardProps)
        : null}

      {filteredCryptoMarkets.length > 0 ? (
        <div className="mt-10">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-cyan-200">Crypto reference</p>
              <h2 className="mt-1 text-2xl font-bold text-white">暗号資産 24時間価格</h2>
            </div>
            <p className="text-sm text-slate-400">
              BTC/ETH/HYPEはリスクオン・オフの補助指標として表示します。
            </p>
          </div>

          {renderMarketCards(filteredCryptoMarkets, cardProps)}
        </div>
      ) : null}

      {filteredForexMarkets.length > 0 ? (
        <div className="mt-10">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-cyan-200">FX reference</p>
              <h2 className="mt-1 text-2xl font-bold text-white">為替 24時間参考価格</h2>
            </div>
            <p className="text-sm text-slate-400">
              ユーロ・ポンド・ウォンの週末反応を補助的に確認します。
            </p>
          </div>

          {renderMarketCards(
            filteredForexMarkets,
            cardProps,
            'grid gap-4 md:grid-cols-2 xl:grid-cols-4',
          )}
        </div>
      ) : null}

      {isWeekendMode ? <FridayCloseReferences prices={prices} /> : null}
    </section>
  );
};
