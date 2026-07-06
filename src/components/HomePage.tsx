import { MARKETS, type MarketPrice } from '../config/markets';
import { EXTERNAL_LINKS } from '../config/navigation';
import type { ConnectionStatus, PriceHistoryPoint } from '../hooks/useHyperliquidMids';
import { SparkLine } from './SparkLine';

const DISCORD_INVITE_URL = 'https://discord.gg/G6xWszr9CZ';
// JST 2026-06-12 00:00:00
const SPACEX_IPO_CUTOFF_MS = new Date('2026-06-12T00:00:00+09:00').getTime();

const primaryActions = [
  {
    title: '相場ボード',
    body: '金、原油、指数、為替、暗号資産の24時間参考価格を確認します。',
    href: '#/board',
    label: 'ボードを開く',
  },
  {
    title: 'プレミアム',
    body: '週末の振り返り、ゴールド/ドル円考察、インジ、半裁量サインを確認します。',
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
    body: 'プレミアム、Discord、半裁量EAの使い分けを確認します。',
    href: '#/tools/strategy',
  },
  {
    title: 'コピトレ',
    body: 'HFMのAnya Gold Cent / Anya Gold ストラテジー情報を確認します。',
    href: '#/tools/copytrade',
  },
  {
    title: 'リンク集',
    body: 'Discord、X、note、各種案内をまとめて確認します。',
    href: EXTERNAL_LINKS[0].href,
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

const premiumHighlights = [
  {
    label: 'Weekend review',
    title: '週末の振り返り記事',
    body: '週末の材料、金曜クローズからの変化、週明けに見たいポイントを記事で整理します。',
  },
  {
    label: 'Daily view',
    title: 'ゴールド/ドル円の先出し考察',
    body: '毎日更新の目線、注目ライン、崩れる条件を先に出して、チャートを見る基準を作ります。',
  },
  {
    label: 'Signal & tools',
    title: 'インジと半裁量サイン',
    body: '相場の見方が変わるオリジナルインジと、天底を狙う半裁量サインを確認できます。',
  },
];

const freePremiumRows = [
  {
    free: '24時間価格モニター',
    premium: '週末の振り返り記事',
    note: '週末に動いた材料と、週明けに見るポイントまで整理',
  },
  {
    free: '通貨強弱・経済指標',
    premium: 'ゴールド/ドル円の先出し考察',
    note: '毎日更新の目線、注目ライン、崩れる条件を確認',
  },
  {
    free: '窓開け監視',
    premium: '相場の見方が変わるオリジナルインジ',
    note: 'チャート上で見る場所を絞り、判断の補助に使える',
  },
  {
    free: 'EAチェック・運用前確認',
    premium: '天底を捉える半裁量サイン',
    note: 'XAUUSDの反転候補をDiscord通知で確認',
  },
  {
    free: '公開Discord・リンク集',
    premium: '限定Discord権限',
    note: 'noteメンバーシップ参加後に限定チャンネルへ案内',
  },
];

const trustReasons = [
  {
    title: '週末をただ眺めて終わらせない',
    body: '週末の振り返り記事で、材料・値動き・週明けに見るポイントを整理できます。',
  },
  {
    title: 'ゴールド/ドル円の目線を先に確認',
    body: '毎日更新の先出し考察で、注目ラインと崩れる条件を見てからチャートに向き合えます。',
  },
  {
    title: 'インジで見る場所を絞れる',
    body: 'オリジナルインジで、反応しやすい価格帯や相場の見方を補助します。',
  },
  {
    title: '半裁量サインで天底候補を拾う',
    body: 'XAUUSDの天井・底になりやすい場面を通知で受け取り、裁量判断のきっかけにできます。',
  },
  {
    title: '無料ボードから自然につながる',
    body: '価格、通貨強弱、指標を確認したあと、そのままプレミアムの考察へ進めます。',
  },
];

const accessSteps = [
  {
    title: 'noteメンバーシップへ加入',
    body: 'プレミアムはnoteメンバーシップです。募集状況と内容を確認してから加入します。',
    href: '#/tools/participation',
    label: '内容を見る',
  },
  {
    title: 'Discordに参加',
    body: '公開チャンネルに入り、サーバー概要と限定チャンネルの案内を確認します。',
    href: DISCORD_INVITE_URL,
    label: 'Discordに参加',
    external: true,
  },
  {
    title: '加入確認を送る',
    body: 'note会員証のスクショ、note ID、Discord IDをDMまたはフォームで送ります。',
    href: '#/tools/participation',
    label: '申請手順を見る',
  },
  {
    title: '限定コンテンツを見る',
    body: '権限付与後、週末の振り返り、先出し考察、インジ、半裁量サインを確認します。',
    href: '#/tools/community',
    label: 'チャンネルを見る',
  },
];

const homeFaqItems = [
  {
    question: '無料でどこまで見られますか？',
    answer:
      '相場ボード、通貨強弱、経済指標、窓開け監視、EAチェックなどの主要ページは無料で確認できます。週末の振り返り、毎日の先出し考察、インジ、半裁量サインはプレミアム側で案内します。',
  },
  {
    question: 'プレミアムでは何が見られますか？',
    answer:
      'noteメンバーシップとして、週末の振り返り記事、ゴールド/ドル円の先出し考察、オリジナルインジ、天底を捉える半裁量サインを確認できます。',
  },
  {
    question: '表示価格は実際の注文価格ですか？',
    answer:
      'いいえ。表示価格は24時間取引市場などを参照した情報提供用の参考値です。実際の注文価格、スプレッド、約定条件は利用する取引所や証券会社で確認してください。',
  },
  {
    question: '初心者でも使えますか？',
    answer:
      '使えます。最初は相場ボード、経済指標、Discord案内だけ確認し、EAやコピトレは資金量とリスク条件を理解してから検討してください。',
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
              Anyanical market board
            </p>
            <h1 className="animate-fade-up stagger-1 mt-4 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              アニャニカル覗き部屋
            </h1>
            <p className="animate-fade-up stagger-2 mt-5 max-w-2xl text-base leading-8 text-slate-300">
              週末相場、通貨強弱、経済指標、EAチェック、プレミアム案内をまとめたマーケット入口です。
              相場を見る、考察を追う、運用前に確認する流れをこのページから選べます。
            </p>

            <div className="animate-fade-up stagger-3 mt-6 flex flex-wrap gap-2">
              {['週末価格', '先出し考察', '半裁量サイン'].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="animate-fade-up stagger-4 mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#/board"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-lg bg-cyan-300 px-6 text-sm font-black text-slate-950 shadow-glow transition hover:bg-cyan-200"
              >
                相場ボードを開く
              </a>
              <a
                href="#/tools/participation"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-lg bg-amber-300 px-6 text-sm font-black text-slate-950 transition hover:bg-amber-200"
              >
                プレミアムを見る
              </a>
              <a
                href={DISCORD_INVITE_URL}
                rel="noopener noreferrer"
                target="_blank"
                className="btn-press inline-flex min-h-12 items-center justify-center rounded-lg bg-white/[0.06] px-6 text-sm font-bold text-slate-100 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
              >
                Discordに参加
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

      {Date.now() < SPACEX_IPO_CUTOFF_MS && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <a
            href="#/spacex"
            className="group block overflow-hidden rounded-lg border border-amber-400/20 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-900/80 p-5 transition hover:border-amber-400/40 hover:from-amber-950/60"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="shrink-0 rounded bg-amber-400 px-2 py-0.5 text-xs font-black tracking-wide text-slate-950">
                  期間限定
                </span>
                <div>
                  <p className="font-bold text-white">SpaceX IPO カウントダウン</p>
                  <p className="mt-0.5 text-sm text-slate-400">
                    6月12日上場予定 · Hyperliquid参考マーケットのライブ価格を確認できます
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold text-amber-300 transition group-hover:text-amber-200">
                特設ページを見る →
              </span>
            </div>
          </a>
        </section>
      )}

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
              className="card-interactive animate-fade-up rounded-lg border border-white/10 bg-slate-900/80 p-5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]"
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

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-indigo-300/20 bg-slate-900/90">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Trade Tarot
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                今宵は、何を占いましょう
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                相場の迷いをカードに尋ねる、夜の占い館。トレーダー版の大アルカナ・小アルカナ全78枚が、今日のあなたに寄り添います。
              </p>
              <a
                href="#/tools/trade-tarot"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-400 px-5 text-sm font-black text-slate-950 transition hover:bg-indigo-300"
              >
                🔮 カードに尋ねる
              </a>
            </div>
            <div className="hidden items-center justify-center border-l border-white/10 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 p-5 lg:flex">
              <p className="text-7xl" aria-hidden="true">
                🔮
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-amber-300/20 bg-slate-900/90">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-white/10 bg-amber-300/10 p-5 lg:border-b-0 lg:border-r">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">
                Premium
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                先出し考察と半裁量サインをまとめたプレミアム
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                週末の振り返り記事、ゴールド/ドル円の先出し考察、オリジナルインジ、半裁量サインをまとめています。
                プレミアムはnoteメンバーシップとして参加できます。
              </p>
              <a
                href="#/tools/participation"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-300 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-200"
              >
                プレミアムを見る
              </a>
            </div>
            <div className="grid gap-0 md:grid-cols-3">
              {premiumHighlights.map((item) => (
                <article
                  key={item.title}
                  className="border-b border-white/10 p-5 md:border-b-0 md:border-r last:md:border-r-0"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200/80">
                    {item.label}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/80">
          <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
              <p className="text-sm font-semibold text-amber-200">Free vs Premium</p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                無料で確認して、必要な人だけ深掘り
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                無料エリアは相場の現在地を確認する場所。プレミアムは、週末の振り返り、先出し考察、インジ、半裁量サインで判断材料を増やす場所です。
              </p>
              <a
                href="#/tools/participation"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-300 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-200"
              >
                プレミアムを確認
              </a>
            </div>

            <div className="overflow-x-auto hidden sm:block">
              <table className="min-w-[640px] w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-4">無料で見られるもの</th>
                    <th className="px-4 py-4 text-amber-200">プレミアム</th>
                    <th className="px-4 py-4">使いどころ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {freePremiumRows.map((row) => (
                    <tr key={row.premium} className="align-top">
                      <td className="px-4 py-4 font-semibold text-slate-200">
                        {row.free}
                      </td>
                      <td className="px-4 py-4 font-bold text-white">{row.premium}</td>
                      <td className="px-4 py-4 leading-6 text-slate-400">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden divide-y divide-white/10">
              {freePremiumRows.map((row) => (
                <div key={row.premium} className="px-5 py-4">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 text-slate-400">{row.free}</span>
                    <span className="shrink-0 text-amber-200">→</span>
                    <span className="font-bold text-white">{row.premium}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{row.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-200">Why this board</p>
            <h2 className="mt-1 text-2xl font-bold text-white">選ばれる理由</h2>
          </div>
          <p className="text-sm text-slate-500">
            無料ボードで相場を確認し、プレミアムで目線・インジ・サインを深掘りできます。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {trustReasons.map((reason, index) => (
            <article
              key={reason.title}
              className="card-interactive rounded-lg border border-white/10 bg-white/[0.035] p-5"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-300 text-sm font-black text-slate-950">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-bold text-white">{reason.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{reason.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-cyan-200">Start flow</p>
              <h2 className="mt-1 text-2xl font-bold text-white">参加までの流れ</h2>
            </div>
            <p className="text-sm text-slate-500">
              note加入からDiscord権限付与、限定コンテンツ確認までの流れです。
            </p>
          </div>

          <ol className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {accessSteps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-lg border border-white/10 bg-slate-950/40 p-5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan-300 text-sm font-black text-slate-950">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
                <a
                  href={step.href}
                  rel={step.external ? 'noopener noreferrer' : undefined}
                  target={step.external ? '_blank' : undefined}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-white/[0.06] px-4 text-sm font-bold text-slate-100 ring-1 ring-white/10 transition hover:bg-cyan-300/10 hover:text-cyan-100"
                >
                  {step.label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="text-sm font-semibold text-amber-200">Q&A</p>
            <h2 className="mt-1 text-2xl font-bold text-white">よくある質問</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              価格の扱い、無料範囲、プレミアムで迷いやすい点を先にまとめています。
            </p>
          </div>
          <div className="space-y-3">
            {homeFaqItems.map((item) => (
              <details
                key={item.question}
                className="rounded-lg border border-white/10 bg-white/[0.035]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold text-white">
                  <span>{item.question}</span>
                  <span className="faq-icon grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20">
                    +
                  </span>
                </summary>
                <div className="faq-body border-t border-white/10">
                  <div className="faq-body-inner">
                    <p className="px-4 py-4 text-sm leading-6 text-slate-400">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
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
