import { FRIDAY_CLOSE_REFERENCES, type MarketPrice } from '../config/markets';

type FridayCloseReferencesProps = {
  prices: Record<string, MarketPrice>;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 4,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 5,
});

const formatPrice = (value: number | null, pairedSymbol: string) => {
  if (value === null) {
    return '未取得';
  }

  if (pairedSymbol.includes('USD') || pairedSymbol.includes('JPY')) {
    return compactFormatter.format(value);
  }

  return currencyFormatter.format(value);
};

const formatChangePct = (value: number | null) => {
  if (value === null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const FridayCloseReferences = ({ prices }: FridayCloseReferencesProps) => (
  <section className="mt-10">
    <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold text-amber-200">Friday close reference</p>
        <h2 className="mt-1 text-2xl font-bold text-white">金曜クローズ基準</h2>
      </div>
      <p className="text-sm text-slate-400">公式市場が閉まっている銘柄の参考基準です。</p>
    </div>

    <div className="grid gap-3 lg:grid-cols-5">
      {FRIDAY_CLOSE_REFERENCES.map((reference) => {
        const livePrice = prices[reference.pairedSymbol];
        const isUp = (livePrice?.change ?? 0) > 0;
        const isDown = (livePrice?.change ?? 0) < 0;
        const accentClass = isUp
          ? 'text-emerald-300'
          : isDown
            ? 'text-rose-300'
            : 'text-slate-300';

        return (
          <article
            key={reference.pairedSymbol}
            className="rounded-lg border border-white/10 bg-white/[0.035] p-4"
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              {reference.market}
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">{reference.label}</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">約24時間前</dt>
                <dd className="mt-1 font-semibold text-slate-200 tabular-nums">
                  {formatPrice(
                    livePrice?.comparisonPrice ?? null,
                    reference.pairedSymbol,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">週末変動</dt>
                <dd className={`mt-1 font-semibold tabular-nums ${accentClass}`}>
                  {formatChangePct(livePrice?.changePct ?? null)}
                </dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
  </section>
);
