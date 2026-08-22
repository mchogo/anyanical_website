import { useState } from 'react';
import {
  CurrencyStrengthTool,
  EaChecklistTool,
  EconomicCalendarTool,
  GapWatchTool,
} from './RelatedTools';
import { useFavoritesContext } from '../hooks/useFavorites';
import { FavoriteSaveStatus } from './common/FavoriteSaveStatus';
import { FavoriteUpsellDialog } from './common/FavoriteUpsellDialog';
import { IframeTool } from './common/IframeTool';
import {
  DailyMissionTool,
  GapPredictionTool,
  MemberDashboard,
  PremiumLockMark,
} from './MemberEngagement';
import {
  CommunityGuidePage,
  CopyTradeGuidePage,
  ParticipationGuidePage,
  SemiAutoSignPage,
  StrategyGuidePage,
} from './BrandPages';
import { HtfContextBoard } from './HtfContextBoard';
import { PnLCalendarTool } from './PnLCalendar';
import { TraderQuiz } from './TraderQuiz';
import { HighLowSprint } from './games/HighLowSprint';
import { CandleSwipe } from './games/CandleSwipe';
import { ProfitTower } from './games/ProfitTower';
import { GameRankingPage } from './GameRankingPage';
import { TOOL_PAGES, type ToolPageId } from '../config/toolPages';
import type { MarketPrice } from '../config/markets';
import type { PriceHistoryPoint } from '../hooks/useHyperliquidMids';

export type { ToolPageId };

type ToolPageProps = {
  pageId: ToolPageId;
  prices: Record<string, MarketPrice>;
  priceHistory: Record<string, PriceHistoryPoint[]>;
  isWeekendMode: boolean;
  canAccessPremium?: boolean;
};

const toolPages = TOOL_PAGES;

const renderTool = (
  pageId: ToolPageId,
  prices: Record<string, MarketPrice>,
  priceHistory: Record<string, PriceHistoryPoint[]>,
  isWeekendMode: boolean,
  canAccessPremium: boolean,
  isAuthenticated: boolean,
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
    case 'highlow-sprint':
      return <HighLowSprint prices={prices} />;
    case 'candle-swipe':
      return <CandleSwipe />;
    case 'profit-tower':
      return <ProfitTower />;
    case 'game-ranking':
      return <GameRankingPage />;
    case 'trade-tarot':
      return <TradeTarotTool />;
    case 'anya-method-slides':
      return (
        <AnyaMethodSlidesTool
          canAccessPremium={canAccessPremium}
          isAuthenticated={isAuthenticated}
        />
      );
    case 'htf-context':
      return (
        <HtfContextBoard
          canAccessPremium={canAccessPremium}
          isAuthenticated={isAuthenticated}
        />
      );
  }
};

const TradeTarotTool = () => (
  <IframeTool
    src="/trade-tarot/"
    title="トレードタロット"
    heightClassName="h-[70dvh] sm:h-[900px]"
  />
);

