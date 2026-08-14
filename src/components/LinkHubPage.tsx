import { MARKETS, type MarketPrice } from '../config/markets';
import { SITE_NAME } from '../config/pageMeta';

const X_PROFILE_URL = 'https://x.com/trader_anya';
const DISCORD_INVITE_URL = 'https://discord.gg/G6xWszr9CZ';
const NOTE_PROFILE_URL = 'https://note.com/anyafx';
const NOTE_MEMBERSHIP_URL = 'https://note.com/anyafx/membership';

type LinkItem = {
  title: string;
  body?: string;
  href: string;
  external?: boolean;
};

type LinkSection = {
  heading: string;
  items: LinkItem[];
};

const linkSections: LinkSection[] = [
  {
    heading: 'ツール',
    items: [
      {
        title: 'コピトレ案内',
        body: 'HFMのAnya Gold Cent / Anya Gold / Anya Wemof Goldストラテジー情報',
        href: '#/tools/copytrade',
      },
      {
        title: 'EAチェック',
        body: '稼働前の確認、口座認証、リスク設定を整理',
        href: '#/tools/ea-checklist',
      },
      {
        title: '戦略ページ',
        body: 'プレミアム、Discord、半裁量EAの使い分け',
        href: '#/tools/strategy',
      },
    ],
  },
  {
    heading: '相場ツール',
    items: [
      {
        title: '通貨強弱',
        body: '主要通貨の強弱とクロスレート',
        href: '#/tools/currency-strength',
      },
      {
        title: '経済指標',
        body: '重要指標と要人発言を東京時間で確認',
        href: '#/tools/economic-calendar',
      },
      {
        title: '窓開け監視',
        body: '日曜オープン時の窓開きをリアルタイム監視',
        href: '#/tools/gap-watch',
      },
      {
        title: 'SNS話題まとめ',
        body: 'Xで話題のトレード関連投稿を毎日ピックアップ',
        href: '#/matome',
      },
    ],
  },
  {
    heading: 'ゲーム・診断',
    items: [
      {
        title: 'タイプ診断',
        body: 'トレーダータイプ16診断',
        href: '#/tools/trader-quiz',
      },
      {
        title: 'ギャップ予想',
        body: '日曜のギャップ方向を予想',
        href: '#/tools/gap-prediction',
      },
      {
        title: '60秒ハイロー',
        body: 'BTC・GOLDの60秒後の上下を予想',
        href: '#/tools/highlow-sprint',
      },
      {
        title: 'スワイプ道場',
        body: '過去チャートの続きを即断するトレーニング',
        href: '#/tools/candle-swipe',
      },
      {
        title: '利確タワー',
        body: '陽線ブロックを積み上げる複利ゲーム',
        href: '#/tools/profit-tower',
      },
      {
        title: 'ゲームランキング',
        body: '参加中ミニゲームの順位を確認',
        href: '#/tools/game-ranking',
      },
      {
        title: 'トレードタロット',
        body: '相場の迷いをカードに尋ねる占い',
        href: '#/tools/trade-tarot',
      },
    ],
  },
  {
    heading: 'おすすめ・コミュニティ',
    items: [
      {
        title: '半裁量サイン案内',
        body: 'XAUUSDの反転候補をDiscord通知で確認',
        href: '#/tools/semi-auto-sign',
      },
      {
        title: 'プレミアム案内',
        body: '週末振り返り、先出し考察、インジ、半裁量サイン',
        href: '#/tools/participation',
      },
      {
        title: 'コミュニティ案内',
        body: 'Discordの使い方、チャンネル構成、限定コンテンツ',
        href: '#/tools/community',
      },
    ],
  },
];

const footerLinks: LinkItem[] = [
  { title: 'サイトトップ', href: '#/' },
  { title: 'note', href: NOTE_PROFILE_URL, external: true },
  { title: 'Discord', href: DISCORD_INVITE_URL, external: true },
  { title: 'X', href: X_PROFILE_URL, external: true },
];

