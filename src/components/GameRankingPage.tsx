import { useDiscordAuth } from '../hooks/useDiscordAuth';
import { useGameScores, type GameId } from '../hooks/useGameScores';

// ゲーム総合ランキング: 各ミニゲームのリーダーボードを1ページにまとめ、
// そこから各ゲームへ遊びに行ける導線を提供する。

const GAMES: Array<{
  id: GameId;
  icon: string;
  title: string;
  description: string;
  href: string;
}> = [
  {
    id: 'profit_tower',
    icon: '🏗️',
    title: '利確タワー',
    description: 'ブロックを積み上げて資金を複利で増やすミニゲーム',
    href: '#/tools/profit-tower',
  },
  {
    id: 'highlow',
    icon: '🎰',
    title: '60セカンズ・ハイロー',
    description: '60秒後の価格の上下を予想するミニゲーム',
    href: '#/tools/highlow-sprint',
  },
  {
    id: 'candle_swipe',
    icon: '🕯️',
    title: 'ローソク足スワイプ道場',
    description: '過去チャートの続きを即断するトレーニングゲーム',
    href: '#/tools/candle-swipe',
  },
];

const GameRankingSection = ({
  game,
  session,
}: {
  game: (typeof GAMES)[number];
  session: Parameters<typeof useGameScores>[1];
}) => {
  const { leaderboard } = useGameScores(game.id, session);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-2xl">{game.icon}</p>
          <h3 className="mt-1 text-lg font-bold text-white">{game.title}</h3>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
            {game.description}
          </p>
        </div>
        <a
          href={game.href}
          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full bg-amber-200 px-4 text-xs font-bold text-slate-950 transition hover:bg-amber-100"
        >
          このゲームで遊ぶ →
        </a>
      </div>

      <div className="mt-4 space-y-1">
        {leaderboard.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-600">
            まだ記録がありません。最初のランカーを目指しましょう。
          </p>
        ) : (
          leaderboard.map((e) => (
            <div
              key={`${e.rank}-${e.userTag}`}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                e.isMe ? 'bg-amber-300/10 ring-1 ring-amber-300/30' : 'bg-white/[0.02]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-5 font-bold text-slate-500">{e.rank}</span>
                <span className={e.isMe ? 'font-bold text-amber-200' : 'text-slate-400'}>
                  {e.isMe ? 'あなた' : e.userTag}
                </span>
              </span>
              <span className="font-bold text-white">
                {e.bestScore.toLocaleString('ja-JP')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const GameRankingPage = () => {
  const auth = useDiscordAuth();

  if (!auth.isAuthenticated) {
    if (!auth.isConfigured) return null;
    return (
      <section className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-3xl">🏆</p>
        <h2 className="mt-2 text-xl font-bold text-white">ゲームランキング</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          参加中のミニゲームのランキングをまとめて確認できます。閲覧にはDiscordログインが必要です。
        </p>
        <button
          type="button"
          onClick={() => auth.signIn('#/tools/game-ranking')}
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-5 text-sm font-bold text-white transition hover:bg-indigo-300"
        >
          Discordログインして参加
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <p className="text-sm font-semibold text-amber-300">🏆 ゲームランキング</p>
        <h2 className="mt-1 text-2xl font-bold text-white">総合ランキング</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          参加中のミニゲームのランキングをゲームごとにまとめています。あなたの順位は何位でしょうか。娯楽・学習目的のコンテンツであり、投資助言ではありません。
        </p>
      </div>

      {GAMES.map((game) => (
        <GameRankingSection key={game.id} game={game} session={auth.session ?? null} />
      ))}
    </section>
  );
};
