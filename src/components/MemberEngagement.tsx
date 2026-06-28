import { useEffect, useMemo, useState } from 'react';

import { MARKETS, WEEKEND_MARKETS, type MarketPrice } from '../config/markets';
import { useDiscordAuth, type DiscordAuthSession } from '../hooks/useDiscordAuth';
import { useFavoritesContext } from '../hooks/useFavorites';
import { INTERNAL_NAV_LINKS } from '../config/navigation';

const ROUTE_LABELS: Record<string, string> = Object.fromEntries(
  INTERNAL_NAV_LINKS.map((l) => [l.href.replace(/^#\/?/, ''), l.label]),
);

type StoredMissionState = {
  date: string;
  completedIds: string[];
};

type StoredMissionHistory = Record<string, string[]>;

type GapDirection = 'up' | 'down' | 'flat';

type GapPrediction = {
  id: string;
  weekKey: string;
  symbol: string;
  direction: GapDirection;
  confidence: number;
  note: string;
  createdAt: string;
};

const missionItems = [
  {
    id: 'board',
    title: '相場ボードを見る',
    body: 'GOLD、USDJPY、BTCの現在地を確認',
    href: '#/board',
  },
  {
    id: 'strength',
    title: '通貨強弱を見る',
    body: '強い通貨と弱い通貨を1つずつ確認',
    href: '#/tools/currency-strength',
  },
  {
    id: 'calendar',
    title: '経済指標を見る',
    body: '今日から明日にかけての重要イベントを確認',
    href: '#/tools/economic-calendar',
  },
  {
    id: 'gap',
    title: '窓開け監視を見る',
    body: '週末価格と金曜基準の差を確認',
    href: '#/tools/gap-watch',
  },
  {
    id: 'journal',
    title: '1行だけ振り返る',
    body: '今日の相場メモや反省を残す',
    href: '#/tools/trade-journal',
  },
];

const predictionMarkets = ['GOLD', 'USDJPY', 'BTC', 'SP500', 'JP225'];
const MORNING_ANALYSIS_URL =
  'https://discord.com/channels/1152131321297129534/1214143762033283092';
const GOLD_LEVELS_URL =
  'https://discord.com/channels/1152131321297129534/1312213122089746562';
const MARKET_NOTICE_URL =
  'https://discord.com/channels/1152131321297129534/1349588664245817445';

const premiumPreviewLinks = [
  {
    title: '先出し考察',
    body: '今日の目線、注目ライン、崩れる条件を確認',
    href: MORNING_ANALYSIS_URL,
  },
  {
    title: 'ゴールドの節目公開',
    body: 'GOLDで見ておきたい価格帯や反応候補を確認',
    href: GOLD_LEVELS_URL,
  },
  {
    title: '追加考察',
    body: '相場変化、注意事項、EA停止判断を確認',
    href: MARKET_NOTICE_URL,
  },
];

const PremiumLockMark = ({ className = '' }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={`grid place-items-center rounded-full border border-amber-100/40 bg-amber-200/15 shadow-[0_0_24px_rgba(251,191,36,0.16)] ${className}`}
  >
    <span className="relative h-4 w-4">
      <span className="absolute left-1/2 top-0 h-2.5 w-3 -translate-x-1/2 rounded-t-full border-2 border-amber-100 border-b-0" />
      <span className="absolute bottom-0 left-1/2 h-2.5 w-4 -translate-x-1/2 rounded-[4px] bg-amber-100" />
      <span className="absolute bottom-[3px] left-1/2 h-1 w-0.5 -translate-x-1/2 rounded-full bg-slate-950" />
    </span>
  </span>
);

const directionLabels: Record<GapDirection, string> = {
  up: '上方向',
  down: '下方向',
  flat: '小動き',
};

const todayJst = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(Date.now());

const weekKeyJst = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const now = new Date();
  const day = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      weekday: 'short',
    })
      .format(now)
      .replace('Sun', '0')
      .replace('Mon', '1')
      .replace('Tue', '2')
      .replace('Wed', '3')
      .replace('Thu', '4')
      .replace('Fri', '5')
      .replace('Sat', '6'),
  );
  const fridayOffset = 5 - day;
  const friday = new Date(now.getTime() + fridayOffset * 24 * 60 * 60 * 1000);
  return formatter.format(friday);
};

const createId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const useStorageOwner = () => {
  const auth = useDiscordAuth();
  return {
    auth,
    ownerId: auth.session?.user.id ?? 'guest',
    displayName: auth.session ? auth.getDisplayName(auth.session.user) : 'ゲスト',
  };
};

