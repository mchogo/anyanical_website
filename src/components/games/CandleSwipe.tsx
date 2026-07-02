import { useCallback, useEffect, useRef, useState } from 'react';

import { useDiscordAuth } from '../../hooks/useDiscordAuth';
import { useGameScores } from '../../hooks/useGameScores';

// ローソク足スワイプ道場: 過去チャートの続きを「上がる（右）/下がる（左）」で
// Tinder風に即断するトレーニングゲーム。Discordログイン済みのみ参加可。

const HYPERLIQUID_INFO_URL = 'https://api.hyperliquid.xyz/info';
const COINS = ['BTC', 'ETH'] as const;
const SHOWN_CANDLES = 12;
const ROUNDS_PER_SET = 10;
const SWIPE_THRESHOLD_PX = 80;

type Candle = { t: number; o: number; h: number; l: number; c: number };

type Question = {
  coin: string;
  shown: Candle[];
  answer: 'up' | 'down';
};

type SetState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | {
      phase: 'playing';
      questions: Question[];
      index: number;
      correct: number;
      streak: number;
      bestStreak: number;
    }
  | { phase: 'done'; total: number; correct: number; score: number; bestStreak: number };

const fetchCandles = async (
  coin: string,
  startTime: number,
  endTime: number,
): Promise<Candle[]> => {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'candleSnapshot',
      req: { coin, interval: '1h', startTime, endTime },
    }),
  });
  if (!response.ok) throw new Error('candleSnapshot failed');
  const raw = (await response.json()) as Array<{
    t?: number;
    o?: string | number;
    h?: string | number;
    l?: string | number;
    c?: string | number;
  }>;
  return raw
    .map((r) => ({
      t: Number(r.t),
      o: Number(r.o),
      h: Number(r.h),
      l: Number(r.l),
      c: Number(r.c),
    }))
    .filter((c) => [c.t, c.o, c.h, c.l, c.c].every(Number.isFinite))
    .sort((a, b) => a.t - b.t);
};

/** 過去30日からランダム窓で問題セットを作る */
const buildQuestions = async (): Promise<Question[]> => {
  const questions: Question[] = [];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  // コインごとに1回のAPIで広い期間を取り、そこから複数問を切り出す（リクエスト数節約）
  for (const coin of COINS) {
    const candles = await fetchCandles(coin, now - 30 * DAY, now - 1 * DAY);
    if (candles.length < SHOWN_CANDLES + 2) continue;
    const perCoin = ROUNDS_PER_SET / COINS.length;
    for (let i = 0; i < perCoin; i += 1) {
      const maxStart = candles.length - (SHOWN_CANDLES + 1);
      const start = Math.floor(Math.random() * maxStart);
      const shown = candles.slice(start, start + SHOWN_CANDLES);
      const next = candles[start + SHOWN_CANDLES];
      const lastClose = shown[shown.length - 1].c;
      if (next.c === lastClose) {
        i -= 1; // 同値は問題として不成立なので引き直す
        continue;
      }
      questions.push({ coin, shown, answer: next.c > lastClose ? 'up' : 'down' });
    }
  }
  // シャッフル
  for (let i = questions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions;
};

// ── ローソク足ミニチャート（SVG） ────────────────────────────────────────────

const CandleChart = ({ candles }: { candles: Candle[] }) => {
  const W = 300;
  const H = 180;
  const PAD = 8;
  const min = Math.min(...candles.map((c) => c.l));
  const max = Math.max(...candles.map((c) => c.h));
  const range = max - min || 1;
  const y = (v: number) => PAD + ((max - v) / range) * (H - PAD * 2);
  const slot = (W - PAD * 2) / candles.length;
  const bodyW = Math.max(slot * 0.55, 3);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="過去のローソク足チャート"
    >
      {candles.map((c, i) => {
        const cx = PAD + slot * i + slot / 2;
        const isUp = c.c >= c.o;
        const color = isUp ? '#34d399' : '#fb7185';
        const bodyTop = y(Math.max(c.o, c.c));
        const bodyH = Math.max(Math.abs(y(c.o) - y(c.c)), 1.5);
        return (
          <g key={c.t}>
            <line
              x1={cx}
              y1={y(c.h)}
              x2={cx}
              y2={y(c.l)}
              stroke={color}
              strokeWidth="1"
            />
            <rect
              x={cx - bodyW / 2}
              y={bodyTop}
              width={bodyW}
              height={bodyH}
              fill={color}
              rx="1"
            />
          </g>
        );
      })}
    </svg>
  );
};

