import type { MarketConfig, MarketPrice } from '../config/markets';

type MarketCardProps = {
  market: MarketConfig;
  price: MarketPrice;
  now: number;
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

export const MarketCard = ({ market, price, now }: MarketCardProps) => {
  const hasPrice = price.price !== null;
  const isUp = (price.change ?? 0) > 0;
  const isDown = (price.change ?? 0) < 0;
  const seconds = elapsedSeconds(price.updatedAt, now);
  const accentClass = isUp
    ? 'text-emerald-300'
    : isDown
      ? 'text-rose-300'
      : 'text-slate-300';
  const statusClass = hasPrice
    ? 'bg-emerald-400/10 text-emerald-200 ring-emerald-300/20'
    : 'bg-slate-500/10 text-slate-300 ring-slate-300/20';

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/80 p-5 shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-400">{market.label}</p>
          <h2 className="mt-1 text-xl font-bold text-white">{market.displayName}</h2>
          <p className="mt-2 text-xs text-slate-500">{market.sourceLabel}</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase text-cyan-200 ring-1 ring-cyan-300/20">
          {market.category}
        </span>
      </div>

      <div className="mt-6">
        <p
          className={`min-h-10 break-words text-3xl font-bold tabular-nums ${hasPrice ? 'text-white' : 'text-slate-500'}`}
        >
          {formatPrice(price.price, market)}
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-white/[0.035] p-3">
          <dt className="text-slate-500">約24時間前比</dt>
          <dd className={`mt-1 font-semibold tabular-nums ${accentClass}`}>
            {formatChangePct(price.changePct)}
          </dd>
        </div>
        <div className="rounded-lg bg-white/[0.035] p-3">
          <dt className="text-slate-500">約24時間前比</dt>
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
        <span>基準値: {formatPrice(price.comparisonPrice, market)}</span>
      </div>
    </article>
  );
};
