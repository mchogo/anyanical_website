import { HTF_CONTEXT_TIMEFRAMES } from '../../config/htfContextSymbols';
import type { HtfContextTimeframeId } from '../../config/htfContextSymbols';
import { getStateMeta, formatSymbolLabel } from '../../utils/htfContextFormat';
import {
  splitRecommendationsByDirection,
  type RecommendationItem,
} from '../../utils/htfContextRecommendations';

const timeframeLabel = (id: HtfContextTimeframeId): string =>
  HTF_CONTEXT_TIMEFRAMES.find((tf) => tf.id === id)?.label ?? id;

const RecommendationCard = ({
  item,
  onSelect,
}: {
  item: RecommendationItem;
  onSelect: (symbol: string, timeframeId: HtfContextTimeframeId) => void;
}) => {
  const meta = getStateMeta(item.row.state);
  return (
    <button
      type="button"
      onClick={() => onSelect(item.symbol, item.timeframeId)}
      className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-slate-950/40 px-3.5 py-2.5 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none" aria-hidden="true">
          {meta.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {formatSymbolLabel(item.symbol)}
            <span className="ml-1.5 text-xs font-semibold text-slate-500">
              {timeframeLabel(item.timeframeId)}
              {item.higherTimeframeId && (
                <span className="text-slate-600">
                  {' '}
                  ({timeframeLabel(item.higherTimeframeId)}と一致)
                </span>
              )}
            </span>
          </p>
          <p className={`text-xs font-semibold ${meta.textClass}`}>{meta.label}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {item.reasons.map((reason) => (
          <span
            key={reason}
            className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-400"
          >
            {reason}
          </span>
        ))}
      </div>
    </button>
  );
};

const RecommendationColumn = ({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: RecommendationItem[];
  onSelect: (symbol: string, timeframeId: HtfContextTimeframeId) => void;
}) => {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <RecommendationCard
            key={`${item.symbol}|${item.timeframeId}`}
            item={item}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export const HtfContextRecommendations = ({
  items,
  onSelect,
}: {
  items: RecommendationItem[];
  onSelect: (symbol: string, timeframeId: HtfContextTimeframeId) => void;
}) => {
  if (items.length === 0) return null;
  const { up, down } = splitRecommendationsByDirection(items);

  return (
    <div>
      <h4 className="text-sm font-bold text-white">✨ 条件良さそうなペア</h4>
      <p className="mt-1 text-xs text-slate-600">
        反転警戒がなく、レンジ(中立)でもなく、上位足とも方向が一致している銘柄を優先順に表示しています。基本はD1（日足）基準で、D1だけで枠が埋まらない場合のみ他の時間足も表示します。売買を推奨するものではなく、必ずご自身でも確認してください。
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <RecommendationColumn title="📈 上方向候補" items={up} onSelect={onSelect} />
        <RecommendationColumn title="📉 下方向候補" items={down} onSelect={onSelect} />
      </div>
    </div>
  );
};
