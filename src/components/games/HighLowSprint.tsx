import { useEffect, useRef, useState } from 'react';

import type { MarketPrice } from '../../config/markets';
import { useDiscordAuth } from '../../hooks/useDiscordAuth';
import { useGameScores, type LeaderboardEntry } from '../../hooks/useGameScores';

// 60セカンズ・ハイロー: リアルタイム価格が60秒後に上がるか下がるかを予想する。
// Discordログイン済みユーザーのみ参加・スコア保存可（要件）。

const ROUND_SECONDS = 60;
const GAME_SYMBOLS = ['BTC', 'GOLD'] as const;
type GameSymbol = (typeof GAME_SYMBOLS)[number];

type Bet = 'up' | 'down';

type RoundState =
  | { phase: 'idle' }
  | { phase: 'running'; symbol: GameSymbol; bet: Bet; entryPrice: number; endsAt: number }
  | {
      phase: 'result';
      symbol: GameSymbol;
      bet: Bet;
      entryPrice: number;
      exitPrice: number;
      outcome: 'win' | 'lose' | 'draw';
      gained: number;
    };

const formatPrice = (v: number | null | undefined): string =>
  v === null || v === undefined
    ? '―'
    : v.toLocaleString('en-US', { maximumFractionDigits: v >= 1000 ? 1 : 4 });