export const CandleSwipe = () => {
  const auth = useDiscordAuth();
  const { myScores, leaderboard, submitScore, canSave } = useGameScores(
    'candle_swipe',
    auth.session ?? null,
  );

  const [set, setSet] = useState<SetState>({ phase: 'loading' });
  const [drag, setDrag] = useState<{ dx: number; active: boolean }>({
    dx: 0,
    active: false,
  });
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const dragStartX = useRef(0);

  const loadSet = useCallback(async () => {
    setSet({ phase: 'loading' });
    try {
      const questions = await buildQuestions();
      if (questions.length === 0) {
        setSet({ phase: 'error' });
        return;
      }
      setSet({
        phase: 'playing',
        questions,
        index: 0,
        correct: 0,
        streak: 0,
        bestStreak: 0,
      });
    } catch {
      setSet({ phase: 'error' });
    }
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated) void loadSet();
  }, [auth.isAuthenticated, loadSet]);

  const answer = (guess: 'up' | 'down') => {
    if (set.phase !== 'playing' || feedback !== null) return;
    const question = set.questions[set.index];
    const isCorrect = guess === question.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      setDrag({ dx: 0, active: false });
      setSet((prev) => {
        if (prev.phase !== 'playing') return prev;
        const correct = prev.correct + (isCorrect ? 1 : 0);
        const streak = isCorrect ? prev.streak + 1 : 0;
        const bestStreak = Math.max(prev.bestStreak, streak);
        const nextIndex = prev.index + 1;
        if (nextIndex >= prev.questions.length) {
          // スコア: 正解10点 + 最高連続正解ボーナス5点/連
          const score = correct * 10 + bestStreak * 5;
          if (canSave)
            void submitScore(score, bestStreak, { rounds: prev.questions.length });
          return {
            phase: 'done',
            total: prev.questions.length,
            correct,
            score,
            bestStreak,
          };
        }
        return { ...prev, index: nextIndex, correct, streak, bestStreak };
      });
    }, 650);
  };

  // ── スワイプ（Pointer Events） ──
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    setDrag({ dx: 0, active: true });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.active) return;
    setDrag({ dx: e.clientX - dragStartX.current, active: true });
  };
  const onPointerUp = () => {
    if (!drag.active) return;
    const { dx } = drag;
    if (dx > SWIPE_THRESHOLD_PX) answer('up');
    else if (dx < -SWIPE_THRESHOLD_PX) answer('down');
    setDrag((d) => ({
      dx: Math.abs(d.dx) > SWIPE_THRESHOLD_PX ? d.dx : 0,
      active: false,
    }));
  };

  if (!auth.isAuthenticated) {
    if (!auth.isConfigured) return null;
    return (
      <section className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-3xl">🕯️</p>
        <h2 className="mt-2 text-xl font-bold text-white">ローソク足スワイプ道場</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          過去チャートの続きを右（上がる）/ 左（下がる）スワイプで即断するトレーニング。
          参加とスコア保存にはDiscordログインが必要です。
        </p>
        <button
          type="button"
          onClick={() => auth.signIn('#/tools/candle-swipe')}
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
        <p className="text-sm font-semibold text-amber-300">Candle Pattern Swipe</p>
        <h2 className="mt-1 text-2xl font-bold text-white">ローソク足スワイプ道場</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          実際の過去チャート（BTC/ETH
          1時間足）を見て、次の足が上がるか下がるかを直感で判断。
          右スワイプ=上がる、左スワイプ=下がる。トレーニング目的であり、将来の値動きを保証するものではありません。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-5">
          {set.phase === 'loading' && (
            <p className="py-16 text-center text-sm text-slate-400">
              過去チャートを読み込み中...
            </p>
          )}
          {set.phase === 'error' && (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-400">チャートの取得に失敗しました。</p>
              <button
                type="button"
                onClick={() => void loadSet()}
                className="mt-4 rounded-full bg-white/[0.06] px-4 py-2 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                再読み込み
              </button>
            </div>
          )}

          {set.phase === 'playing' && (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <p>
                  Q{set.index + 1} / {set.questions.length}
                  <span className="ml-2 text-slate-600">
                    （{set.questions[set.index].coin} 1h）
                  </span>
                </p>
                <p>
                  正解 <span className="font-bold text-emerald-300">{set.correct}</span> /
                  連続 <span className="font-bold text-amber-300">{set.streak}</span>
                </p>
              </div>

              {/* スワイプカード */}
              <div className="relative mt-4 select-none">
                <div
                  className="cursor-grab touch-pan-y rounded-xl border border-white/10 bg-slate-950/70 p-4 transition-transform active:cursor-grabbing"
                  style={{
                    transform: `translateX(${drag.dx}px) rotate(${drag.dx / 30}deg)`,
                    transition: drag.active ? 'none' : 'transform 200ms ease',
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                >
                  <CandleChart candles={set.questions[set.index].shown} />
                  <p className="mt-2 text-center text-xs text-slate-500">
                    この続き、どっち？
                  </p>
                </div>

                {/* スワイプ方向のオーバーレイ */}
                {drag.dx > 30 && (
                  <div className="pointer-events-none absolute right-4 top-4 rounded-lg bg-emerald-400/20 px-3 py-1 text-sm font-bold text-emerald-300 ring-1 ring-emerald-300/50">
                    ⬆ 上がる
                  </div>
                )}
                {drag.dx < -30 && (
                  <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-rose-400/20 px-3 py-1 text-sm font-bold text-rose-300 ring-1 ring-rose-300/50">
                    ⬇ 下がる
                  </div>
                )}
                {feedback && (
                  <div
                    className={`pointer-events-none absolute inset-0 grid place-items-center rounded-xl text-4xl font-bold backdrop-blur-[2px] ${
                      feedback === 'correct'
                        ? 'bg-emerald-400/15 text-emerald-300'
                        : 'bg-rose-400/15 text-rose-300'
                    }`}
                  >
                    {feedback === 'correct' ? '⭕ 正解!' : '❌ 不正解'}
                  </div>
                )}
              </div>

              {/* ボタンでも回答可能（アクセシビリティ/PC向け） */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => answer('down')}
                  className="btn-press min-h-12 rounded-xl bg-rose-400/15 font-bold text-rose-300 ring-1 ring-rose-300/40 transition hover:bg-rose-400/25"
                >
                  ← 下がる
                </button>
                <button
                  type="button"
                  onClick={() => answer('up')}
                  className="btn-press min-h-12 rounded-xl bg-emerald-400/15 font-bold text-emerald-300 ring-1 ring-emerald-300/40 transition hover:bg-emerald-400/25"
                >
                  上がる →
                </button>
              </div>
            </>
          )}

          {set.phase === 'done' && (
            <div className="py-10 text-center">
              <p className="text-3xl">🏁</p>
              <h3 className="mt-2 text-xl font-bold text-white">セット終了！</h3>
              <p className="mt-3 text-sm text-slate-400">
                {set.total}問中{' '}
                <span className="font-bold text-emerald-300">{set.correct}問正解</span>
                （最高{set.bestStreak}連続）
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-300">
                {set.score.toLocaleString('ja-JP')}
                <span className="ml-1 text-sm text-slate-500">pt</span>
              </p>
              <button
                type="button"
                onClick={() => void loadSet()}
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-5 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
              >
                もう1セット挑戦
              </button>
            </div>
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
                <p className="mt-1 text-xl font-bold text-amber-300">
                  {myScores.bestScore.toLocaleString('ja-JP')}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <p className="text-[11px] text-slate-500">最高連続正解</p>
                <p className="mt-1 text-xl font-bold text-emerald-300">
                  {myScores.bestStreak}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold tracking-wider text-slate-400">
              リーダーボード TOP10
            </p>
            <div className="mt-3 space-y-1">
              {leaderboard.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-600">
                  まだ記録がありません
                </p>
              ) : (
                leaderboard.map((e) => (
                  <div
                    key={`${e.rank}-${e.userTag}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                      e.isMe
                        ? 'bg-amber-300/10 ring-1 ring-amber-300/30'
                        : 'bg-white/[0.02]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 font-bold text-slate-500">{e.rank}</span>
                      <span
                        className={e.isMe ? 'font-bold text-amber-200' : 'text-slate-400'}
                      >
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
        </div>
      </div>
    </section>
  );
};
