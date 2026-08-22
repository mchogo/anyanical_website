import { useState } from 'react';

import type { HtfContextTimeframeId } from '../../config/htfContextSymbols';
import { getFreshnessInfo } from '../../utils/htfContextFreshness';

// 色だけでなくアイコン+テキストを併用する（色覚だけに頼らない）。
export const HtfContextFreshnessBadge = ({
  symbol,
  timeframeId,
  updatedAt,
  className = '',
}: {
  symbol: string;
  timeframeId: HtfContextTimeframeId;
  updatedAt: string | null;
  className?: string;
}) => {
  // nowを1回だけ固定してレンダー中に再計算されるのを防ぐ（分単位の表示なので秒更新は不要）。
  const [now] = useState(() => new Date());
  const info = getFreshnessInfo(symbol, timeframeId, updatedAt, now);

  const colorClass =
    info.status === 'fresh'
      ? 'text-emerald-300'
      : info.status === 'stale'
        ? 'text-amber-300'
        : 'text-slate-500';

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${colorClass} ${className}`}>
      <span aria-hidden="true">{info.icon}</span>
      <span>
        {info.label}
        {info.detail && <span className="text-slate-500">（{info.detail}）</span>}
      </span>
    </span>
  );
};
