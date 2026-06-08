import { useEffect, useRef, useState } from 'react';

import type { MarketConfig, MarketPrice } from '../config/markets';
import type {
  Alert,
  AlertCondition,
  NotificationPermissionStatus,
} from '../hooks/useAlerts';
import type { PriceHistoryPoint } from '../hooks/useHyperliquidMids';
import { AlertPanel } from './AlertPanel';
import { SparkLine } from './SparkLine';

type MarketCardProps = {
  market: MarketConfig;
  price: MarketPrice;
  now: number;
  isWeekendMode: boolean;
  priceHistory: PriceHistoryPoint[];
  alerts: Alert[];
  addAlert: (symbol: string, condition: AlertCondition, threshold: number) => void;
  removeAlert: (alertId: string) => void;
  requestPermission: () => Promise<void>;
  permissionStatus: NotificationPermissionStatus;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 4,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 4,
});

const formatPrice = (value: number | null, market: MarketConfig) => {
  if (value === null) {
    return 'データなし';
  }

  if (market.category === 'fx') {
    return compactFormatter.format(value);
  }

  return Math.abs(value) >= 1
    ? currencyFormatter.format(value)
    : `$${compactFormatter.format(value)}`;
};

const formatChange = (value: number | null, market: MarketConfig) => {
  if (value === null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  if (market.category === 'fx') {
    return `${sign}${compactFormatter.format(value)}`;
  }

  return `${sign}${currencyFormatter.format(value)}`;
};

const formatChangePct = (value: number | null) => {
  if (value === null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const elapsedSeconds = (updatedAt: number | null, now: number) => {
  if (updatedAt === null) {
    return null;
  }

  return Math.max(0, Math.floor((now - updatedAt) / 1_000));
};

export const MarketCard = ({
  market,
  price,
  now,
  isWeekendMode,
  priceHistory,
  alerts,
  addAlert,
  removeAlert,
  requestPermission,
  permissionStatus,
}: MarketCardProps) => {
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [isPriceFlashing, setIsPriceFlashing] = useState(false);
  const previousUpdatedAtRef = useRef<number | null>(null);
  const hasPrice = price.price !== null;
  const isUp = (price.change ?? 0) > 0;
  const isDown = (price.change ?? 0) < 0;
  const seconds = elapsedSeconds(price.updatedAt, now);
  const gaugeWidth =
    price.changePct === null ? 0 : (Math.min(Math.abs(price.changePct), 10) / 10) * 100;
  const gaugeClass = isUp ? 'bg-emerald-400' : isDown ? 'bg-rose-400' : 'bg-slate-400';
  const accentClass = isUp
    ? 'text-emerald-300'
    : isDown
      ? 'text-rose-300'
      : 'text-slate-300';
  const statusClass = hasPrice
    ? 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/20'
    : 'bg-slate-500/10 text-slate-300 ring-slate-300/20';
  const displayName =
    isWeekendMode && market.weekendDisplayName
      ? market.weekendDisplayName
      : market.displayName;

  useEffect(() => {
    if (
      price.updatedAt === null ||
      previousUpdatedAtRef.current === null ||
      price.updatedAt === previousUpdatedAtRef.current
    ) {
      previousUpdatedAtRef.current = price.updatedAt;
      return;
    }

    setIsPriceFlashing(true);
    previousUpdatedAtRef.current = price.updatedAt;

    const timerId = window.setTimeout(() => {
      setIsPriceFlashing(false);
    }, 600);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [price.updatedAt]);

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-400">{market.label}</p>
          <h2 className="mt-1 text-xl font-bold text-white">{displayName}</h2>
          <p className="mt-2 text-xs text-slate-500">{market.sourceLabel}</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase text-cyan-200 ring-1 ring-cyan-300/20">
          {market.category}
        </span>
      </div>

      <div className="mt-6">
        <p
          className={`min-h-10 rounded-md break-words text-3xl font-bold tabular-nums ${isPriceFlashing ? 'price-flash' : ''} ${hasPrice ? 'text-white' : 'text-slate-500'}`}
        >
          {formatPrice(price.price, market)}
        </p>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>過去6時間</span>
          <span>{priceHistory.length > 1 ? '15分足ベース' : '履歴取得中'}</span>
        </div>
        <SparkLine data={priceHistory} />
      </div>

      {price.changePct !== null ? (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${gaugeClass}`}
            style={{ width: `${gaugeWidth}%` }}
          />
        </div>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-white/[0.035] p-3">
          <dt className="text-slate-500">変動率</dt>
          <dd className={`mt-1 font-semibold tabular-nums ${accentClass}`}>
            {formatChangePct(price.changePct)}
          </dd>
        </div>
        <div className="rounded-lg bg-white/[0.035] p-3">
          <dt className="text-slate-500">変動幅</dt>
          <dd className={`mt-1 font-semibold tabular-nums ${accentClass}`}>
            {formatChange(price.change, market)}
          </dd>
        </div>
        <div className="rounded-lg bg-white/[0.035] p-3">
          <dt className="text-slate-500">経過秒数</dt>
          <dd className="mt-1 font-semibold text-slate-200 tabular-nums">
            {seconds === null ? '--' : `${seconds}s`}
          </dd>
        </div>
        <div className="rounded-lg bg-white/[0.035] p-3">
          <dt className="text-slate-500">取得状態</dt>
          <dd className="mt-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass}`}
            >
              {hasPrice ? '取得中' : 'データなし'}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>採用シンボル: {price.activeSymbol ?? '未取得'}</span>
        <span>金曜基準: {formatPrice(price.comparisonPrice, market)}</span>
      </div>

      <button
        type="button"
        onClick={() => setIsAlertPanelOpen((current) => !current)}
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-white/[0.04] px-4 text-sm font-bold text-slate-100 ring-1 ring-white/10 transition hover:bg-cyan-300/10 hover:text-cyan-100"
      >
        アラート設定
      </button>

      {isAlertPanelOpen ? (
        <AlertPanel
          symbol={market.symbol}
          currentPrice={price.price}
          alerts={alerts}
          addAlert={addAlert}
          removeAlert={removeAlert}
          requestPermission={requestPermission}
          permissionStatus={permissionStatus}
        />
      ) : null}
    </article>
  );
};
