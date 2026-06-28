import { useState } from 'react';
import {
  CurrencyStrengthTool,
  EaChecklistTool,
  EconomicCalendarTool,
  GapWatchTool,
} from './RelatedTools';
import { useFavoritesContext } from '../hooks/useFavorites';
import { DailyMissionTool, GapPredictionTool, MemberDashboard } from './MemberEngagement';
import {
  CommunityGuidePage,
  CopyTradeGuidePage,
  ParticipationGuidePage,
  SemiAutoSignPage,
  StrategyGuidePage,
} from './BrandPages';
import { PnLCalendarTool } from './PnLCalendar';
import { TraderQuiz } from './TraderQuiz';
import type { MarketPrice } from '../config/markets';
import type { PriceHistoryPoint } from '../hooks/useHyperliquidMids';

export type ToolPageId =
  | 'currency-strength'
  | 'economic-calendar'
  | 'gap-watch'
  | 'ea-checklist'
  | 'strategy'
  | 'copytrade'
  | 'community'
  | 'participation'
  | 'semi-auto-sign'
  | 'trade-journal'
  | 'trader-quiz'
  | 'member-dashboard'
  | 'daily-mission'
  | 'gap-prediction';

type ToolPageProps = {
  pageId: ToolPageId;
  prices: Record<string, MarketPrice>;
  priceHistory: Record<string, PriceHistoryPoint[]>;
  isWeekendMode: boolean;
  canAccessPremium?: boolean;
};

const toolPages: Array<{
  id: ToolPageId;
  title: string;
  description: string;
  href: string;
}> = [
  {
    id: 'currency-strength',
    title: '通貨強弱',
    description: '主要通貨の強弱とクロスレート',
    href: '#/tools/currency-strength',
  },
  {
    id: 'economic-calendar',
    title: '経済指標',
    description: '日本語・東京時間の指標カレンダー',
    href: '#/tools/economic-calendar',
  },
  {
    id: 'gap-watch',
    title: '窓開け監視',
    description: '週末価格と金曜基準の差',
    href: '#/tools/gap-watch',
  },
  {
    id: 'ea-checklist',
    title: 'EAチェック',
    description: '半裁量EA・全自動EAの稼働前確認',
    href: '#/tools/ea-checklist',
  },
  {
    id: 'strategy',
    title: '戦略',
    description: 'プレミアム、Discord、半裁量EAの活用案内',
    href: '#/tools/strategy',
  },
  {
    id: 'copytrade',
    title: 'HFMコピトレ',
    description: 'Anya Gold Cent / Anya Gold のストラテジー情報',
    href: '#/tools/copytrade',
  },
  {
    id: 'community',
    title: 'コミュニティ',
    description: 'ツール、メモ、各種案内のまとめ',
    href: '#/tools/community',
  },
  {
    id: 'participation',
    title: 'プレミアム',
    description: 'noteメンバーシップ、加入手続き、Discord権限付与',
    href: '#/tools/participation',
  },
  {
    id: 'semi-auto-sign',
    title: '半裁量サイン',
    description:
      'XAUUSD専用のDiscord通知サイン。サイン種別・通知チャンネル・利用開始手順を確認します。',
    href: '#/tools/semi-auto-sign',
  },
  {
    id: 'trade-journal',
    title: '損益カレンダー',
    description:
      'Discordログインで1口座まで使える日次損益カレンダー。複数口座管理はプレミアムで解放されます。',
    href: '#/tools/trade-journal',
  },
  {
    id: 'trader-quiz',
    title: 'トレーダータイプ16診断',
    description:
      '12問に答えて4つの軸であなたのトレードスタイルを分析。16タイプから診断結果を表示します。',
    href: '#/tools/trader-quiz',
  },
  {
    id: 'member-dashboard',
    title: 'メンバーダッシュボード',
    description:
      'Discordログイン状態、今日の相場ミッション、週末ギャップ予想、プレミアム導線をまとめて確認します。',
    href: '#/tools/member-dashboard',
  },
  {
    id: 'daily-mission',
    title: '今日の相場ミッション',
    description:
      '相場ボード、通貨強弱、経済指標、窓開け監視、振り返りを毎日の確認ルーティンとして管理します。',
    href: '#/tools/daily-mission',
  },
  {
    id: 'gap-prediction',
    title: '週末ギャップ予想',
    description:
      'GOLD、USDJPY、BTCなどの週末方向感を予想して、週明けに答え合わせするゲームです。',
    href: '#/tools/gap-prediction',
  },
];