const socialIcons = [
  { label: 'X', href: X_PROFILE_URL },
  { label: 'Discord', href: DISCORD_INVITE_URL },
  { label: 'note', href: NOTE_PROFILE_URL },
];

const tickerSymbols = ['GOLD', 'USDJPY', 'BTC', 'JP225', 'SP500'];
const marketBySymbol = new Map(MARKETS.map((market) => [market.symbol, market]));

const priceFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });

const formatPrice = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '取得待ち';
  return priceFormatter.format(value);
};

const formatChangePct = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const LinkRow = ({ item }: { item: LinkItem }) => (
  <a
    href={item.href}
    rel={item.external ? 'noopener noreferrer' : undefined}
    target={item.external ? '_blank' : undefined}
    className="card-interactive flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/80 px-4 py-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]"
  >
    <span className="min-w-0">
      <span className="block text-sm font-bold text-white">{item.title}</span>
      {item.body && (
        <span className="mt-0.5 block truncate text-xs text-slate-400">{item.body}</span>
      )}
    </span>
    <span className="shrink-0 text-cyan-200">{item.external ? '↗' : '›'}</span>
  </a>
);

type LinkHubPageProps = {
  prices: Record<string, MarketPrice>;
};

export const LinkHubPage = ({ prices }: LinkHubPageProps) => {
  const tickerRows = tickerSymbols
    .map((symbol) => {
      const market = marketBySymbol.get(symbol);
      if (!market) return null;
      const price = prices[symbol];
      return {
        symbol,
        name: market.weekendDisplayName ?? market.displayName,
        price: price?.price ?? null,
        changePct: price?.changePct ?? null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <section className="flex flex-col items-center text-center">
        <img
          src="/cBKP4W4-_400x400.jpg"
          alt={SITE_NAME}
          className="h-24 w-24 rounded-full border border-white/10 object-cover"
        />
        <h1 className="mt-4 text-xl font-black text-white">{SITE_NAME}</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          FXトレーダー。週末の相場ボード運用、Discordコミュニティ運営、コピトレ/EA案内をしています。相場ツールとゲームはここからまとめてどうぞ。
        </p>
        <div className="mt-4 flex gap-3">
          {socialIcons.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-white/[0.06] px-4 text-xs font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
            >
              {social.label}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-white/10 bg-slate-900/80 p-4">
        <a
          href="#/board"
          className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200"
        >
          ライブ概況
          <span>相場ボードへ ›</span>
        </a>
        <div className="space-y-2">
          {tickerRows.map((row) => {
            const isUp = (row.changePct ?? 0) > 0;
            const isDown = (row.changePct ?? 0) < 0;
            const accentClass = isUp
              ? 'text-emerald-300'
              : isDown
                ? 'text-rose-300'
                : 'text-slate-300';
            return (
              <a
                key={row.symbol}
                href="#/board"
                className="flex items-center justify-between rounded-md bg-white/[0.035] px-3 py-2 text-sm"
              >
                <span className="font-bold text-white">{row.name}</span>
                <span className="flex items-center gap-3 tabular-nums">
                  <span className="text-slate-200">{formatPrice(row.price)}</span>
                  <span className={`font-bold ${accentClass}`}>
                    {formatChangePct(row.changePct)}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {linkSections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
            {section.heading}
          </h2>
          <div className="space-y-2">
            {section.items.map((item) => (
              <LinkRow key={item.href} item={item} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-10 border-t border-white/10 pt-6">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              rel={link.external ? 'noopener noreferrer' : undefined}
              target={link.external ? '_blank' : undefined}
              className="transition hover:text-cyan-200"
            >
              {link.title}
            </a>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} {SITE_NAME}. note会員は
          <a
            href={NOTE_MEMBERSHIP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-cyan-300 underline decoration-dotted underline-offset-2 hover:text-cyan-200"
          >
            こちら
          </a>
          。
        </p>
      </section>
    </main>
  );
};