const LeaderboardTable = ({ entries }: { entries: LeaderboardEntry[] }) => {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-slate-600">まだ記録がありません</p>
    );
  }
  return (
    <div className="space-y-1">
      {entries.map((e) => (
        <div
          key={`${e.rank}-${e.userTag}`}
          className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
            e.isMe ? 'bg-cyan-300/10 ring-1 ring-cyan-300/30' : 'bg-white/[0.02]'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="w-5 font-bold text-slate-500">{e.rank}</span>
            <span className={e.isMe ? 'font-bold text-cyan-200' : 'text-slate-400'}>
              {e.isMe ? 'あなた' : e.userTag}
            </span>
          </span>
          <span className="flex items-center gap-3">
            <span className="text-slate-500">連勝 {e.bestStreak}</span>
            <span className="font-bold text-white">
              {e.bestScore.toLocaleString('ja-JP')}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
};

export const HighLowSprint = ({ prices }: { prices: Record<string, MarketPrice> }) => {
  const auth = useDiscordAuth();
  const { myScores, leaderboard, submitScore, canSave } = useGameScores(
    'highlow',
    auth.session ?? null,
  );

  const [symbol, setSymbol] = useState<GameSymbol>('BTC');
  const [round, setRound] = useState<RoundState>({ phase: 'idle' });
  const [sessionScore, setSessionScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [remaining, setRemaining] = useState(ROUND_SECONDS);

  // 判定時に最新価格を参照するため ref に写しておく
  const pricesRef = useRef(prices);
  pricesRef.current = prices;

  useEffect(() => {
    if (round.phase !== 'running') return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((round.endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left > 0) return;

      clearInterval(timer);
      const exitPrice = pricesRef.current[round.symbol]?.price ?? round.entryPrice;
      const wentUp = exitPrice > round.entryPrice;
      const wentDown = exitPrice < round.entryPrice;
      const outcome: 'win' | 'lose' | 'draw' =
        exitPrice === round.entryPrice
          ? 'draw'
          : (round.bet === 'up' ? wentUp : wentDown)
            ? 'win'
            : 'lose';

      setRound((prev) => {
        if (prev.phase !== 'running') return prev;
        let gained = 0;
        if (outcome === 'win') {
          setStreak((s) => {
            const next = s + 1;
            setBestStreak((b) => Math.max(b, next));
            return next;
          });
          // 連勝ボーナス: 100 × (1 + 現在の連勝 × 0.1)
          gained = Math.round(100 * (1 + streak * 0.1));
          setSessionScore((sc) => sc + gained);
        } else if (outcome === 'lose') {
          setStreak(0);
        }
        return {
          phase: 'result',
          symbol: prev.symbol,
          bet: prev.bet,
          entryPrice: prev.entryPrice,
          exitPrice,
          outcome,
          gained,
        };
      });
    }, 250);
    return () => clearInterval(timer);
  }, [round, streak]);

  // ラウンド確定のたびにサーバへ累計スコアを記録（MAXがベストとして扱われる）
  useEffect(() => {
    if (round.phase === 'result' && canSave && sessionScore > 0) {
      void submitScore(sessionScore, bestStreak, { symbol: round.symbol });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.phase]);

  if (!auth.isAuthenticated) {
    if (!auth.isConfigured) return null;
    return (
      <section className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-3xl">🎰</p>
        <h2 className="mt-2 text-xl font-bold text-white">60セカンズ・ハイロー</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          リアルタイム価格が60秒後に上がるか下がるかを予想するミニゲームです。
          参加とスコア保存にはDiscordログインが必要です。
        </p>
        <button
          type="button"
          onClick={() => auth.signIn('#/tools/highlow-sprint')}
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-5 text-sm font-bold text-white transition hover:bg-indigo-300"
        >
          Discordログインして参加
        </button>
      </section>
    );
  }

  const price = prices[symbol];
  const startRound = (bet: Bet) => {
    if (round.phase === 'running' || price?.price == null) return;
    setRemaining(ROUND_SECONDS);
    setRound({
      phase: 'running',
      symbol,
      bet,
      entryPrice: price.price,
      endsAt: Date.now() + ROUND_SECONDS * 1000,
    });
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <p className="text-sm font-semibold text-cyan-200">Live High/Low Challenge</p>
        <h2 className="mt-1 text-2xl font-bold text-white">60セカンズ・ハイロー</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          いまの価格から60秒後、上がっているか下がっているか。連勝でスコア倍率が上がります。
          Hyperliquidの参考価格を使った娯楽目的のゲームで、実際の取引・投資助言ではありません。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
          {/* 銘柄選択 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex rounded-full bg-white/[0.04] p-0.5 ring-1 ring-white/10">
              {GAME_SYMBOLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={round.phase === 'running'}
                  onClick={() => setSymbol(s)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
                    symbol === s
                      ? 'bg-cyan-300 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              連勝 <span className="font-bold text-amber-300">{streak}</span> / セッション{' '}
              <span className="font-bold text-white">
                {sessionScore.toLocaleString('ja-JP')}
              </span>
            </p>
          </div>

          {/* 現在価格 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">{symbol} 現在価格</p>
            <p className="mt-1 font-mono text-4xl font-bold text-white">
              {formatPrice(price?.price)}
            </p>
            {round.phase === 'running' && (
              <>
                <p className="mt-2 text-xs text-slate-400">
                  エントリー {formatPrice(round.entryPrice)} からの勝負（
                  {round.bet === 'up' ? '⬆ HIGH' : '⬇ LOW'}）
                </p>
                <div className="mx-auto mt-4 h-2 max-w-sm overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 transition-[width] duration-300 ease-linear"
                    style={{ width: `${(remaining / ROUND_SECONDS) * 100}%` }}
                  />
                </div>
                <p className="mt-2 font-mono text-2xl font-bold text-cyan-200">
                  {remaining}s
                </p>
              </>
            )}
            {round.phase === 'result' && (
              <div
                className={`mx-auto mt-4 max-w-sm rounded-xl p-4 ring-1 ${
                  round.outcome === 'win'
                    ? 'bg-emerald-400/10 ring-emerald-300/40'
                    : round.outcome === 'lose'
                      ? 'bg-rose-400/10 ring-rose-300/40'
                      : 'bg-white/[0.04] ring-white/10'
                }`}
              >
                <p className="text-lg font-bold text-white">
                  {round.outcome === 'win'
                    ? '🎉 WIN!'
                    : round.outcome === 'lose'
                      ? '💥 LOSE'
                      : '➖ DRAW'}
                  {round.outcome === 'win' && (
                    <span className="ml-2 text-emerald-300">+{round.gained}</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatPrice(round.entryPrice)} → {formatPrice(round.exitPrice)}（
                  {round.bet === 'up' ? 'HIGH' : 'LOW'} 予想）
                </p>
              </div>
            )}
          </div>

          {/* BETボタン */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={round.phase === 'running' || price?.price == null}
              onClick={() => startRound('up')}
              className="btn-press min-h-14 rounded-xl bg-emerald-400/15 text-lg font-bold text-emerald-300 ring-1 ring-emerald-300/40 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ⬆ HIGH
            </button>
            <button
              type="button"
              disabled={round.phase === 'running' || price?.price == null}
              onClick={() => startRound('down')}
              className="btn-press min-h-14 rounded-xl bg-rose-400/15 text-lg font-bold text-rose-300 ring-1 ring-rose-300/40 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ⬇ LOW
            </button>
          </div>
          {price?.price == null && (
            <p className="mt-3 text-center text-xs text-slate-500">
              価格の受信を待っています...
            </p>
          )}
        </div>

        {/* スコアボード */}
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold tracking-wider text-slate-400">
              あなたの記録
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-white/[0.03] p-3">
                <p className="text-[11px] text-slate-500">ベストスコア</p>
                <p className="mt-1 text-xl font-bold text-cyan-200">
                  {Math.max(myScores.bestScore, sessionScore).toLocaleString('ja-JP')}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <p className="text-[11px] text-slate-500">最高連勝</p>
                <p className="mt-1 text-xl font-bold text-amber-300">
                  {Math.max(myScores.bestStreak, bestStreak)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold tracking-wider text-slate-400">
              リーダーボード TOP10
            </p>
            <div className="mt-3">
              <LeaderboardTable entries={leaderboard} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
