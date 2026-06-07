import {
  CurrencyStrengthTool,
  EaChecklistTool,
  EconomicCalendarTool,
  GapWatchTool,
} from './RelatedTools';
import {
  CommunityGuidePage,
  ParticipationGuidePage,
  StrategyGuidePage,
} from './BrandPages';
import type { MarketPrice } from '../config/markets';

export type ToolPageId =
  | 'currency-strength'
  | 'economic-calendar'
  | 'gap-watch'
  | 'ea-checklist'
  | 'strategy'
  | 'community'
  | 'participation';

type ToolPageProps = {
  pageId: ToolPageId;
  prices: Record<string, MarketPrice>;
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
    description: '週末価格と約24時間前の差',
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
    description: 'サブスク、Discord、コピトレ、半裁量EAの導線',
    href: '#/tools/strategy',
  },
  {
    id: 'community',
    title: 'コミュニティ',
    description: 'ツール、メモ、各種案内のまとめ',
    href: '#/tools/community',
  },
  {
    id: 'participation',
    title: '参加方法',
    description: 'サブスク、口座開設、ストラテジー導線',
    href: '#/tools/participation',
  },
];

const renderTool = (pageId: ToolPageId, prices: Record<string, MarketPrice>) => {
  switch (pageId) {
    case 'currency-strength':
      return <CurrencyStrengthTool />;
    case 'economic-calendar':
      return <EconomicCalendarTool />;
    case 'gap-watch':
      return <GapWatchTool prices={prices} />;
    case 'ea-checklist':
      return <EaChecklistTool />;
    case 'strategy':
      return <StrategyGuidePage />;
    case 'community':
      return <CommunityGuidePage />;
    case 'participation':
      return <ParticipationGuidePage />;
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
      body: '日々の目線やチャート解説をコミュニティ導線から確認します。',
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
      body: 'サブスク、コピトレ、半裁量EAへの導線を確認します。',
      href: '#/tools/strategy',
    },
  ],
  'gap-watch': [
    {
      title: '相場ボードへ戻る',
      body: '週末perp価格、チャート、注意事項をまとめて確認します。',
      href: '#/',
    },
    {
      title: '参加方法を見る',
      body: 'note加入、申請フォーム、運用リンクを確認します。',
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
      title: '参加方法へ',
      body: 'noteメンバーシップ、申請、各種リンクを確認します。',
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
      title: 'Discordコミュニティ',
      body: '限定チャンネル、インジ、EA関連の見方を確認します。',
      href: '#/tools/community',
    },
  ],
  community: [
    {
      title: '参加方法を見る',
      body: 'note加入、Discord権限付与、TradingView ID申請へ進みます。',
      href: '#/tools/participation',
    },
    {
      title: '戦略ページへ',
      body: 'サブスク、コピトレ、半裁量EAの導線を確認します。',
      href: '#/tools/strategy',
    },
  ],
  participation: [
    {
      title: 'Discordコミュニティ',
      body: '参加後に見るチャンネル構成と限定導線を確認します。',
      href: '#/tools/community',
    },
    {
      title: 'EAチェック',
      body: '口座認証、EA設置、稼働前チェックを確認します。',
      href: '#/tools/ea-checklist',
    },
  ],
};

export const ToolPage = ({ pageId, prices }: ToolPageProps) => {
  const page = toolPages.find((toolPage) => toolPage.id === pageId) ?? toolPages[0];
  const actions = nextActions[pageId];

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-cyan-200">Anyanical tools</p>
          <h1 className="mt-1 text-3xl font-bold text-white">{page.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{page.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        {renderTool(pageId, prices)}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-cyan-200">Next</p>
              <h2 className="mt-1 text-xl font-bold text-white">次に見る導線</h2>
            </div>
            <p className="text-sm text-slate-500">目的に近いページへ移動します。</p>
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
