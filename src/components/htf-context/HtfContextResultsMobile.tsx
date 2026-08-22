import { HTF_CONTEXT_TIMEFRAMES } from '../../config/htfContextSymbols';
import type { HtfContextTimeframeId } from '../../config/htfContextSymbols';
import type { HtfContextState } from '../../hooks/useHtfContext';
import {
  formatBarDate,
  formatPrice,
  formatSymbolLabel,
  getStateMeta,
  isLowerActive,
  isUpperActive,
} from '../../utils/htfContextFormat';
import { HtfContextFreshnessBadge } from './HtfContextFreshnessBadge';

const timeframeLabel = (id: HtfContextTimeframeId): string =>
  HTF_CONTEXT_TIMEFRAMES.find((tf) => tf.id === id)?.label ?? id;

const ResultCard = ({
  symbol,
  timeframeId,
  row,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: {
  symbol: string;
  timeframeId: HtfContextTimeframeId;
  row: HtfContextState | null;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  onSelect: (symbol: string, timeframeId: HtfContextTimeframeId) => void;
}) => {
  const meta = row ? getStateMeta(row.state) : null;
  const showReversalWarning =
    Boolean(row?.reversalWarning) && (row?.state === 2 || row?.state === -2);
  const upperActive = row ? isUpperActive(row.state) : false;
  const lowerActive = row ? isLowerActive(row.state) : false;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(symbol, timeframeId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(symbol, timeframeId);
        }
      }}
      className="cursor-pointer rounded-lg border border-white/10 bg-slate-950/40 p-3.5 transition hover:border-cyan-300/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(symbol);
            }}
            aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
            className={`-m-1.5 shrink-0 rounded-full p-1.5 text-lg leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${
              isFavorite ? 'text-amber-300' : 'text-slate-600 hover:text-amber-300'
            }`}
          >
            {isFavorite ? '★' : '☆'}
          </button>
          <p className="truncate text-sm font-bold text-white">
            {formatSymbolLabel(symbol)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/[0.04] px-2 py-0.5 text-xs font-bold text-slate-400 ring-1 ring-white/10">
          {timeframeLabel(timeframeId)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {meta ? (
          <span
            className={`inline-flex items-center gap-1 text-sm font-semibold ${meta.textClass}`}
          >
            <span aria-hidden="true">{meta.icon}</span>
            {meta.label}
          </span>
        ) : (
          <span className="text-sm text-slate-600">データ待ち</span>
        )}
        {row && (
          <span className="text-xs text-slate-500">
            {showReversalWarning ? (
              <span className="font-bold text-amber-300">⚠️ 反転警戒あり</span>
            ) : (
              '反転警戒なし'
            )}
          </span>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt
            className={upperActive ? 'font-semibold text-emerald-300' : 'text-slate-500'}
          >
            上ターゲット
          </dt>
          <dd
            className={`font-mono ${upperActive ? 'text-emerald-200' : 'text-slate-400'}`}
          >
            {row ? formatPrice(symbol, row.refHigh) : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className={lowerActive ? 'font-semibold text-rose-300' : 'text-slate-500'}>
            下ターゲット
          </dt>
          <dd className={`font-mono ${lowerActive ? 'text-rose-200' : 'text-slate-400'}`}>
            {row ? formatPrice(symbol, row.refLow) : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500">確定足</dt>
          <dd className="text-slate-300">{row ? formatBarDate(row.barTime) : '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500">最終受信</dt>
          <dd>
            <HtfContextFreshnessBadge
              symbol={symbol}
              timeframeId={timeframeId}
              updatedAt={row?.updatedAt ?? null}
            />
          </dd>
        </div>
      </dl>
    </div>
  );
};

export const HtfContextResultsMobile = ({
  results,
  favorites,
  onToggleFavorite,
  onSelect,
}: {
  results: {
    symbol: string;
    timeframeId: HtfContextTimeframeId;
    row: HtfContextState | null;
  }[];
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
  onSelect: (symbol: string, timeframeId: HtfContextTimeframeId) => void;
}) => (
  <div className="grid gap-2.5 sm:hidden">
    {results.map(({ symbol, timeframeId, row }) => (
      <ResultCard
        key={`${symbol}|${timeframeId}`}
        symbol={symbol}
        timeframeId={timeframeId}
        row={row}
        isFavorite={favorites.includes(symbol)}
        onToggleFavorite={onToggleFavorite}
        onSelect={onSelect}
      />
    ))}
  </div>
);
