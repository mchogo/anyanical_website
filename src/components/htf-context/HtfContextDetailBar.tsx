import type { HtfContextTimeframeId } from '../../config/htfContextSymbols';
import type { HtfContextState } from '../../hooks/useHtfContext';
import {
  formatBarDate,
  formatPrice,
  formatSymbolLabel,
  getStateMeta,
  getTradingViewChartUrl,
  isLowerActive,
  isUpperActive,
} from '../../utils/htfContextFormat';
import { HtfContextFreshnessBadge } from './HtfContextFreshnessBadge';

// 選択中の銘柄をひと目で確認できる強調バー。TradingViewの実チャートへの導線・お気に入り登録もここに集約する。
// refHigh/refLowは常にこの2値のみで、意味を捏造せず「注目側」「反対側の参考値」という表示上の強調だけを変える。
export const HtfContextDetailBar = ({
  symbol,
  timeframeId,
  timeframeLabel,
  row,
  isFavorite,
  onToggleFavorite,
  detailBarRef,
}: {
  symbol: string;
  timeframeId: HtfContextTimeframeId;
  timeframeLabel: string;
  row: HtfContextState | undefined;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  detailBarRef?: React.RefObject<HTMLDivElement | null>;
}) => {
  const meta = row ? getStateMeta(row.state) : null;
  const showReversalWarning =
    Boolean(row?.reversalWarning) && (row?.state === 2 || row?.state === -2);
  const upperActive = row ? isUpperActive(row.state) : false;
  const lowerActive = row ? isLowerActive(row.state) : false;
  // 中立レンジ(state===0)は上下を同格表示するため、どちらも「注目側」扱いにする。
  const isNeutral = row?.state === 0;

  return (
    <div
      key={symbol}
      ref={detailBarRef}
      tabIndex={-1}
      className="animate-htf-select-in motion-reduce:animate-none mt-4 rounded-lg border border-cyan-300/30 bg-cyan-300/[0.06] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none" aria-hidden="true">
            {meta?.icon ?? '🌫️'}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleFavorite(symbol)}
                aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                className={`-m-1.5 rounded-full p-1.5 text-lg leading-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                  isFavorite ? 'text-amber-300' : 'text-slate-500 hover:text-amber-300'
                }`}
              >
                {isFavorite ? '★' : '☆'}
              </button>
              <p className="text-base font-bold text-white">
                {formatSymbolLabel(symbol)}
              </p>
            </div>
            <p className="text-xs text-slate-500">{timeframeLabel}</p>
          </div>
        </div>

        <a
          href={getTradingViewChartUrl(symbol)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full bg-cyan-300 px-4 text-xs font-bold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          TradingViewで開く ↗
        </a>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {meta ? (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${meta.badgeClass}`}
          >
            {meta.label}
          </span>
        ) : (
          <span className="text-sm text-slate-500">データ待ち</span>
        )}
        {showReversalWarning && (
          <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">
            ⚠️反転警戒
          </span>
        )}
        <HtfContextFreshnessBadge
          symbol={symbol}
          timeframeId={timeframeId}
          updatedAt={row?.updatedAt ?? null}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-6">
        <div>
          <p className={upperActive || isNeutral ? 'text-emerald-300' : 'text-slate-500'}>
            🎯 {isNeutral ? '上ターゲット' : upperActive ? '上ターゲット' : '基準側(上)'}
          </p>
          <p
            className={`font-mono ${upperActive || isNeutral ? 'text-emerald-200' : 'text-slate-400'}`}
          >
            {row ? formatPrice(symbol, row.refHigh) : '—'}
          </p>
        </div>
        <div>
          <p className={lowerActive || isNeutral ? 'text-rose-300' : 'text-slate-500'}>
            🎯 {isNeutral ? '下ターゲット' : lowerActive ? '下ターゲット' : '基準側(下)'}
          </p>
          <p
            className={`font-mono ${lowerActive || isNeutral ? 'text-rose-200' : 'text-slate-400'}`}
          >
            {row ? formatPrice(symbol, row.refLow) : '—'}
          </p>
        </div>
        {row && (
          <div>
            <p className="text-slate-500">確定足</p>
            <p className="text-slate-300">{formatBarDate(row.barTime)}</p>
          </div>
        )}
      </div>
    </div>
  );
};