const missionStorageKey = (ownerId: string) => `wmb.dailyMission.${ownerId}`;
const predictionStorageKey = (ownerId: string) => `wmb.gapPredictions.${ownerId}`;
const MISSION_RETURN_STORAGE_KEY = 'wmb.returnToMission';
const missionCelebrationKey = (ownerId: string, date: string) =>
  `wmb.dailyMissionCelebrated.${ownerId}.${date}`;

const isStoredMissionState = (
  value: StoredMissionHistory | StoredMissionState,
): value is StoredMissionState =>
  'date' in value &&
  typeof value.date === 'string' &&
  'completedIds' in value &&
  Array.isArray(value.completedIds);

const useDailyMissionState = (ownerId: string) => {
  const date = todayJst();
  const [history, setHistory] = useState<StoredMissionHistory>(() => {
    const stored = readJson<StoredMissionHistory | StoredMissionState>(
      missionStorageKey(ownerId),
      {},
    );
    if (isStoredMissionState(stored)) {
      return { [stored.date]: stored.completedIds };
    }
    return stored;
  });

  useEffect(() => {
    const stored = readJson<StoredMissionHistory | StoredMissionState>(
      missionStorageKey(ownerId),
      {},
    );
    if (isStoredMissionState(stored)) {
      setHistory({ [stored.date]: stored.completedIds });
      return;
    }
    setHistory(stored);
  }, [ownerId]);

  useEffect(() => {
    writeJson(missionStorageKey(ownerId), history);
  }, [history, ownerId]);

  const toggle = (id: string) => {
    setHistory((current) => {
      const completedIds = current[date] ?? [];
      const exists = completedIds.includes(id);
      const next = {
        ...current,
        [date]: exists
          ? completedIds.filter((completedId) => completedId !== id)
          : [...completedIds, id],
      };
      writeJson(missionStorageKey(ownerId), next);
      return next;
    });
  };

  return { state: { date, completedIds: history[date] ?? [] }, history, toggle };
};

const syncPredictionsToServer = (predictions: GapPrediction[], token: string) => {
  void fetch('/api/gap-predictions', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ predictions }),
  });
};

const useGapPredictions = (ownerId: string, session?: DiscordAuthSession | null) => {
  const [predictions, setPredictions] = useState<GapPrediction[]>(() =>
    readJson<GapPrediction[]>(predictionStorageKey(ownerId), []),
  );

  useEffect(() => {
    setPredictions(readJson<GapPrediction[]>(predictionStorageKey(ownerId), []));
  }, [ownerId]);

  useEffect(() => {
    writeJson(predictionStorageKey(ownerId), predictions);
  }, [ownerId, predictions]);

  // On session load, fetch from server and merge (server takes precedence for same week+symbol)
  useEffect(() => {
    if (!session?.accessToken) return;
    void fetch('/api/gap-predictions', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json() as Promise<GapPrediction[]>)
      .then((remote) => {
        if (!Array.isArray(remote) || remote.length === 0) return;
        setPredictions((local) => {
          const merged = [...remote];
          for (const l of local) {
            if (!merged.some((r) => r.weekKey === l.weekKey && r.symbol === l.symbol)) {
              merged.push(l);
            }
          }
          writeJson(predictionStorageKey(ownerId), merged);
          return merged;
        });
      })
      .catch(() => {});
  }, [session?.accessToken, ownerId]);

  const addPrediction = (prediction: Omit<GapPrediction, 'id' | 'createdAt'>) => {
    setPredictions((current) => {
      const next = [
        { ...prediction, id: createId(), createdAt: new Date().toISOString() },
        ...current.filter(
          (item) => !(item.weekKey === prediction.weekKey && item.symbol === prediction.symbol),
        ),
      ];
      if (session?.accessToken) syncPredictionsToServer(next, session.accessToken);
      return next;
    });
  };

  const removePrediction = (id: string) => {
    setPredictions((current) => {
      const next = current.filter((item) => item.id !== id);
      if (session?.accessToken) syncPredictionsToServer(next, session.accessToken);
      return next;
    });
  };

  return { predictions, addPrediction, removePrediction };
};

const formatChangePct = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const resultLabel = (price: MarketPrice | undefined) => {
  const changePct = price?.changePct;
  if (changePct === null || changePct === undefined) return '判定待ち';
  if (changePct > 0.15) return '上方向';
  if (changePct < -0.15) return '下方向';
  return '小動き';
};

