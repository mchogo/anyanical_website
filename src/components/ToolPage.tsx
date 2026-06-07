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
import { EXTERNAL_LINKS } from '../config/navigation';
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
    description: '週末相場から月曜の取引計画へ',
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

export const ToolPage = ({ pageId, prices }: ToolPageProps) => {
  const page = toolPages.find((toolPage) => toolPage.id === pageId) ?? toolPages[0];

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <a
              href="#/"
              className="text-sm font-semibold text-cyan-200 hover:text-cyan-100"
            >
              相場ボードへ戻る
            </a>
            <p className="mt-5 text-sm font-semibold text-cyan-200">Trading tools</p>
            <h1 className="mt-1 text-3xl font-bold text-white">{page.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">{page.description}</p>
          </div>
        </div>

        <nav className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {toolPages.map((toolPage) => {
            const isActive = toolPage.id === pageId;

            return (
              <a
                key={toolPage.id}
                href={toolPage.href}
                className={`rounded-lg border p-4 text-sm transition ${
                  isActive
                    ? 'border-cyan-300/40 bg-cyan-300/10'
                    : 'border-white/10 bg-white/[0.035] hover:border-cyan-300/30 hover:bg-cyan-300/10'
                }`}
              >
                <p className="font-bold text-white">{toolPage.title}</p>
                <p className="mt-2 leading-6 text-slate-500">{toolPage.description}</p>
              </a>
            );
          })}
        </nav>

        <div className="mb-8 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-emerald-200">その他リンク</p>
              <p className="mt-1 text-sm text-slate-400">
                {EXTERNAL_LINKS[0].description}
              </p>
            </div>
            <a
              href={EXTERNAL_LINKS[0].href}
              rel="noopener noreferrer"
              target="_blank"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-200"
            >
              lit.link/anyafx
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        {renderTool(pageId, prices)}
      </section>
    </main>
  );
};
