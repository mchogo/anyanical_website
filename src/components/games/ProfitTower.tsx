import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { useDiscordAuth } from '../../hooks/useDiscordAuth';
import { useGameScores } from '../../hooks/useGameScores';

// 利確タワー: 陽線ブロックをタップで積み上げ、前段との重なり幅が
// 次段の土台になるStack系ミニゲーム。重なりがゼロになると崩壊し、
// 未確定の含み益は消滅する。5段ごとのチェックポイントで利確可能。

const STAGE_WIDTH_PX = 280;
const ROW_HEIGHT_PX = 28;
// オーバーレイ(開始/チェックポイント/結果)の文言が入り切る高さを確保するため8段分を確保
const VISIBLE_FLOORS = 8;
const INITIAL_CAPITAL = 10000;
const MAX_RATE = 0.15;
const MIN_OVERLAP_RATIO = 0.06;
const CHECKPOINT_INTERVAL = 5;

type Phase = 'idle' | 'playing' | 'checkpoint' | 'gameover' | 'cashedOut';
type Rank = 'perfect' | 'good' | 'barely';
type PlacedBlock = { floor: number; left: number; width: number };

const RANK_LABEL: Record<Rank, string> = {
  perfect: 'PERFECT!',
  good: 'GOOD',
  barely: 'ギリギリ',
};

const yen = (value: number) => Math.round(value).toLocaleString('ja-JP');