const renderTool = (
  pageId: ToolPageId,
  prices: Record<string, MarketPrice>,
  priceHistory: Record<string, PriceHistoryPoint[]>,
  isWeekendMode: boolean,
) => {
  switch (pageId) {
    case 'currency-strength':
      return <CurrencyStrengthTool />;
    case 'economic-calendar':
      return <EconomicCalendarTool />;
    case 'gap-watch':
      return (
        <GapWatchTool
          prices={prices}
          priceHistory={priceHistory}
          isWeekendMode={isWeekendMode}
        />
      );
    case 'ea-checklist':
      return <EaChecklistTool />;
    case 'strategy':
      return <StrategyGuidePage />;
    case 'copytrade':
      return <CopyTradeGuidePage />;
    case 'community':
      return <CommunityGuidePage />;
    case 'participation':
      return <ParticipationGuidePage />;
    case 'semi-auto-sign':
      return <SemiAutoSignPage />;
    case 'trade-journal':
      return <PnLCalendarTool />;
    case 'trader-quiz':
      return <TraderQuiz />;
    case 'member-dashboard':
      return <MemberDashboard prices={prices} />;
    case 'daily-mission':
      return <DailyMissionTool />;
    case 'gap-prediction':
      return <GapPredictionTool prices={prices} />;
  }
};

const nextActions: Record<
  ToolPageId,
  Array<{
    title: string;
    body: string;
    href: string;
    external?: boolean;
  }>
> = {
  'currency-strength': [
    {
      title: '経済指標を確認',
      body: '通貨の強弱が出ている理由を、直近イベントと合わせて確認します。',
      href: '#/tools/economic-calendar',
    },
    {
      title: 'Discordで見方を追う',
      body: '日々の目線やチャート解説をコミュニティで確認します。',
      href: '#/tools/community',
    },
  ],
  'economic-calendar': [
    {
      title: 'EA稼働前チェック',
      body: '重要指標前後のスプレッド、停止条件、ロットを確認します。',
      href: '#/tools/ea-checklist',
    },
    {
      title: '戦略ページへ',
      body: 'プレミアム、Discord、半裁量EAの活用イメージを確認します。',
      href: '#/tools/strategy',
    },
  ],
  'gap-watch': [
    {
      title: '相場ボードへ戻る',
      body: '週末参考価格、チャート、注意事項をまとめて確認します。',
      href: '#/board',
    },
    {
      title: 'プレミアムを見る',
      body: 'note加入、申請フォーム、Discord権限付与の流れを確認します。',
      href: '#/tools/participation',
    },
  ],
  'ea-checklist': [
    {
      title: '半裁量EAの導入手順',
      body: '指定リンク口座、認証フォーム、MT5設置まで確認します。',
      href: '#/tools/strategy',
    },
    {
      title: 'プレミアムへ',
      body: 'noteメンバーシップ、申請、Discord権限付与の流れを確認します。',
      href: '#/tools/participation',
    },
  ],
  strategy: [
    {
      title: 'noteメンバーシップへ',
      body: '加入方法、募集状況、申請フォームを確認します。',
      href: '#/tools/participation',
    },
    {
      title: 'HFMコピトレ',
      body: 'Anya Gold Cent / Anya Gold のストラテジー情報を確認します。',
      href: '#/tools/copytrade',
    },
  ],
  copytrade: [
    {
      title: '戦略ページへ',
      body: 'プレミアム、Discord、半裁量EAの使い分けを確認します。',
      href: '#/tools/strategy',
    },
    {
      title: 'EAチェック',
      body: '稼働前のリスク確認、ロット、停止条件を確認します。',
      href: '#/tools/ea-checklist',
    },
  ],
  community: [
    {
      title: 'プレミアムを見る',
      body: 'note加入、Discord権限付与、TradingView ID申請へ進みます。',
      href: '#/tools/participation',
    },
    {
      title: '戦略ページへ',
      body: 'プレミアム、半裁量EA、コピトレの位置づけを確認します。',
      href: '#/tools/strategy',
    },
  ],
  participation: [
    {
      title: 'Discordコミュニティ',
      body: 'note加入後に見られる限定チャンネル構成を確認します。',
      href: '#/tools/community',
    },
    {
      title: 'EAチェック',
      body: '口座認証、EA設置、稼働前チェックを確認します。',
      href: '#/tools/ea-checklist',
    },
  ],
  'semi-auto-sign': [
    {
      title: 'EAチェック',
      body: '半裁量EAの稼働前チェック、停止条件、ロット設定を確認します。',
      href: '#/tools/ea-checklist',
    },
    {
      title: 'HFMコピトレ',
      body: 'HFM側のストラテジー情報を確認します。',
      href: '#/tools/copytrade',
    },
  ],
  'trade-journal': [
    {
      title: 'EAチェック',
      body: '次の取引前に稼働条件・ロット・停止条件を確認します。',
      href: '#/tools/ea-checklist',
    },
    {
      title: '戦略ページへ',
      body: 'プレミアム、半裁量EA、コピトレの活用方針を確認します。',
      href: '#/tools/strategy',
    },
  ],
  'trader-quiz': [
    {
      title: '戦略ページへ',
      body: '診断結果を参考に、プレミアムや半裁量EAの活用方針を確認します。',
      href: '#/tools/strategy',
    },
    {
      title: 'プレミアムを見る',
      body: 'あなたのスタイルに合った考察・インジ・サインを確認します。',
      href: '#/tools/participation',
    },
  ],
  'member-dashboard': [
    {
      title: '今日の相場ミッション',
      body: '毎日見るべきページをチェックリストで確認します。',
      href: '#/tools/daily-mission',
    },
    {
      title: 'プレミアムを見る',
      body: '朝の考察、注意事項、限定チャンネルの内容を確認します。',
      href: '#/tools/participation',
    },
  ],
  'daily-mission': [
    {
      title: 'メンバーダッシュボード',
      body: 'ログイン状態、ミッション進捗、予想件数をまとめて確認します。',
      href: '#/tools/member-dashboard',
    },
    {
      title: '週末ギャップ予想',
      body: 'ミッション後に週末の方向感を記録します。',
      href: '#/tools/gap-prediction',
    },
  ],
  'gap-prediction': [
    {
      title: '窓開け監視',
      body: '予想した銘柄の現在変化率を確認します。',
      href: '#/tools/gap-watch',
    },
    {
      title: 'メンバーダッシュボード',
      body: '予想件数と今日の確認状況をまとめて見ます。',
      href: '#/tools/member-dashboard',
    },
  ],
};

