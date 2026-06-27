export type CategoryPageId = 'market' | 'ea-copytrade' | 'premium';

type ToolCard = {
  title: string;
  description: string;
  href: string;
};

type CategoryData = {
  subtitle: string;
  label: string;
  description: string;
  accent: 'cyan' | 'amber';
  tools: ToolCard[];
};

const categoryPages: Record<CategoryPageId, CategoryData> = {
  market: {
    subtitle: 'Market tools',
    label: '相場ツール',
    description:
      '価格の現在地を確認する4つのツール。相場ボード、通貨強弱、経済指標、窓開け監視をまとめて確認できます。',
    accent: 'cyan',
    tools: [
      {
        title: '相場ボード',
        description: '金、原油、指数、為替、暗号資産の24時間参考価格と金曜基準の変化を確認します。',
        href: '#/board',
      },
      {
        title: '通貨強弱',
        description: '主要通貨の強弱とクロスレートを見て、相場の偏りを確認します。',
        href: '#/tools/currency-strength',
      },
      {
        title: '経済指標',
        description: '日本語・東京時間の重要指標カレンダーと要人発言予定を確認します。',
        href: '#/tools/economic-calendar',
      },
      {
        title: '窓開け監視',
        description: '週末価格と金曜クローズの差を確認します。平日は直近の偏りを確認します。',
        href: '#/tools/gap-watch',
      },
    ],
  },
  'ea-copytrade': {
    subtitle: 'EA & Copy trading',
    label: 'EA・コピトレ',
    description:
      'EAチェック、戦略、コピトレ、半裁量サインをまとめたカテゴリ。稼働前の確認から実際の運用イメージまで確認できます。',
    accent: 'cyan',
    tools: [
      {
        title: 'EAチェック',
        description: '半裁量EA・全自動EAの稼働前確認リスト。口座認証、ロット、停止条件を整理します。',
        href: '#/tools/ea-checklist',
      },
      {
        title: '戦略',
        description: 'プレミアム、Discord、半裁量EAの活用案内。使い分けのイメージを確認します。',
        href: '#/tools/strategy',
      },
      {
        title: 'コピトレ',
        description: 'Anya Gold Cent / Anya Gold のHFMストラテジー情報を確認します。',
        href: '#/tools/copytrade',
      },
      {
        title: '半裁量サイン',
        description: 'XAUUSD専用のDiscord通知サイン。サイン種別・通知チャンネル・利用開始手順を確認します。',
        href: '#/tools/semi-auto-sign',
      },
    ],
  },
  premium: {
    subtitle: 'Premium members',
    label: 'プレミアム',
    description:
      'コミュニティ、参加案内、トレード日誌をまとめたプレミアム向けカテゴリ。note加入からDiscord権限付与、ツール利用まで確認できます。',
    accent: 'amber',
    tools: [
      {
        title: '参加案内',
        description: 'noteメンバーシップ、加入手続き、Discord権限付与の流れを確認します。',
        href: '#/tools/participation',
      },
      {
        title: 'コミュニティ',
        description: 'ツール、メモ、各種案内のまとめ。Discordチャンネル構成を確認します。',
        href: '#/tools/community',
      },
      {
        title: 'トレード日誌',
        description: '口座ごとの日次損益をカレンダーで管理するプレミアム限定ツール。複数口座に対応。',
        href: '#/tools/trade-journal',
      },
    ],
  },
};

export const CategoryPage = ({ pageId }: { pageId: CategoryPageId }) => {
  const page = categoryPages[pageId];
  const isCyan = page.accent === 'cyan';
  const accentText = isCyan ? 'text-cyan-200' : 'text-amber-200';
  const cardHover = isCyan
    ? 'hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]'
    : 'hover:border-amber-300/30 hover:bg-amber-300/[0.07]';

  return (
    <main className="animate-fade-in">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className={`animate-slide-left text-sm font-semibold ${accentText}`}>
            {page.subtitle}
          </p>
          <h1 className="animate-fade-up stagger-1 mt-1 text-3xl font-bold text-white">
            {page.label}
          </h1>
          <p className="animate-fade-up stagger-2 mt-2 text-sm leading-6 text-slate-400">
            {page.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {page.tools.map((tool, index) => (
            <a
              key={tool.href}
              href={tool.href}
              className={`card-interactive animate-fade-up rounded-lg border border-white/10 bg-slate-900/80 p-6 transition ${cardHover}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <h2 className="text-xl font-bold text-white">{tool.title}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{tool.description}</p>
              <span className={`mt-4 inline-flex text-sm font-bold ${accentText}`}>開く →</span>
            </a>
          ))}
        </div>

        <div className="mt-8">
          <a
            href="#/home"
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-300"
          >
            ← ホームへ戻る
          </a>
        </div>
      </section>
    </main>
  );
};
