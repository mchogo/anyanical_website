import type { HtfContextState } from '../hooks/useHtfContext';
import {
  HTF_CONTEXT_DIGEST_PRIORITY,
  HTF_CONTEXT_HIGHER_TIMEFRAME,
  HTF_CONTEXT_PINECODE_BY_TIMEFRAME,
  HTF_CONTEXT_TIMEFRAMES,
  type HtfContextTimeframeId,
} from '../config/htfContextSymbols';
import { getStateMeta } from './htfContextFormat';
import { passesHtfSearchFilters } from './htfContextFilters';
import type { HtfSearchFilters } from './htfContextFilters';

export type RecommendationDirection = 'up' | 'down';

export type RecommendationItem = {
  symbol: string;
  timeframeId: HtfContextTimeframeId;
  row: HtfContextState;
  direction: RecommendationDirection;
  reasons: string[];
  higherTimeframeId: HtfContextTimeframeId | null;
};

const RECOMMENDATION_LIMIT = 8;

// Discordダイジェスト（worker/index.tsのsendHtfContextDigest）と同じ「良い条件」判定
// （反転警戒がない・レンジ(中立)でない・上位足があれば方向一致）に加え、画面側で選択中の
// フィルターも満たすものだけを優先順位に沿って拾う。各候補の選定根拠も一緒に組み立てる。
const collectRecommendationsForTimeframe = (
  rowByKey: Map<string, HtfContextState>,
  tf: (typeof HTF_CONTEXT_TIMEFRAMES)[number],
  limit: number,
  filters: HtfSearchFilters,
): RecommendationItem[] => {
  const higherId = HTF_CONTEXT_HIGHER_TIMEFRAME[tf.id] ?? null;
  const higherPineCode = higherId
    ? HTF_CONTEXT_PINECODE_BY_TIMEFRAME.get(higherId)
    : undefined;

  const items: RecommendationItem[] = [];
  for (const symbol of HTF_CONTEXT_DIGEST_PRIORITY) {
    if (items.length >= limit) break;
    const row = rowByKey.get(`${symbol}|${tf.pineCode}`);
    if (!row || row.state === 0 || row.reversalWarning) continue;
    if (!passesHtfSearchFilters(symbol, row, filters)) continue;

    const direction: RecommendationDirection = row.state > 0 ? 'up' : 'down';
    const reasons: string[] = [];

    if (higherPineCode && higherId) {
      const higherRow = rowByKey.get(`${symbol}|${higherPineCode}`);
      if (!higherRow || higherRow.state === 0) continue;
      if (Math.sign(row.state) !== Math.sign(higherRow.state)) continue;
      const arrow = direction === 'up' ? '↗' : '↘';
      reasons.push(`${tf.id} ${arrow} ${higherId}方向一致`);
    } else {
      // 上位足がない時間足（MN1）は、目線の継続そのものを根拠として示す
      reasons.push(direction === 'up' ? '上目線継続' : '下目線継続');
    }
    reasons.push('反転警戒なし');

    items.push({
      symbol,
      timeframeId: tf.id,
      row,
      direction,
      reasons,
      higherTimeframeId: higherId,
    });
  }
  return items;
};

// おすすめは基本D1基準（ダッシュボードの既定時間足に合わせる）。時間足フィルターでD1が
// 除外されている場合は選択中の時間足の中から順に拾う。D1（が選択されていればそれ）だけで
// 上限に届かない場合のみ、他の選択中の時間足（MN1→W1→H4の順）で不足分を補う。
export const computeRecommendations = (
  data: HtfContextState[],
  filters: HtfSearchFilters,
): RecommendationItem[] => {
  const rowByKey = new Map<string, HtfContextState>();
  for (const row of data) rowByKey.set(`${row.symbol}|${row.timeframe}`, row);

  const activeTimeframes = HTF_CONTEXT_TIMEFRAMES.filter((tf) =>
    filters.timeframes.includes(tf.id),
  );
  if (activeTimeframes.length === 0) return [];

  const d1 = activeTimeframes.find((tf) => tf.id === 'D1');
  const results = d1
    ? collectRecommendationsForTimeframe(rowByKey, d1, RECOMMENDATION_LIMIT, filters)
    : [];

  for (const tf of activeTimeframes) {
    if (results.length >= RECOMMENDATION_LIMIT) break;
    if (tf.id === 'D1') continue;
    results.push(
      ...collectRecommendationsForTimeframe(
        rowByKey,
        tf,
        RECOMMENDATION_LIMIT - results.length,
        filters,
      ),
    );
  }
  return results;
};

export const splitRecommendationsByDirection = (
  items: RecommendationItem[],
): { up: RecommendationItem[]; down: RecommendationItem[] } => ({
  up: items.filter((i) => i.direction === 'up'),
  down: items.filter((i) => i.direction === 'down'),
});

export const getRecommendationStateLabel = (state: number): string =>
  getStateMeta(state).label;