const FavUpsellOverlay = ({
  onClose,
  isAuthenticated,
}: {
  onClose: () => void;
  isAuthenticated: boolean;
}) => (
  <div
    className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="w-full max-w-md rounded-lg border border-amber-300/30 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-sm font-semibold text-amber-100">Premium feature</p>
      <h3 className="mt-1 text-xl font-bold text-white">お気に入りはプレミアム限定です</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        よく使うページを登録してナビバーからすぐアクセスできます。プレミアム会員向け機能です。
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="#/tools/participation"
          onClick={onClose}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
        >
          プレミアム内容を見る
        </a>
        {!isAuthenticated && (
          <a
            href="#/login"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
          >
            Discordログイン
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          閉じる
        </button>
      </div>
    </div>
  </div>
);

export const ToolPage = ({
  pageId,
  prices,
  priceHistory,
  isWeekendMode,
  canAccessPremium = false,
}: ToolPageProps) => {
  const page = toolPages.find((toolPage) => toolPage.id === pageId) ?? toolPages[0];
  const actions = nextActions[pageId];
  const pageDescription =
    pageId === 'gap-watch' && !isWeekendMode
      ? '平日は現在値と直近6時間の動きで、短期の偏りを確認します'
      : page.description;
  const { favorites, toggleFavorite, isAuthenticated } = useFavoritesContext();
  const pageRoute = `tools/${pageId}`;
  const isFavorited = favorites.includes(pageRoute);
  const [showFavUpsell, setShowFavUpsell] = useState(false);

  const handleFavClick = () => {
    if (canAccessPremium) {
      toggleFavorite(pageRoute);
    } else {
      setShowFavUpsell(true);
    }
  };

  return (
    <main className="animate-fade-in">
      {showFavUpsell && (
        <FavUpsellOverlay
          onClose={() => setShowFavUpsell(false)}
          isAuthenticated={isAuthenticated}
        />
      )}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex max-w-4xl items-start gap-3">
          <div className="flex-1">
            <p className="animate-slide-left text-sm font-semibold text-cyan-200">
              アニャニカル
            </p>
            <h1 className="animate-fade-up stagger-1 mt-1 text-3xl font-bold text-white">
              {page.title}
            </h1>
            <p className="animate-fade-up stagger-2 mt-2 text-sm leading-6 text-slate-400">
              {pageDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={handleFavClick}
            aria-label={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
            title={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
            className={`mt-7 shrink-0 grid h-10 w-10 place-items-center rounded-full text-xl ring-1 transition ${
              isFavorited
                ? 'bg-amber-300/20 text-amber-300 ring-amber-300/40 hover:bg-amber-300/10'
                : 'bg-white/[0.04] text-slate-600 ring-white/10 hover:bg-amber-300/10 hover:text-amber-300'
            }`}
          >
            {isFavorited ? '★' : '☆'}
          </button>
        </div>
      </section>

      <section className="tool-section mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        {renderTool(pageId, prices, priceHistory, isWeekendMode)}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-cyan-200">おすすめ</p>
              <h2 className="mt-1 text-xl font-bold text-white">次に確認するページ</h2>
            </div>
            <p className="text-sm text-slate-500">
              いま見ている内容に近いページを表示します。
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {actions.map((action) => (
              <a
                key={action.href}
                href={action.href}
                rel={action.external ? 'noopener noreferrer' : undefined}
                target={action.external ? '_blank' : undefined}
                className="rounded-lg border border-white/10 bg-slate-950/40 p-4 text-sm transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                <p className="font-bold text-white">{action.title}</p>
                <p className="mt-2 leading-6 text-slate-500">{action.body}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
