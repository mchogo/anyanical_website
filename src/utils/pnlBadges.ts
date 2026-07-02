// 損益記録から実績バッジを判定する純関数群。
// UIとcanvas(pnlCard)の両方から使うため、DOM非依存で実装する。

export type BadgeRecord = {
  date: string; // YYYY-MM-DD
  pnl: number;
};

export type PnLBadge = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  achieved: boolean;
  /** 未達成時の進捗表示用テキスト（例: "2/3日"） */
  progress?: string;
};

export type BadgeTier = 'none' | 'silver' | 'gold';

const DAY_MS = 24 * 60 * 60 * 1000;

const parseYMD = (ymd: string): number => {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const isWeekend = (ymd: string): boolean => {
  const day = new Date(parseYMD(ymd)).getUTCDay();
  return day === 0 || day === 6;
};

/** 日付昇順・同一日付は合算した配列に正規化する */
const normalize = (records: BadgeRecord[]): BadgeRecord[] => {
  const byDate = new Map<string, number>();
  for (const r of records) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !Number.isFinite(r.pnl)) continue;
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.pnl);
  }
  return [...byDate.entries()]
    .map(([date, pnl]) => ({ date, pnl }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/** カレンダー日で連続する「条件を満たす日」の最大連続数 */
const maxCalendarStreak = (
  records: BadgeRecord[],
  cond: (r: BadgeRecord) => boolean,
): number => {
  let best = 0;
  let current = 0;
  let prevTime: number | null = null;
  for (const r of records) {
    if (!cond(r)) {
      current = 0;
      prevTime = null;
      continue;
    }
    const t = parseYMD(r.date);
    current = prevTime !== null && t - prevTime === DAY_MS ? current + 1 : 1;
    prevTime = t;
    if (current > best) best = current;
  }
  return best;
};

/** N日以上連続マイナスの直後にプラス転換した実績があるか */
const hasComeback = (records: BadgeRecord[], lossDays: number): boolean => {
  let losses = 0;
  for (const r of records) {
    if (r.pnl < 0) {
      losses += 1;
    } else if (r.pnl > 0) {
      if (losses >= lossDays) return true;
      losses = 0;
    } else {
      losses = 0;
    }
  }
  return false;
};

export const evaluateBadges = (
  rawRecords: BadgeRecord[],
  now: Date = new Date(),
): PnLBadge[] => {
  const records = normalize(rawRecords);

  const plusStreak = maxCalendarStreak(records, (r) => r.pnl > 0);
  const recordStreak = maxCalendarStreak(records, () => true);

  const weekendRecords = records.filter((r) => isWeekend(r.date) && r.pnl !== 0);
  const weekendWins = weekendRecords.filter((r) => r.pnl > 0).length;
  const weekendRate =
    weekendRecords.length > 0 ? (weekendWins / weekendRecords.length) * 100 : null;

  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTotal = records
    .filter((r) => r.date.startsWith(monthPrefix))
    .reduce((sum, r) => sum + r.pnl, 0);
  const monthHasRecords = records.some((r) => r.date.startsWith(monthPrefix));

  return [
    {
      id: 'streak3',
      label: '3日連続プラス',
      emoji: '🔥',
      description: 'カレンダー上で3日連続の利益を記録した',
      achieved: plusStreak >= 3,
      progress: plusStreak >= 3 ? undefined : `${plusStreak}/3日`,
    },
    {
      id: 'streak7',
      label: '7日連続プラス',
      emoji: '🌋',
      description: '7日連続の利益。もはや事件',
      achieved: plusStreak >= 7,
      progress: plusStreak >= 7 ? undefined : `${plusStreak}/7日`,
    },
    {
      id: 'weekend70',
      label: '週末の勝負師',
      emoji: '🌙',
      description: '週末（土日）の勝率70%以上（4日以上の記録が対象）',
      achieved: weekendRecords.length >= 4 && weekendRate !== null && weekendRate >= 70,
      progress:
        weekendRecords.length < 4
          ? `週末記録 ${weekendRecords.length}/4日`
          : `勝率 ${weekendRate?.toFixed(0)}%/70%`,
    },
    {
      id: 'monthlyGreen',
      label: '月間プラス',
      emoji: '🌱',
      description: '今月の損益合計がプラス',
      achieved: monthHasRecords && monthTotal > 0,
      progress: monthHasRecords && monthTotal > 0 ? undefined : '今月の合計をプラスに',
    },
    {
      id: 'comeback',
      label: 'カムバック',
      emoji: '🦅',
      description: '2日以上の連敗から翌日プラスで立て直した',
      achieved: hasComeback(records, 2),
    },
    {
      id: 'discipline',
      label: '記録の鬼',
      emoji: '📓',
      description: '14日連続で損益を記録した（勝敗問わず）',
      achieved: recordStreak >= 14,
      progress: recordStreak >= 14 ? undefined : `${recordStreak}/14日`,
    },
  ];
};

export const badgeTier = (badges: PnLBadge[]): BadgeTier => {
  const count = badges.filter((b) => b.achieved).length;
  if (count >= 4) return 'gold';
  if (count >= 2) return 'silver';
  return 'none';
};
