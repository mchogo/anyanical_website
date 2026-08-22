import type { HtfContextTimeframeId } from '../config/htfContextSymbols';

export type FreshnessStatus = 'fresh' | 'stale' | 'no-data';

export type FreshnessInfo = {
  status: FreshnessStatus;
  icon: string;
  label: string;
  detail?: string;
};

// 時間足ごとの「正常な更新間隔」の目安（ミリ秒）。これを超えたらstale扱いにする。
// H4/D1/W1/MN1で同じ閾値を使うと、月足が「8時間で古い」と誤判定されてしまうため時間足別に持つ。
const FRESHNESS_THRESHOLD_MS: Record<HtfContextTimeframeId, number> = {
  H4: 1000 * 60 * 60 * 8, // 4時間足の2本分
  D1: 1000 * 60 * 60 * 24 * 2, // 2日
  W1: 1000 * 60 * 60 * 24 * 9, // 9日
  MN1: 1000 * 60 * 60 * 24 * 35, // 35日
};

const isCryptoSymbol = (symbol: string): boolean => symbol.endsWith('USDT');

// FX・指数の週末休場を大まかに検知する（UTC基準の簡易判定。厳密な取引時間ではなく、
// 「stale＝壊れている」と断定せず中立表現に倒すための目安として使う）。
const isLikelyWeekendMarketClosed = (now: Date): boolean => {
  const day = now.getUTCDay();
  return day === 0 || day === 6;
};

const formatElapsedLabel = (elapsedMs: number): string => {
  if (elapsedMs < 0) return '最終受信 たった今';
  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 1) return '最終受信 たった今';
  if (minutes < 60) return `最終受信 ${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `最終受信 ${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `最終受信 ${days}日前`;
};

// 純粋関数（テスト容易性のため副作用なし。nowは呼び出し側から渡す）。
export const getFreshnessInfo = (
  symbol: string,
  timeframeId: HtfContextTimeframeId,
  updatedAtIso: string | null,
  now: Date,
): FreshnessInfo => {
  if (!updatedAtIso) {
    return {
      status: 'no-data',
      icon: '⚪️',
      label: 'データ未受信',
      detail: '次回確定足待ち',
    };
  }

  const updatedAt = new Date(updatedAtIso);
  if (Number.isNaN(updatedAt.getTime())) {
    return {
      status: 'no-data',
      icon: '⚪️',
      label: 'データ未受信',
      detail: '次回確定足待ち',
    };
  }

  const elapsedMs = now.getTime() - updatedAt.getTime();
  const threshold = FRESHNESS_THRESHOLD_MS[timeframeId];
  const label = formatElapsedLabel(elapsedMs);

  if (elapsedMs <= threshold) {
    return { status: 'fresh', icon: '🟢', label };
  }

  if (!isCryptoSymbol(symbol) && isLikelyWeekendMarketClosed(now)) {
    return { status: 'stale', icon: '🟡', label, detail: '市場休場中の可能性があります' };
  }

  return { status: 'stale', icon: '🟠', label };
};