export const ProfitTower = () => {
  const auth = useDiscordAuth();
  const { myScores, leaderboard, submitScore, canSave } = useGameScores(
    'profit_tower',
    auth.session ?? null,
  );

  const [phase, setPhase] = useState<Phase>('idle');
  const [floor, setFloor] = useState(0);
  const [capital, setCapital] = useState(INITIAL_CAPITAL);
  const [lockedCapital, setLockedCapital] = useState(0);
  const [baseLeft, setBaseLeft] = useState(0);
  const [baseWidth, setBaseWidth] = useState(STAGE_WIDTH_PX);
  const [blocks, setBlocks] = useState<PlacedBlock[]>([]);
  const [lastRank, setLastRank] = useState<Rank | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const movingBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((phase === 'gameover' || phase === 'cashedOut') && canSave && lockedCapital > 0) {
      void submitScore(Math.round(lockedCapital), floor, { rank: lastRank });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startGame = () => {
    setPhase('playing');
    setFloor(0);
    setCapital(INITIAL_CAPITAL);
    setLockedCapital(0);
    setBaseLeft(0);
    setBaseWidth(STAGE_WIDTH_PX);
    setBlocks([{ floor: 0, left: 0, width: STAGE_WIDTH_PX }]);
    setLastRank(null);
  };

  const handleDrop = () => {
    if (phase !== 'playing') return;
    const stageEl = stageRef.current;
    const blockEl = movingBlockRef.current;
    if (!stageEl || !blockEl) return;

    const stageRect = stageEl.getBoundingClientRect();
    const blockRect = blockEl.getBoundingClientRect();
    const blockLeft = blockRect.left - stageRect.left;
    const blockWidth = blockRect.width;

    const overlapLeft = Math.max(baseLeft, blockLeft);
    const overlapRight = Math.min(baseLeft + baseWidth, blockLeft + blockWidth);
    const overlapWidth = overlapRight - overlapLeft;
    const overlapRatio = baseWidth > 0 ? overlapWidth / baseWidth : 0;

    if (overlapWidth <= 0 || overlapRatio < MIN_OVERLAP_RATIO) {
      setPhase('gameover');
      return;
    }

    const rank: Rank =
      overlapRatio > 0.92 ? 'perfect' : overlapRatio > 0.6 ? 'good' : 'barely';
    const rate = MAX_RATE * overlapRatio;
    const nextFloor = floor + 1;

    setBlocks((prev) => [
      ...prev,
      { floor: nextFloor, left: overlapLeft, width: overlapWidth },
    ]);
    setBaseLeft(overlapLeft);
    setBaseWidth(overlapWidth);
    setCapital((prev) => prev * (1 + rate));
    setFloor(nextFloor);
    setLastRank(rank);
    setPhase(nextFloor % CHECKPOINT_INTERVAL === 0 ? 'checkpoint' : 'playing');
  };

  const cashOut = () => {
    setLockedCapital(capital);
    setPhase('cashedOut');
  };

  const continueClimbing = () => setPhase('playing');

  const durationMs = Math.max(900, 2600 - floor * 70);
  const cameraShift = Math.max(0, floor + 1 - VISIBLE_FLOORS) * ROW_HEIGHT_PX;

  if (!auth.isAuthenticated) {
    if (!auth.isConfigured) return null;
    return (
      <section className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-3xl">🏗️</p>
        <h2 className="mt-2 text-xl font-bold text-white">利確タワー</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          ブロックを積み上げて資金を複利で増やすミニゲーム。参加とスコア保存にはDiscordログインが必要です。
        </p>
        <button
          type="button"
          onClick={() => auth.signIn('#/tools/profit-tower')}
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
        <p className="text-sm font-semibold text-amber-300">Profit Stack Tower</p>
        <h2 className="mt-1 text-2xl font-bold text-white">利確タワー</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          タイミングよくブロックをタップして積み上げ、資金を複利で増やすミニゲーム。ズレるほど次の土台が狭くなり、重なりがなくなるとタワーは崩壊（未確定の利益は消滅）します。5段ごとのチェックポイントで利確すれば、そこまでの資金が確定します。トレーニング目的の仮想資金です。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <p>
              {floor}段目
              {lastRank && (
                <span className="ml-2 font-bold text-amber-300">
                  {RANK_LABEL[lastRank]}
                </span>
              )}
            </p>
            <p>
              資金 <span className="font-bold text-amber-300">{yen(capital)}円</span>
            </p>
          </div>

          <div className="relative mx-auto mt-4" style={{ width: STAGE_WIDTH_PX }}>
            <div
              ref={stageRef}
              onClick={handleDrop}
              className="relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-slate-950/70"
              style={{ height: VISIBLE_FLOORS * ROW_HEIGHT_PX, width: STAGE_WIDTH_PX }}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: `translateY(${cameraShift}px)`,
                  transition: 'transform 220ms ease',
                }}
              >
                {blocks.map((block) => (
                  <div
                    key={block.floor}
                    className="absolute rounded-md bg-amber-300/80"
                    style={{
                      left: block.left,
                      bottom: block.floor * ROW_HEIGHT_PX,
                      width: block.width,
                      height: ROW_HEIGHT_PX - 3,
                    }}
                  />
                ))}
                {phase === 'playing' && (
                  <div
                    key={floor}
                    ref={movingBlockRef}
                    className="profit-tower-block-moving absolute rounded-md bg-emerald-400 shadow-[0_2px_10px_rgba(16,185,129,0.5)]"
                    style={
                      {
                        left: 0,
                        bottom: (floor + 1) * ROW_HEIGHT_PX,
                        width: baseWidth,
                        height: ROW_HEIGHT_PX - 3,
                        '--tower-travel': `${STAGE_WIDTH_PX - baseWidth}px`,
                        animationDuration: `${durationMs}ms`,
                      } as CSSProperties
                    }
                  />
                )}
              </div>
            </div>

            {phase === 'idle' && (
              <div className="absolute inset-0 grid place-items-center rounded-xl bg-slate-950/85 text-center backdrop-blur-sm">
                <div className="px-4">
                  <p className="text-3xl">🏗️</p>
                  <h3 className="mt-2 text-lg font-bold text-white">利確タワーに挑戦</h3>
                  <p className="mx-auto mt-2 max-w-[220px] text-xs leading-5 text-slate-400">
                    タイミングよくクリックしてブロックを積み上げ、資金を複利で増やそう。
                  </p>
                  <button
                    type="button"
                    onClick={startGame}
                    className="btn-press mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-5 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
                  >
                    スタート
                  </button>
                </div>
              </div>
            )}

            {phase === 'checkpoint' && (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-slate-950/90 text-center backdrop-blur-sm">
                <div className="px-4">
                  <p className="text-3xl">🏁</p>
                  <h3 className="mt-2 text-lg font-bold text-amber-300">
                    {floor}段チェックポイント
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {yen(capital)}
                    <span className="ml-1 text-sm text-slate-500">円</span>
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={cashOut}
                      className="btn-press min-h-10 rounded-full bg-emerald-400/90 px-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
                    >
                      利確する
                    </button>
                    <button
                      type="button"
                      onClick={continueClimbing}
                      className="btn-press min-h-10 rounded-full bg-white/[0.06] px-4 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
                    >
                      続ける
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(phase === 'gameover' || phase === 'cashedOut') && (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-slate-950/90 text-center backdrop-blur-sm">
                <div className="px-4">
                  <p className="text-3xl">{phase === 'cashedOut' ? '💰' : '💥'}</p>
                  <h3 className="mt-2 text-lg font-bold text-white">
                    {phase === 'cashedOut' ? '利確確定！' : 'タワー崩壊...'}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400">到達{floor}段</p>
                  <p className="mt-1 text-2xl font-bold text-amber-300">
                    {yen(lockedCapital)}
                    <span className="ml-1 text-sm text-slate-500">円</span>
                  </p>
                  <button
                    type="button"
                    onClick={startGame}
                    className="btn-press mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-5 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
                  >
                    もう一度挑戦
                  </button>
                </div>
              </div>
            )}
          </div>

          {phase === 'playing' && (
            <button
              type="button"
              onClick={handleDrop}
              className="btn-press mt-4 w-full rounded-xl bg-emerald-400/15 py-3 font-bold text-emerald-300 ring-1 ring-emerald-300/40 transition hover:bg-emerald-400/25"
            >
              タップして積む
            </button>
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
                <p className="text-[11px] text-slate-500">ベスト確定資金</p>
                <p className="mt-1 text-xl font-bold text-amber-300">
                  {myScores.bestScore.toLocaleString('ja-JP')}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <p className="text-[11px] text-slate-500">最高到達段数</p>
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
