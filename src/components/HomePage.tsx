import { MARKETS, type MarketPrice } from '../config/markets';
import type { ConnectionStatus, PriceHistoryPoint } from '../hooks/useHyperliquidMids';
import { SparkLine } from './SparkLine';

const DISCORD_INVITE_URL = 'https://discord.gg/G6xWszr9CZ';

const primaryActions = [
  {
    title: '相場ボード',
    body: '金、原油、指数、為替、暗号資産の24時間参考価格を確認します。',
    href: '#/board',
    label: 'ボードを開く',
  },
  {
    title: 'プレミアム',
    body: '日々の相場考察、限定チャンネル、インジ、EA関連の案内を確認します。',
    href: '#/tools/participation',
    label: '内容を見る',
  },
  {
    title: 'コミュニティ',
    body: 'Discordの使い方、チャンネル構成、限定コンテンツの流れを確認します。',
    href: '#/tools/community',
    label: '案内を見る',
  },
  {
    title: 'Discord',
    body: '公開チャンネル、限定チャンネル、日々の相場メモを見たい人はこちら。',
    href: DISCORD_INVITE_URL,
    label: 'Discordに参加',
    external: true,
  },
];

const toolRoutes = [
  {
    title: '通貨強弱',
    body: '主要通貨の強弱とクロスレートを見て、相場の偏りを確認します。',
    href: '#/tools/currency-strength',
  },
  {
    title: '経済指標',
    body: '重要指標と要人発言を東京時間で確認します。',
    href: '#/tools/economic-calendar',
  },
  {
    title: '窓開け監視',
    body: '平日は監視対象を整理し、閉場後は週末価格の反応を確認します。',
    href: '#/tools/gap-watch',
  },
  {
    title: 'EAチェック',
    body: '稼働前の確認、口座認証、リスク設定を整理します。',
    href: '#/tools/ea-checklist',
  },
  {
    title: '戦略',
    body: 'サブスク、コピトレ、半裁量EAの使い分けを確認します。',
    href: '#/tools/strategy',
  },
  {
    title: 'リンク集',
    body: 'Discord、X、note、各種案内をまとめて確認します。',
    href: 'https://lit.link/anyafx',
    external: true,
  },
  {
    title: 'Discord',
    body: 'アニャニカル覗き部屋のDiscordサーバーへ直接移動します。',
    href: DISCORD_INVITE_URL,
    external: true,
  },
];

const valuePoints = [
  {
    title: '週末の変化を見る',
    body: '公式市場が止まっている間の参考価格を、金曜基準と合わせて確認できます。',
  },
  {
    title: '日々の考察へつなげる',
    body: '価格だけで終わらせず、Discordやnoteの相場メモへ移動できます。',
  },
  {
    title: '運用前に確認する',
    body: '指標、EA、口座、アラートなど、実運用前のチェックを分けて確認できます。',
  },
];

type HomePageProps = {
  prices: Record<string, MarketPrice>;
  priceHistory: Record<string, PriceHistoryPoint[]>;
  connectionStatus: ConnectionStatus;
  lastUpdatedAt: number | null;
  isWeekendMode: boolean;
};

const overviewSymbols = ['GOLD', 'USDJPY', 'BTC', 'JP225', 'SP500'];
const marketBySymbol = new Map(MARKETS.map((market) => [market.symbol, market]));

const priceFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 4,
});

const formatPrice = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '取得待ち';
  }

  return priceFormatter.format(value);
};

const formatChangePct = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const formatUpdatedAt = (timestamp: number | null) => {
  if (timestamp === null) {
    return '未取得';
  }

  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(timestamp);
};

const connectionLabels: Record<ConnectionStatus, string> = {
  connecting: '接続中',
  connected: '更新中',
  disconnected: '再接続中',
  error: '確認中',
};

