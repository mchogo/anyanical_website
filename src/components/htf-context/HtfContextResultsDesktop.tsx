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

const ResultRow = ({
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
    <tr
      onClick={() => onSelect(symbol, timeframeId)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(symbol, timeframeId);
        }
      }}
      className="cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-300"
    >
      <td className="whitespace-nowrap py-2.5 pl-3 pr-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(symbol);
          }}
          aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
          className={`mr-1 rounded-full p-1.5 align-middle text-base leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${
            isFavorite ? 'text-amber-300' : 'text-slate-600 hover:text-amber-300'
          }`}
        >
          {isFavorite ? '★' : '☆'}
        </button>
        <span className="align-middle text-sm font-bold text-white">
          {formatSymbolLabel(symbol)}
        </span>
      </td>
      <td className="whitespace-nowrap py-2.5 pr-3 text-xs font-bold text-slate-400">
        {timeframeLabel(timeframeId)}
      </td>
      <td className="whitespace-nowrap py-2.5 pr-3 text-sm">
        {meta ? (
          <span
            className={`inline-flex items-center gap-1 font-semibold ${meta.textClass}`}
          >
            <span aria-hidden="true">{meta.icon}</span>
            {meta.label}
          </span>
        ) : (
          <span className="text-slate-600">データ待ち</span>
        )}
      </td>
      <td className="whitespace-nowrap py-2.5 pr-3 text-center text-sm">
        {showReversalWarning ? (
          <span title="反転警戒" aria-label="反転警戒あり">
            ⚠️
          </span>
        ) : (
          <span className="text-slate-700" aria-hidden="true">
            —
          </span>
        )}
      </td>
      <td
        className={`whitespace-nowrap py-2.5 pr-3 text-right font-mono text-sm ${
          upperActive ? 'font-semibold text-emerald-200' : 'text-slate-400'
        }`}
      >
        {row ? formatPrice(symbol, row.refHigh) : '—'}
      </td>
      <td
        className={`whitespace-nowrap py-2.5 pr-3 text-right font-mono text-sm ${
          lowerActive ? 'font-semibold text-rose-200' : 'text-slate-400'
        }`}
      >
        {row ? formatPrice(symbol, row.refLow) : '—'}
      </td>
      <td className="whitespace-nowrap py-2.5 pr-3 text-right text-xs text-slate-600">
        {row ? formatBarDate(row.barTime) : '—'}
      </td>
      <td className="whitespace-nowrap py-2.5 pr-3 text-right">
        <HtfContextFreshnessBadge
          symbol={symbol}
          timeframeId={timeframeId}
          updatedAt={row?.updatedAt ?? null}
          className="justify-end"
        />
      </td>
    </tr>
  );
};

export const HtfContextResultsDesktop = ({
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
  <div className="hidden overflow-x-auto rounded-lg border border-white/10 bg-slate-950/40 sm:block">
    <table className="w-full min-w-[760px] text-left">
      <thead>
        <tr className="border-b border-white/10 text-xs text-slate-500">
          <th scope="col" className="py-2.5 pl-3 pr-3 font-semibold">
            銘柄
          </th>
          <th scope="col" className="py-2.5 pr-3 font-semibold">
            時間足
          </th>
          <th scope="col" className="py-2.5 pr-3 font-semibold">
            状態
          </th>
          <th scope="col" className="py-2.5 pr-3 text-center font-semibold">
            反転警戒
          </th>
          <th scope="col" className="py-2.5 pr-3 text-right font-semibold">
            上ターゲット
          </th>
          <th scope="col" className="py-2.5 pr-3 text-right font-semibold">
            下ターゲット
          </th>
          <th scope="col" className="py-2.5 pr-3 text-right font-semibold">
            確定足
          </th>
          <th scope="col" className="py-2.5 pr-3 text-right font-semibold">
            鮮度
          </th>
        </tr>
      </thead>
      <tbody>
        {results.map(({ symbol, timeframeId, row }) => (
          <ResultRow
            key={`${symbol}|${timeframeId}`}
            symbol={symbol}
            timeframeId={timeframeId}
            row={row}
            isFavorite={favorites.includes(symbol)}
            onToggleFavorite={onToggleFavorite}
            onSelect={onSelect}
          />
        ))}
      </tbody>
    </table>
  </div>
);
