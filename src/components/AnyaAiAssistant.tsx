import { useEffect, useMemo, useState } from 'react';

const DISCORD_INVITE_URL = 'https://discord.gg/G6xWszr9CZ';

type AnswerEntry = {
  title: string;
  shortLabel: string;
  answer: string;
  href: string;
  cta: string;
  keywords: string[];
};

const answerEntries: AnswerEntry[] = [
  {
    title: 'プレミアムで見られる内容',
    shortLabel: 'プレミアムの内容',
    answer:
      'プレミアムはnoteメンバーシップです。週末の振り返り記事、ゴールド/ドル円の先出し考察、オリジナルインジ、半裁量サインを確認できます。',
    href: '#/tools/participation',
    cta: 'プレミアムを見る',
    keywords: [
      'プレミアム',
      'note',
      'サブスク',
      '振り返り',
      '先出し',
      '考察',
      'インジ',
      'サイン',
    ],
  },
  {
    title: '加入後の流れ',
    shortLabel: '加入後の流れ',
    answer:
      'note加入後、Discordに参加し、note会員証のスクショ・note ID・Discord IDをDMまたはフォームで送ってください。確認後に限定チャンネル権限を付与します。',
    href: '#/tools/participation',
    cta: '申請手順を見る',
    keywords: [
      '加入',
      '参加',
      '申請',
      '会員証',
      'note id',
      'discord id',
      '権限',
      'ロール',
    ],
  },
  {
    title: '半裁量サインについて',
    shortLabel: '半裁量サイン',
    answer:
      '半裁量サインはXAUUSDの天底候補や反転候補をDiscord通知で確認するものです。通知だけで入らず、必ずチャート確認を前提にしてください。',
    href: '#/tools/semi-auto-sign',
    cta: '半裁量サインを見る',
    keywords: ['半裁量', 'サイン', '通知', 'xauusd', 'ゴールド', '天底', 'sell', 'buy'],
  },
  {
    title: 'HFMコピトレについて',
    shortLabel: 'HFMコピトレ',
    answer:
      'HFMコピトレはプレミアムとは別ページで確認できます。週利10〜20%を目安にしていますが、相場状況により変動し、利益保証ではありません。',
    href: '#/tools/copytrade',
    cta: 'コピトレを見る',
    keywords: ['hfm', 'コピトレ', 'コピー', 'anya gold', '週利', '利益', 'ストラテジー'],
  },
  {
    title: '週末相場ボードについて',
    shortLabel: '週末相場ボード',
    answer:
      '相場ボードでは、金・原油・指数・為替・暗号資産の24時間参考価格を確認できます。週末は金曜基準との差を見て、月曜の窓開け警戒に使います。',
    href: '#/board',
    cta: '相場ボードを見る',
    keywords: [
      '相場ボード',
      '週末',
      '価格',
      '金曜',
      '窓開け',
      'ゴールド',
      'btc',
      'ドル円',
    ],
  },
  {
    title: 'EAチェックについて',
    shortLabel: 'EAチェック',
    answer:
      'EAチェックでは、稼働前の口座認証、ロット、重要指標、停止条件を確認できます。半裁量EAや自動売買を動かす前の確認用です。',
    href: '#/tools/ea-checklist',
    cta: 'EAチェックを見る',
    keywords: ['ea', 'チェック', '認証', 'ロット', '停止', '指標', 'exness'],
  },
  {
    title: 'Discordコミュニティについて',
    shortLabel: 'Discord',
    answer:
      'Discordでは公開チャンネルと限定チャンネルがあります。公開案内を確認し、プレミアム加入後は申請内容の確認後に限定権限が付与されます。',
    href: '#/tools/community',
    cta: 'コミュニティを見る',
    keywords: ['discord', 'コミュニティ', '限定', 'チャンネル', 'dm', 'ロール'],
  },
  {
    title: '先出し考察について',
    shortLabel: '先出し考察',
    answer:
      '先出し考察はゴールドとドル円を中心に、環境認識や狙いたい方向、注意したい価格帯を事前に確認できるコンテンツです。毎日更新を前提に、Discordやnoteから追いやすい形で案内します。',
    href: '#/tools/participation',
    cta: 'プレミアムを見る',
    keywords: ['先出し', '考察', 'ゴールド', 'ドル円', 'xauusd', 'usdjpy', '毎日'],
  },
  {
    title: '週末の振り返り記事について',
    shortLabel: '振り返り記事',
    answer:
      '週末の振り返り記事では、その週の値動き、狙えたポイント、次週に向けて見ておきたい価格帯を整理します。日々の考察だけで終わらせず、復習しやすい形にまとめる位置づけです。',
    href: '#/tools/participation',
    cta: 'noteサブスクを見る',
    keywords: ['週末', '振り返り', '記事', 'note', '復習', '次週'],
  },
  {
    title: 'オリジナルインジについて',
    shortLabel: 'オリジナルインジ',
    answer:
      'オリジナルインジは、相場の現在地や見ておきたいラインを整理しやすくするための補助ツールです。単体で売買判断を完結させるものではなく、環境認識やシナリオ確認と組み合わせて使います。',
    href: '#/tools/participation',
    cta: 'プレミアムを見る',
    keywords: ['インジ', 'インジケーター', 'オリジナル', 'ライン', '環境認識'],
  },
  {
    title: '無料で使える範囲',
    shortLabel: '無料で使えるもの',
    answer:
      '無料では週末相場ボード、基本ツール、公開されている案内ページを確認できます。noteのプレミアム限定コンテンツやDiscord限定チャンネルは、加入確認後に案内されます。',
    href: '#/board',
    cta: '相場ボードを見る',
    keywords: ['無料', 'フリー', '使える', '公開', '有料', '限定'],
  },
  {
    title: 'どれから見ればいいか',
    shortLabel: '最初に見る場所',
    answer:
      '初めての場合は、まず週末相場ボードで雰囲気を確認し、次にプレミアムの内容と加入後の流れを見てください。コピトレ目的なら、HFMコピトレページを別で確認するのが早いです。',
    href: '#/tools/participation',
    cta: '加入案内を見る',
    keywords: ['初めて', '最初', 'どこ', '見る', '始め方', '案内'],
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

const scoreEntry = (query: string, entry: AnswerEntry) => {
  if (!query) return 0;
  const haystack = normalize(
    `${entry.title} ${entry.answer} ${entry.keywords.join(' ')}`,
  );
  const terms = normalize(query)
    .split(/[\s\u3000]+/)
    .filter(Boolean);

  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
};

const defaultChoices = answerEntries.slice(0, 10);

export const AnyaAiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AnswerEntry | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const results = useMemo(() => {
    const scored = answerEntries
      .map((entry) => ({ entry, score: scoreEntry(query, entry) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return scored.map((item) => item.entry);
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const shownEntries = hasQuery ? results : defaultChoices;

  useEffect(() => {
    if (!isThinking) return undefined;

    const timerId = window.setTimeout(() => {
      setIsThinking(false);
    }, 650);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isThinking]);

  const askEntry = (entry: AnswerEntry) => {
    setSelectedEntry(entry);
    setIsThinking(true);
  };

  const resetAnswer = () => {
    setSelectedEntry(null);
    setIsThinking(false);
  };

  return (
    <aside className="fixed bottom-4 right-4 z-40 w-[min(calc(100vw-2rem),26rem)]">
      {isOpen ? (
        <div className="overflow-hidden rounded-lg border border-amber-300/20 bg-slate-950/95 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-amber-300/10 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                Anya AI
              </p>
              <h2 className="mt-1 text-lg font-black text-white">あにゃAIに聞く</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                回答は参考情報です。最新状況や個別の判断はDiscordで確認してください。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
              aria-label="あにゃAIを閉じる"
            >
              ×
            </button>
          </div>

          <div className="p-4">
            {selectedEntry ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={resetAnswer}
                  className="text-xs font-bold text-slate-400 transition hover:text-white"
                >
                  ← 質問を選び直す
                </button>

                {isThinking ? (
                  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-300" />
                      <p className="text-sm font-bold text-white">回答を整理中...</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-11/12 animate-pulse rounded-full bg-white/10" />
                      <div className="h-3 w-9/12 animate-pulse rounded-full bg-white/10" />
                      <div className="h-3 w-7/12 animate-pulse rounded-full bg-white/10" />
                    </div>
                  </div>
                ) : (
                  <article className="rounded-lg border border-amber-300/20 bg-white/[0.035] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                      Answer
                    </p>
                    <h3 className="mt-2 font-bold text-white">{selectedEntry.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {selectedEntry.answer}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={selectedEntry.href}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-amber-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
                      >
                        {selectedEntry.cta}
                      </a>
                      <a
                        href={DISCORD_INVITE_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
                      >
                        Discordで聞く
                      </a>
                    </div>
                  </article>
                )}
              </div>
            ) : (
              <>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="項目を絞り込み"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none ring-1 ring-white/10 transition focus:border-amber-300/30 focus:ring-amber-300/20"
                />

                <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                  {shownEntries.length > 0 ? (
                    shownEntries.map((entry) => (
                      <button
                        key={entry.title}
                        type="button"
                        onClick={() => askEntry(entry)}
                        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-amber-300/30 hover:bg-amber-300/10"
                      >
                        <span>{entry.shortLabel}</span>
                        <span className="text-amber-200">→</span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                      <h3 className="font-bold text-white">見つかりませんでした</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        サイト内の想定質問にはまだありません。DiscordでDMまたは質問スペースから聞いてください。
                      </p>
                      <a
                        href={DISCORD_INVITE_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
                      >
                        Discordで聞く
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ml-auto flex min-h-12 items-center justify-center rounded-full bg-amber-300 px-5 text-sm font-black text-slate-950 shadow-[0_12px_40px_rgba(251,191,36,0.22)] transition hover:bg-amber-200"
        >
          あにゃAIに聞く
        </button>
      )}
    </aside>
  );
};