const resultDirection = (price: MarketPrice | undefined): GapDirection | null => {
  const changePct = price?.changePct;
  if (changePct === null || changePct === undefined) return null;
  if (changePct > 0.15) return 'up';
  if (changePct < -0.15) return 'down';
  return 'flat';
};

const isPredictionHit = (prediction: GapPrediction, price: MarketPrice | undefined) => {
  const actual = resultDirection(price);
  return actual === null ? null : actual === prediction.direction;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));

const buildXShareUrl = (
  prediction: GapPrediction,
  price: MarketPrice | undefined,
  marketName: string,
) => {
  const hit = isPredictionHit(prediction, price);
  const text = [
    `週末ギャップ予想: ${marketName}`,
    `予想 ${directionLabels[prediction.direction]} / 自信度 ${prediction.confidence}%`,
    `現在変化率 ${formatChangePct(price?.changePct)} / 判定 ${resultLabel(price)}`,
    hit === null ? '答え合わせ待ち' : hit ? '今のところ的中' : '今のところ外れ',
    '#アニャニカル覗き部屋',
  ].join('\n');
  const url = `${window.location.origin}${window.location.pathname}#/tools/gap-prediction`;
  return `https://twitter.com/intent/tweet?${new URLSearchParams({ text, url }).toString()}`;
};

const roleLabel = (roleAccess: string) => {
  if (roleAccess === 'admin') return 'Admin';
  if (roleAccess === 'premium') return 'Premium';
  if (roleAccess === 'member') return 'Discord member';
  return 'Guest';
};

