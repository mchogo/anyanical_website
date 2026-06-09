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
  index?: number;
  isPinned?: boolean;
  onTogglePin?: () => void;
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

const getOfficialMarketStatus = (market: MarketConfig, now: number): 'open' | 'closed' => {
  const date = new Date(now);
  const utcDay = date.getUTCDay();
  const utcHour = date.getUTCHours();

  if (market.category === 'crypto' || market.category === 'stock') return 'open';
  if (utcDay === 0 || utcDay === 6) return 'closed';
  if (market.category === 'fx') return 'open';
  // Metal/Energy/Index: brief maintenance window 22:00 UTC daily
  if (utcHour === 22) return 'closed';
  return 'open';
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
  index = 0,
  isPinned = false,
  onTogglePin,
}: MarketCardProps) => {
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [isPriceFlashing, setIsPriceFlashing] = useState(false);
  const [copied, setCopied] = useState(false);
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
  const myAlertsCount = alerts.filter((a) => a.symbol === market.symbol).length;
  const officialStatus = getOfficialMarketStatus(market, now);

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

  const handleCopyPrice = () => {
    if (price.price === null) return;
    navigator.clipboard.writeText(String(price.price)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <article
      className="card-interactive animate-fade-up rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-glow"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-400">{market.label}</p>
          <h2 className="mt-1 text-xl font-bold text-white">{displayName}</h2>
          <p className="mt-2 text-xs text-slate-500">{market.sourceLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              className={`text-xl leading-none transition ${
                isPinned ? 'text-amber-300 hover:text-amber-200' : 'text-slate-700 hover:text-slate-500'
              }`}
              title={isPinned ? 'お気に入りから削除' : 'お気に入りに追加'}
            >
              {isPinned ? '★' : '☆'}
            </button>
          )}
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase text-cyan-200 ring-1 ring-cyan-300/20">
            {market.category}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <p
          className={`min-h-10 rounded-md break-words text-3xl font-bold tabular-nums ${isPriceFlashing ? 'price-flash' : ''} ${hasPrice ? 'cursor-pointer select-none text-white' : 'shimmer text-slate-600'} ${copied ? 'text-cyan-300' : ''}`}
          onClick={hasPrice ? handleCopyPrice : undefined}
          title={hasPrice ? 'クリックでコピー' : undefined}
        >
          {formatPrice(price.price, market)}
        </p>
        {copied && <p className="mt-1 text-xs text-cyan-400">コピーしました</p>}
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
            className={`h-full rounded-full transition-[width] duration-700 ${gaugeClass}`}
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
        <span
          className={`rounded-full px-2 py-0.5 ring-1 ${
            officialStatus === 'open'
              ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-300/20'
              : 'bg-slate-400/10 text-slate-500 ring-slate-300/15'
          }`}
        >
          公式 {officialStatus === 'open' ? 'OPEN' : 'CLOSED'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative inline-flex">
          <button
            type="button"
            onClick={() => setIsAlertPanelOpen((current) => !current)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white/[0.04] px-4 text-sm font-bold text-slate-100 ring-1 ring-white/10 transition hover:bg-cyan-300/10 hover:text-cyan-100"
          >
            アラート設定
          </button>
          {myAlertsCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-xs font-bold text-slate-950">
              {myAlertsCount}
            </span>
          )}
        </div>
        {market.externalChartUrl && (
          <a
            href={market.externalChartUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-amber-400/10 px-4 text-sm font-bold text-amber-200 ring-1 ring-amber-300/20 transition hover:bg-amber-400/20"
          >
            📈 チャートを見る
          </a>
        )}
      </div>

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