const AnyaMethodSlidesTool = ({
  canAccessPremium,
  isAuthenticated,
}: {
  canAccessPremium: boolean;
  isAuthenticated: boolean;
}) => {
  if (canAccessPremium) {
    return (
      <IframeTool
        src="/anya-method-slides/"
        title="アニャニカル解説"
        heightClassName="h-[70dvh] sm:h-[640px]"
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-amber-300/20 bg-slate-950 p-6">
      <PremiumLockMark className="absolute right-5 top-5 h-9 w-9" />
      <p className="text-xs font-semibold tracking-[0.22em] text-amber-200">
        ANYANICAL METHOD — STUDY NOTES
      </p>
      <h3 className="mt-2 pr-12 text-2xl font-bold text-white">
        アニャニカル手法 要点整理スライド
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
        環境認識 → 調整待ち →
        エントリーパターン①〜③。「どこまで待てばいいのか」を音声付きスライドで振り返ります。
      </p>
      <p className="mt-5 text-sm font-semibold text-amber-100">
        続きはプレミアム限定です
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        本編スライド(音声解説付き)はDiscordプレミアム会員のみ視聴できます。
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="#/tools/participation"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
        >
          プレミアム内容を見る
        </a>
        {!isAuthenticated && (
          <a
            href="#/login"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
          >
            Discordログイン
          </a>
        )}
      </div>
    </div>
  );
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
      body: 'Anya Gold Cent / Anya Gold / Anya Wemof Gold のストラテジー情報を確認します。',
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
  'highlow-sprint': [
    {
      title: 'ローソク足スワイプ道場',
      body: '過去チャートの続きを即断するトレーニングにも挑戦します。',
      href: '#/tools/candle-swipe',
    },
    {
      title: 'ゲームランキング',
      body: '参加中のミニゲームの順位をまとめて確認します。',
      href: '#/tools/game-ranking',
    },
  ],
  'candle-swipe': [
    {
      title: '60セカンズ・ハイロー',
      body: 'リアルタイム価格で60秒後の上下を予想するゲームに挑戦します。',
      href: '#/tools/highlow-sprint',
    },
    {
      title: '利確タワー',
      body: 'ブロックを積み上げて資金を複利で増やすミニゲームにも挑戦します。',
      href: '#/tools/profit-tower',
    },
  ],
  'profit-tower': [
    {
      title: 'ローソク足スワイプ道場',
      body: '過去チャートの続きを即断するトレーニングにも挑戦します。',
      href: '#/tools/candle-swipe',
    },
    {
      title: 'ゲームランキング',
      body: '参加中のミニゲームの順位をまとめて確認します。',
      href: '#/tools/game-ranking',
    },
  ],
  'game-ranking': [
    {
      title: '利確タワー',
      body: 'ブロックを積み上げて資金を複利で増やすミニゲームに挑戦します。',
      href: '#/tools/profit-tower',
    },
    {
      title: '60セカンズ・ハイロー',
      body: 'リアルタイム価格で60秒後の上下を予想するゲームに挑戦します。',
      href: '#/tools/highlow-sprint',
    },
  ],
  'trade-tarot': [
    {
      title: 'タイプ診断',
      body: 'あなたのトレードスタイルを16タイプから診断します。',
      href: '#/tools/trader-quiz',
    },
    {
      title: '損益カレンダーへ',
      body: '今宵の戒めを胸に、日々の記録をつけてみましょう。',
      href: '#/tools/trade-journal',
    },
    {
      title: 'プレミアムのご案内',
      body: '毎日の先出し考察や注目ラインも気になる方は、こちらもどうぞ。',
      href: '#/tools/participation',
    },
  ],
  'anya-method-slides': [
    {
      title: '戦略ページへ',
      body: 'プレミアム、Discord、半裁量EAの活用方針を確認します。',
      href: '#/tools/strategy',
    },
    {
      title: 'プレミアムを見る',
      body: 'note加入、申請フォーム、Discord権限付与の流れを確認します。',
      href: '#/tools/participation',
    },
  ],
  'htf-context': [
    {
      title: '通貨強弱',
      body: '主要通貨の強弱とクロスレートも合わせて確認します。',
      href: '#/tools/currency-strength',
    },
    {
      title: 'アニャニカル解説',
      body: '環境認識からエントリーパターンまでの考え方を振り返ります。',
      href: '#/tools/anya-method-slides',
    },
  ],
};

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
  const { favorites, toggleFavorite, isAuthenticated, saveError, statusMessage, retry } =
    useFavoritesContext();
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
      <FavoriteUpsellDialog
        open={showFavUpsell}
        onClose={() => setShowFavUpsell(false)}
        isAuthenticated={isAuthenticated}
      />
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
          <div className="mt-7 flex shrink-0 flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleFavClick}
              aria-label={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
              title={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
              className={`grid h-10 w-10 place-items-center rounded-full text-xl ring-1 transition ${
                isFavorited
                  ? 'bg-amber-300/20 text-amber-300 ring-amber-300/40 hover:bg-amber-300/10'
                  : 'bg-white/[0.04] text-slate-600 ring-white/10 hover:bg-amber-300/10 hover:text-amber-300'
              }`}
            >
              {isFavorited ? '★' : '☆'}
            </button>
            <FavoriteSaveStatus
              saveError={saveError}
              statusMessage={statusMessage}
              onRetry={retry}
            />
          </div>
        </div>
      </section>

      <section className="tool-section mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        {renderTool(
          pageId,
          prices,
          priceHistory,
          isWeekendMode,
          canAccessPremium,
          isAuthenticated,
        )}
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