export const MemberDashboard = ({ prices }: { prices: Record<string, MarketPrice> }) => {
  const { auth, ownerId, displayName } = useStorageOwner();
  const [lockedPremiumTitle, setLockedPremiumTitle] = useState<string | null>(null);
  const { state, history } = useDailyMissionState(ownerId);
  const { predictions } = useGapPredictions(ownerId);
  const completedCount = state.completedIds.length;
  const activePredictions = predictions.filter((item) => item.weekKey === weekKeyJst());
  const completedMissionDays = Object.values(history).filter(
    (completedIds) => completedIds.length > 0,
  ).length;
  const recentPredictions = predictions.slice(0, 4);
  const featuredSymbols = ['GOLD', 'USDJPY', 'BTC'];

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-cyan-200">
              {roleLabel(auth.roleAccess)}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              {displayName}のダッシュボード
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              今日の確認、週末予想、プレミアム導線をここからまとめて追えます。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!auth.isAuthenticated && (
              <button
                type="button"
                onClick={() => auth.signIn('#/tools/member-dashboard')}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
              >
                Discordログイン
              </button>
            )}
            {!auth.canAccessPremium && (
              <a
                href="#/tools/participation"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
              >
                プレミアムを見る
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <a
          href="#/tools/daily-mission"
          className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5 transition hover:border-cyan-300/40 hover:bg-cyan-300/15"
        >
          <p className="text-sm font-semibold text-cyan-100">今日のミッション</p>
          <p className="mt-3 text-3xl font-black text-white">
            {completedCount}/{missionItems.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-cyan-50/75">
            相場確認の習慣化。完了状態はこの端末に保存されます。
          </p>
        </a>
        <a
          href="#/tools/gap-prediction"
          className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5 transition hover:border-amber-300/40 hover:bg-amber-300/15"
        >
          <p className="text-sm font-semibold text-amber-100">週末ギャップ予想</p>
          <p className="mt-3 text-3xl font-black text-white">
            {activePredictions.length}件
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-50/75">
            月曜オープン前の方向感を記録して、週明けに答え合わせします。
          </p>
        </a>
        <a
          href="#/tools/trade-journal"
          className="rounded-lg border border-white/10 bg-slate-900/80 p-5 transition hover:border-emerald-300/30 hover:bg-emerald-300/10"
        >
          <p className="text-sm font-semibold text-emerald-200">トレード日誌</p>
          <p className="mt-3 text-xl font-bold text-white">記録と振り返りを残す</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            プレミアムでは口座別の損益カレンダーを使えます。
          </p>
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-cyan-200">Saved records</p>
              <h3 className="mt-1 text-xl font-bold text-white">保存済みの記録</h3>
            </div>
            <p className="text-right text-xs leading-5 text-slate-500">
              {auth.isAuthenticated ? 'Discordユーザー別に保存' : 'ゲスト保存中'}
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-950/50 p-4">
              <p className="text-xs text-slate-500">ミッション記録日数</p>
              <p className="mt-1 text-2xl font-black text-white">
                {completedMissionDays}日
              </p>
            </div>
            <div className="rounded-lg bg-slate-950/50 p-4">
              <p className="text-xs text-slate-500">ギャップ予想の保存数</p>
              <p className="mt-1 text-2xl font-black text-white">
                {predictions.length}件
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-amber-100">Recent games</p>
          <h3 className="mt-1 text-xl font-bold text-white">最近の予想</h3>
          <div className="mt-4 space-y-2">
            {recentPredictions.length === 0 ? (
              <p className="rounded-lg bg-slate-950/50 p-4 text-sm text-slate-500">
                まだ保存済みの予想がありません。
              </p>
            ) : (
              recentPredictions.map((prediction) => {
                const market = MARKETS.find((item) => item.symbol === prediction.symbol);
                return (
                  <a
                    key={prediction.id}
                    href="#/tools/gap-prediction"
                    className="block rounded-lg bg-slate-950/50 p-3 text-sm transition hover:bg-amber-300/10"
                  >
                    <span className="font-bold text-white">
                      {market?.displayName ?? prediction.symbol}
                    </span>
                    <span className="ml-2 text-slate-400">
                      {prediction.weekKey} / {directionLabels[prediction.direction]}
                    </span>
                  </a>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-cyan-200">Watch</p>
          <h3 className="mt-1 text-xl font-bold text-white">いま見る主要銘柄</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {featuredSymbols.map((symbol) => {
              const market = MARKETS.find((item) => item.symbol === symbol);
              const price = prices[symbol];
              return (
                <a
                  key={symbol}
                  href="#/board"
                  className="rounded-lg border border-white/10 bg-slate-950/50 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  <p className="text-xs font-semibold text-slate-500">
                    {market?.displayName ?? symbol}
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {price?.price?.toLocaleString('en-US') ?? '取得待ち'}
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      (price?.changePct ?? 0) > 0
                        ? 'text-emerald-300'
                        : (price?.changePct ?? 0) < 0
                          ? 'text-rose-300'
                          : 'text-slate-400'
                    }`}
                  >
                    {formatChangePct(price?.changePct)}
                  </p>
                </a>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
          <p className="text-sm font-semibold text-amber-100">Premium preview</p>
          <h3 className="mt-1 text-xl font-bold text-white">加入後に増える確認</h3>
          <p className="mt-2 text-sm leading-6 text-amber-50/80">
            プレミアムでは、相場を見る前に確認したいDiscord情報へ直接移動できます。
          </p>
          <div className="mt-4 grid gap-2">
            {premiumPreviewLinks.map((link) =>
              auth.canAccessPremium ? (
                <a
                  key={link.href}
                  href={link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="rounded-lg border border-amber-200/20 bg-slate-950/40 p-3 text-left transition hover:border-amber-200/50 hover:bg-amber-200/10"
                >
                  <p className="text-sm font-bold text-white">{link.title}</p>
                  <p className="mt-1 text-xs leading-5 text-amber-50/70">{link.body}</p>
                </a>
              ) : (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => setLockedPremiumTitle(link.title)}
                  className="relative rounded-lg border border-amber-200/20 bg-slate-950/40 p-3 text-left transition hover:border-amber-200/50 hover:bg-amber-200/10"
                >
                  <PremiumLockMark className="absolute right-3 top-3 h-8 w-8" />
                  <span className="block pr-9 text-sm font-bold text-white">
                    {link.title}
                  </span>
                  <span className="mt-1 block pr-8 text-xs leading-5 text-amber-50/70">
                    {link.body}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {lockedPremiumTitle && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-amber-300/30 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <p className="text-sm font-semibold text-amber-100">Premium locked</p>
            <h3 className="mt-1 text-xl font-bold text-white">
              {lockedPremiumTitle} はプレミアム限定です
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              先出し考察、ゴールドの節目、追加考察をDiscord限定チャンネルで確認できます。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#/tools/participation"
                onClick={() => setLockedPremiumTitle(null)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
              >
                プレミアム内容を見る
              </a>
              {!auth.isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setLockedPremiumTitle(null);
                    auth.signIn('#/tools/member-dashboard');
                  }}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
                >
                  Discordログイン
                </button>
              )}
              <button
                type="button"
                onClick={() => setLockedPremiumTitle(null)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      {auth.canAccessPremium && <FavoritesManager />}
    </section>
  );
};

const FavoritesManager = () => {
  const { favorites, toggleFavorite } = useFavoritesContext();
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <p className="text-sm font-semibold text-amber-200">お気に入り</p>
      <h3 className="mt-1 text-xl font-bold text-white">お気に入りページ管理</h3>
      {favorites.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          各ページ右上の ☆ を押してお気に入りに追加できます。
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {favorites.map((route) => (
            <li
              key={route}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/40 px-4 py-2.5"
            >
              <a
                href={`#/${route}`}
                className="flex-1 text-sm font-semibold text-white transition hover:text-amber-200"
              >
                {ROUTE_LABELS[route] ?? route}
              </a>
              <button
                type="button"
                onClick={() => toggleFavorite(route)}
                aria-label="お気に入りから削除"
                className="shrink-0 grid h-8 w-8 place-items-center rounded-full text-slate-500 ring-1 ring-white/10 transition hover:bg-white/[0.06] hover:text-white"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-600">
        ★ をもう一度押すと削除できます。順番はページを訪れた順です。
      </p>
    </div>
  );
};

export const DailyMissionTool = () => {
  const { auth, ownerId } = useStorageOwner();
  const { state, history, toggle } = useDailyMissionState(ownerId);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lockedPremiumTitle, setLockedPremiumTitle] = useState<string | null>(null);
  const completedCount = state.completedIds.length;
  const progress = Math.round((completedCount / missionItems.length) * 100);
  const historyRows = Object.entries(history)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(0, 7);

  useEffect(() => {
    if (completedCount !== missionItems.length) return;
    const key = missionCelebrationKey(ownerId, state.date);
    if (window.sessionStorage.getItem(key) === '1') return;
    window.sessionStorage.setItem(key, '1');
    setShowCelebration(true);
  }, [completedCount, ownerId, state.date]);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-cyan-200">{state.date}</p>
            <h2 className="mt-1 text-2xl font-bold text-white">今日の相場ミッション</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              毎日見る場所を固定して、相場確認を習慣化します。
            </p>
          </div>
          <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
            <p className="text-xs font-semibold text-cyan-100">Progress</p>
            <p className="text-2xl font-black text-white">{progress}%</p>
          </div>
        </div>
      </div>

      {!auth.isAuthenticated && (
        <div className="rounded-lg border border-indigo-300/25 bg-indigo-400/10 p-4 text-sm leading-6 text-indigo-50/80">
          Discordログインすると、あなた専用のミッションとして保存できます。この端末ではゲスト状態でも保存されます。
        </div>
      )}

      <div className="grid gap-3">
        {missionItems.map((item, index) => {
          const completed = state.completedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className={`rounded-lg border p-4 transition ${
                completed
                  ? 'border-emerald-300/30 bg-emerald-300/10'
                  : 'border-white/10 bg-slate-900/80'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ring-1 transition ${
                    completed
                      ? 'bg-emerald-300 text-slate-950 ring-emerald-200'
                      : 'bg-white/[0.04] text-slate-400 ring-white/10 hover:bg-white/10'
                  }`}
                  aria-label={`${item.title}を完了にする`}
                >
                  {completed ? '✓' : index + 1}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
                </div>
                <a
                  href={item.href}
                  onClick={() => {
                    if (!completed) toggle(item.id);
                    window.sessionStorage.setItem(MISSION_RETURN_STORAGE_KEY, '1');
                  }}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-cyan-100 ring-1 ring-white/10 transition hover:bg-cyan-300/10"
                >
                  開く
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-100">Premium check</p>
            <h3 className="mt-1 text-xl font-bold text-white">
              プレミアム限定コンテンツ
            </h3>
            <p className="mt-2 text-sm leading-6 text-amber-50/80">
              先出し考察、注目レートなど限定コンテンツはDiscordからご確認ください。
            </p>
          </div>
          {!auth.isAuthenticated && (
            <button
              type="button"
              onClick={() => auth.signIn('#/tools/daily-mission')}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
            >
              Discordログイン
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {auth.canAccessPremium ? (
            <>
              <a
                href={MORNING_ANALYSIS_URL}
                rel="noopener noreferrer"
                target="_blank"
                className="rounded-lg border border-amber-200/20 bg-slate-950/40 p-4 transition hover:border-amber-200/50 hover:bg-amber-200/10"
              >
                <p className="text-sm font-bold text-white">朝の考察</p>
                <p className="mt-2 text-xs leading-5 text-amber-50/70">
                  今日の目線、注目ライン、崩れる条件を確認
                </p>
              </a>
              <a
                href={MARKET_NOTICE_URL}
                rel="noopener noreferrer"
                target="_blank"
                className="rounded-lg border border-amber-200/20 bg-slate-950/40 p-4 transition hover:border-amber-200/50 hover:bg-amber-200/10"
              >
                <p className="text-sm font-bold text-white">変化・注意事項</p>
                <p className="mt-2 text-xs leading-5 text-amber-50/70">
                  相場変化、注意事項、EA停止判断を確認
                </p>
              </a>
            </>
          ) : (
            <>
              {[
                {
                  title: '朝の考察',
                  body: '今日の目線、注目ライン、崩れる条件をプレミアムで確認',
                },
                {
                  title: '変化・注意事項',
                  body: '相場変化、注意事項、EA停止判断をプレミアムで確認',
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setLockedPremiumTitle(item.title)}
                  className="relative overflow-hidden rounded-lg border border-amber-200/20 bg-slate-950/40 p-4 text-left transition hover:border-amber-200/50 hover:bg-amber-200/10"
                >
                  <PremiumLockMark className="absolute right-3 top-3 h-9 w-9" />
                  <p className="pr-10 text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-2 pr-6 text-xs leading-5 text-amber-50/70">
                    {item.body}
                  </p>
                </button>
              ))}
            </>
          )}
        </div>
        {!auth.canAccessPremium && (
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="#/tools/participation"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
            >
              プレミアム内容を見る
            </a>
            <a
              href="#/tools/community"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-amber-50 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              限定チャンネルを見る
            </a>
          </div>
        )}
        {auth.canAccessPremium && (
          <div className="mt-4 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50/80">
            <p className="font-bold text-white">Discordリアクション</p>
            <p className="mt-1">
              考察や注目レートを確認したら、Discord内でいいね・リアクションを押してください。プレゼント企画の抽選優遇にもつながります。
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <p className="text-sm font-semibold text-cyan-200">History</p>
        <h3 className="mt-1 text-xl font-bold text-white">過去のミッション記録</h3>
        <div className="mt-4 grid gap-2">
          {historyRows.length === 0 ? (
            <p className="rounded-lg bg-slate-950/50 p-4 text-sm text-slate-500">
              まだ記録がありません。今日のミッションを完了すると履歴に残ります。
            </p>
          ) : (
            historyRows.map(([date, completedIds]) => (
              <div
                key={date}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/50 p-3"
              >
                <p className="text-sm font-bold text-white">{date}</p>
                <p className="text-sm text-slate-400">
                  {completedIds.length}/{missionItems.length} 完了
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {lockedPremiumTitle && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setLockedPremiumTitle(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-amber-300/30 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-amber-100">Premium locked</p>
            <h3 className="mt-1 text-xl font-bold text-white">
              {lockedPremiumTitle} はプレミアム限定です
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              先出し考察、ゴールドの節目、追加考察をDiscord限定チャンネルで確認できます。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#/tools/participation"
                onClick={() => setLockedPremiumTitle(null)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
              >
                プレミアム内容を見る
              </a>
              {!auth.isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setLockedPremiumTitle(null);
                    auth.signIn('#/tools/daily-mission');
                  }}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
                >
                  Discordログイン
                </button>
              )}
              <button
                type="button"
                onClick={() => setLockedPremiumTitle(null)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-emerald-300/30 bg-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="relative p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200" />
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-200/50 bg-emerald-300/15 shadow-[0_0_36px_rgba(110,231,183,0.18)]">
                <span className="text-3xl font-black text-emerald-200">✓</span>
              </div>
              <p className="mt-5 text-center text-sm font-semibold text-emerald-200">
                Daily mission complete
              </p>
              <h3 className="mt-2 text-center text-2xl font-black text-white">
                今日の相場チェック完了
              </h3>
              <p className="mt-3 text-center text-sm leading-6 text-slate-400">
                相場ボード、強弱、指標、窓開け、振り返りまで確認できました。
              </p>
              {auth.canAccessPremium && (
                <div className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50/85">
                  <p className="font-bold text-white">プレミアム特典</p>
                  <p className="mt-1">
                    Discord内の限定コンテンツにいいね・リアクションすると、プレゼント企画の当選確率アップにつながります。
                  </p>
                </div>
              )}
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <a
                  href="#/tools/member-dashboard"
                  onClick={() => setShowCelebration(false)}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                >
                  マイページへ
                </a>
                <button
                  type="button"
                  onClick={() => setShowCelebration(false)}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  続けて見る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export const GapPredictionTool = ({
  prices,
}: {
  prices: Record<string, MarketPrice>;
}) => {
  const { auth, ownerId } = useStorageOwner();
  const { predictions, addPrediction, removePrediction } = useGapPredictions(ownerId, auth.session);
  const [symbol, setSymbol] = useState('GOLD');
  const [direction, setDirection] = useState<GapDirection>('up');
  const [confidence, setConfidence] = useState(60);
  const [note, setNote] = useState('');
  const currentWeekKey = weekKeyJst();
  const currentPredictions = predictions.filter(
    (prediction) => prediction.weekKey === currentWeekKey,
  );
  const pastPredictions = predictions.filter(
    (prediction) => prediction.weekKey !== currentWeekKey,
  );
  const pastWeekKeys = Array.from(
    new Set(pastPredictions.map((prediction) => prediction.weekKey)),
  ).slice(0, 6);
  const markets = useMemo(
    () =>
      predictionMarkets
        .map((marketSymbol) =>
          WEEKEND_MARKETS.find((item) => item.symbol === marketSymbol),
        )
        .filter(Boolean),
    [],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    addPrediction({
      weekKey: currentWeekKey,
      symbol,
      direction,
      confidence,
      note: note.trim(),
    });
    setNote('');
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-100">Week {currentWeekKey}</p>
            <h2 className="mt-1 text-2xl font-bold text-white">週末ギャップ予想ゲーム</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              週末の方向感を記録し、月曜オープン前後に金曜基準の変化と照らして答え合わせします。
            </p>
          </div>
          {!auth.isAuthenticated && (
            <button
              type="button"
              onClick={() => auth.signIn('#/tools/gap-prediction')}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
            >
              Discordログインして保存
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5"
        >
          <p className="text-sm font-semibold text-amber-100">Prediction</p>
          <h3 className="mt-1 text-xl font-bold text-white">今週の予想を入れる</h3>

          <label className="mt-5 block text-xs font-semibold text-amber-50/70">
            銘柄
          </label>
          <select
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-amber-200/60 focus:outline-none"
          >
            {markets.map((market) => (
              <option key={market!.symbol} value={market!.symbol}>
                {market!.displayName}
              </option>
            ))}
          </select>

          <div className="mt-5">
            <p className="text-xs font-semibold text-amber-50/70">方向</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['up', 'down', 'flat'] as GapDirection[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDirection(value)}
                  className={`min-h-10 rounded-full px-3 text-sm font-bold ring-1 transition ${
                    direction === value
                      ? 'bg-amber-200 text-slate-950 ring-amber-100'
                      : 'bg-white/[0.04] text-amber-50/80 ring-white/10 hover:bg-white/10'
                  }`}
                >
                  {directionLabels[value]}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-5 block text-xs font-semibold text-amber-50/70">
            自信度 {confidence}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={confidence}
            onChange={(event) => setConfidence(Number(event.target.value))}
            className="mt-2 w-full accent-amber-200"
          />

          <label className="mt-5 block text-xs font-semibold text-amber-50/70">
            メモ
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="週末ニュース、金曜引け、指標、地政学など"
            className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-amber-200/60 focus:outline-none"
          />

          <button
            type="submit"
            className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
          >
            予想を保存
          </button>
        </form>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-cyan-200">Answer check</p>
              <h3 className="mt-1 text-xl font-bold text-white">今週の予想と現在値</h3>
            </div>
            <a
              href="#/tools/gap-watch"
              className="text-sm font-bold text-cyan-100 transition hover:text-cyan-50"
            >
              窓開け監視へ →
            </a>
          </div>

          <div className="mt-4 space-y-3">
            {currentPredictions.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
                まだ今週の予想がありません。左のフォームから銘柄ごとに保存できます。
              </div>
            ) : (
              currentPredictions.map((prediction) => {
                const market = MARKETS.find((item) => item.symbol === prediction.symbol);
                const price = prices[prediction.symbol];
                const hit = isPredictionHit(prediction, price);
                const marketName = market?.displayName ?? prediction.symbol;
                return (
                  <div
                    key={prediction.id}
                    className="rounded-lg border border-white/10 bg-slate-950/50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{marketName}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          予想: {directionLabels[prediction.direction]} / 自信度{' '}
                          {prediction.confidence}%
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          保存: {formatDateTime(prediction.createdAt)}
                        </p>
                        {prediction.note && (
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {prediction.note}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePrediction(prediction.id)}
                        className="shrink-0 rounded-full bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10"
                      >
                        削除
                      </button>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg bg-white/[0.04] p-3">
                        <p className="text-xs text-slate-500">現在変化率</p>
                        <p className="mt-1 font-bold text-white">
                          {formatChangePct(price?.changePct)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/[0.04] p-3">
                        <p className="text-xs text-slate-500">簡易判定</p>
                        <p className="mt-1 font-bold text-white">{resultLabel(price)}</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.04] p-3">
                        <p className="text-xs text-slate-500">現在値</p>
                        <p className="mt-1 font-bold text-white">
                          {price?.price?.toLocaleString('en-US') ?? '取得待ち'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold ${
                          hit === null
                            ? 'bg-white/[0.04] text-slate-400 ring-1 ring-white/10'
                            : hit
                              ? 'bg-emerald-300/15 text-emerald-200 ring-1 ring-emerald-300/30'
                              : 'bg-rose-300/15 text-rose-200 ring-1 ring-rose-300/30'
                        }`}
                      >
                        {hit === null
                          ? '答え合わせ待ち'
                          : hit
                            ? '今のところ的中'
                            : '今のところ外れ'}
                      </span>
                      <a
                        href={buildXShareUrl(prediction, price, marketName)}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="inline-flex min-h-8 items-center rounded-full bg-white/[0.04] px-3 text-xs font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
                      >
                        Xでシェア
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <p className="text-sm font-semibold text-amber-100">Archive</p>
          <h3 className="mt-1 text-xl font-bold text-white">過去の予想記録</h3>
          <div className="mt-4 space-y-3">
            {pastWeekKeys.length === 0 ? (
              <p className="rounded-lg bg-slate-950/50 p-4 text-sm text-slate-500">
                過去週の予想はまだありません。
              </p>
            ) : (
              pastWeekKeys.map((weekKey) => (
                <div key={weekKey} className="rounded-lg bg-slate-950/50 p-4">
                  <p className="text-sm font-bold text-white">Week {weekKey}</p>
                  <div className="mt-3 grid gap-2">
                    {pastPredictions
                      .filter((prediction) => prediction.weekKey === weekKey)
                      .map((prediction) => {
                        const market = MARKETS.find(
                          (item) => item.symbol === prediction.symbol,
                        );
                        const price = prices[prediction.symbol];
                        const hit = isPredictionHit(prediction, price);
                        return (
                          <div
                            key={prediction.id}
                            className="flex flex-col justify-between gap-2 rounded-lg bg-white/[0.04] p-3 text-sm sm:flex-row sm:items-center"
                          >
                            <div>
                              <span className="font-bold text-white">
                                {market?.displayName ?? prediction.symbol}
                              </span>
                              <span className="ml-2 text-slate-400">
                                {directionLabels[prediction.direction]} /{' '}
                                {prediction.confidence}%
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                              {hit === null ? '判定待ち' : hit ? '的中' : '外れ'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
          <p className="text-sm font-semibold text-cyan-200">Links</p>
          <h3 className="mt-1 text-xl font-bold text-white">予想後に見るリンク</h3>
          <div className="mt-4 grid gap-2">
            <a
              href="#/tools/gap-watch"
              className="rounded-lg bg-white/[0.04] p-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/10"
            >
              窓開け監視で現在値を見る
            </a>
            <a
              href="#/board"
              className="rounded-lg bg-white/[0.04] p-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/10"
            >
              相場ボードで全体を見る
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent('https://anyanical.com/#/tools/gap-prediction')}`}
              rel="noopener noreferrer"
              target="_blank"
              className="rounded-lg bg-white/[0.04] p-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              Xを開く
            </a>
            <a
              href="https://discord.gg/G6xWszr9CZ"
              rel="noopener noreferrer"
              target="_blank"
              className="rounded-lg bg-white/[0.04] p-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              Discordを開く
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-900/80 p-4 text-xs leading-5 text-slate-500">
        予想ゲームは学習と振り返り用です。表示価格は参考値であり、公式市場の始値や実取引価格を保証するものではありません。
      </div>
    </section>
  );
};