export const HomePage = ({
  prices,
  priceHistory,
  connectionStatus,
  lastUpdatedAt,
  isWeekendMode,
}: HomePageProps) => {
  const overviewRows = overviewSymbols
    .map((symbol) => {
      const market = marketBySymbol.get(symbol);
      const price = prices[symbol];

      if (market === undefined) {
        return null;
      }

      return {
        symbol,
        label: market.label,
        name: market.weekendDisplayName ?? market.displayName,
        weekdayName: market.displayName,
        price,
        history: priceHistory[symbol] ?? [],
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
  const availableCount = overviewRows.filter((row) => row.price?.price !== null).length;
  const moverRows = overviewRows.filter(
    (row) => Math.abs(row.price?.changePct ?? 0) >= 0.1,
  );

  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="home-grid-bg pointer-events-none absolute inset-0 opacity-70" />
        <div className="home-scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-200/70" />
        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <p className="animate-slide-left text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Anyanical peek room
            </p>
            <h1 className="animate-fade-up stagger-1 mt-4 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              アニャニカル覗き部屋
            </h1>
            <p className="animate-fade-up stagger-2 mt-5 max-w-2xl text-base leading-8 text-slate-300">
              週末相場、通貨強弱、経済指標、EAチェック、プレミアム案内をまとめた入口です。
              相場を見る、学ぶ、準備する流れをこのページから選べます。
            </p>

            <div className="animate-fade-up stagger-3 mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#/board"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-lg bg-cyan-300 px-6 text-sm font-black text-slate-950 shadow-glow transition hover:bg-cyan-200"
              >
                相場ボードを開く
              </a>
              <a
                href="#/tools/participation"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-black text-slate-950 transition hover:bg-slate-200"
              >
                プレミアムを見る
              </a>
            </div>
          </div>

          <div className="flex items-center">
            <div className="home-terminal w-full rounded-lg border border-white/10 bg-slate-950/75 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.42)] backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    ライブ概況
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {isWeekendMode
                      ? '主要銘柄の現在値と金曜基準'
                      : '主要銘柄の現在値と短期推移'}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/30">
                  {connectionLabels[connectionStatus]}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-xs text-slate-500">取得銘柄</p>
                  <p className="mt-1 text-lg font-black text-white">
                    {availableCount}/{overviewRows.length}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-xs text-slate-500">動きあり</p>
                  <p className="mt-1 text-lg font-black text-cyan-200">
                    {moverRows.length}銘柄
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-xs text-slate-500">最終更新</p>
                  <p className="mt-1 text-lg font-black text-white tabular-nums">
                    {formatUpdatedAt(lastUpdatedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {overviewRows.map((row, index) => {
                  const currentPrice = row.price?.price ?? null;
                  const changePct = row.price?.changePct ?? null;
                  const isUp = (changePct ?? 0) > 0;
                  const isDown = (changePct ?? 0) < 0;
                  const accentClass = isUp
                    ? 'text-emerald-300'
                    : isDown
                      ? 'text-rose-300'
                      : 'text-slate-300';

                  return (
                    <a
                      key={row.symbol}
                      href="#/board"
                      className="home-market-row block rounded-lg border border-white/10 bg-white/[0.035] p-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                      <div className="grid gap-3 sm:grid-cols-[1fr_112px] sm:items-center">
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-white">
                                {isWeekendMode ? row.name : row.weekdayName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">{row.label}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-white tabular-nums">
                                {formatPrice(currentPrice)}
                              </p>
                              <p
                                className={`mt-1 text-xs font-bold tabular-nums ${accentClass}`}
                              >
                                {isWeekendMode
                                  ? `金曜比 ${formatChangePct(changePct)}`
                                  : row.history.length > 1
                                    ? '過去6時間推移'
                                    : 'ライブ価格確認'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="min-h-9 rounded-md bg-slate-950/50 px-2 py-1">
                          {row.history.length > 1 ? (
                            <SparkLine data={row.history} />
                          ) : (
                            <p className="flex h-9 items-center justify-center text-xs text-slate-600">
                              履歴取得中
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row">
                <a
                  href="#/board"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                >
                  詳細ボードを見る
                </a>
                <a
                  href="#/tools/gap-watch"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-white/[0.06] px-4 text-sm font-bold text-slate-100 ring-1 ring-white/10 transition hover:bg-cyan-300/10 hover:text-cyan-100"
                >
                  窓開け監視へ
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="animate-slide-left text-sm font-semibold text-cyan-200">
              Start here
            </p>
            <h2 className="animate-fade-up stagger-1 mt-1 text-2xl font-bold text-white">
              まず見るページ
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            目的に合わせて、最初に開くページを選べます。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {primaryActions.map((action, index) => (
            <a
              key={action.href}
              href={action.href}
              rel={action.external ? 'noopener noreferrer' : undefined}
              target={action.external ? '_blank' : undefined}
              className="home-card card-interactive animate-fade-up rounded-lg border border-white/10 bg-slate-900/80 p-5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <h3 className="text-xl font-bold text-white">{action.title}</h3>
              <p className="mt-3 min-h-16 text-sm leading-6 text-slate-400">
                {action.body}
              </p>
              <span className="mt-4 inline-flex text-sm font-bold text-cyan-200">
                {action.label}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        {valuePoints.map((point, index) => (
          <article
            key={point.title}
            className="card-interactive animate-fade-up rounded-lg border border-white/10 bg-white/[0.035] p-5"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <h3 className="text-lg font-bold text-white">{point.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{point.body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-cyan-200">Tools</p>
              <h2 className="mt-1 text-2xl font-bold text-white">全体メニュー</h2>
            </div>
            <p className="text-sm text-slate-500">よく使う確認ページをまとめています。</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {toolRoutes.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                rel={tool.external ? 'noopener noreferrer' : undefined}
                target={tool.external ? '_blank' : undefined}
                className="card-interactive rounded-lg border border-white/10 bg-slate-950/40 p-4 hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
              >
                <p className="font-bold text-white">{tool.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{tool.body}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
