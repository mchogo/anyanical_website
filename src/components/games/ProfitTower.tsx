import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { useDiscordAuth } from '../../hooks/useDiscordAuth';
import { useGameScores } from '../../hooks/useGameScores';

// 利確タワー: 陽線ブロックをタップ／スペースで落として重ね、前段との重なり幅が
// 次段の土台になるStack系ミニゲーム。重なりがゼロになると崩壊し、
// 未確定の含み益だけが消滅する（確定資金＝元本は失われない）。
// パーフェクトタイミングは土台の幅を回復させ、連続Perfectほど複利率が上乗せされる。
// ステージ幅はコンテナ実寸をResizeObserverで測り、比率(0〜1)で状態管理することで
// 画面サイズに合わせて拡大縮小しても重なり判定がズレないようにしている。

const ROW_HEIGHT_PX = 34;
// オーバーレイ(開始/チェックポイント/結果)の文言が入り切る高さを確保しつつ大きめに表示
const VISIBLE_FLOORS = 10;
const FALLBACK_STAGE_WIDTH_PX = 360;
// 1個目のブロックはステージ全幅より狭くし、左右にちゃんと往復移動して見えるようにする
const INITIAL_BLOCK_RATIO = 0.42;
const RECOVERY_STEP_RATIO = 0.05;
const INITIAL_CAPITAL = 100000;
const MAX_RATE = 0.15;
const MIN_OVERLAP_RATIO = 0.06;
const CHECKPOINT_INTERVAL = 5;
const PERFECT_RATIO_THRESHOLD = 0.94;
const COMBO_BONUS_STEP = 0.02;
const COMBO_BONUS_CAP = 0.1;

// 「邪魔者」要素: 序盤は普通に遊べるよう、一定段数を超えてから確率で出現させる
const HAZARD_START_FLOOR = 6;
const BAD_CANDLE_CHANCE = 0.16;
const NEWS_EVENT_CHANCE = 0.14;
const DEAD_ZONE_CHANCE = 0.18;
const DEAD_ZONE_WIDTH_RATIO = 0.4;

type Phase = 'idle' | 'playing' | 'checkpoint' | 'gameover' | 'cashedOut';
type Rank = 'perfect' | 'good' | 'barely';
type PlacedBlock = { floor: number; leftRatio: number; widthRatio: number };
type Hazard = {
  isBadCandle: boolean;
  isNewsEvent: boolean;
  deadZone: { leftRatio: number; widthRatio: number } | null;
};

const NO_HAZARD: Hazard = { isBadCandle: false, isNewsEvent: false, deadZone: null };

// 次に落とすブロックの「邪魔者」を抽選する。1回につき最大1種類のみ発生させ、
// 複数の邪魔者が重なって理不尽な難易度にならないようにしている。
const rollHazard = (
  attemptFloor: number,
  baseLeftRatio: number,
  baseWidthRatio: number,
): Hazard => {
  if (attemptFloor < HAZARD_START_FLOOR) return NO_HAZARD;
  if (Math.random() < BAD_CANDLE_CHANCE) {
    return { isBadCandle: true, isNewsEvent: false, deadZone: null };
  }
  if (Math.random() < NEWS_EVENT_CHANCE) {
    return { isBadCandle: false, isNewsEvent: true, deadZone: null };
  }
  if (Math.random() < DEAD_ZONE_CHANCE) {
    const dzWidthRatio = baseWidthRatio * DEAD_ZONE_WIDTH_RATIO;
    const maxOffset = Math.max(baseWidthRatio - dzWidthRatio, 0);
    const dzLeftRatio = baseLeftRatio + Math.random() * maxOffset;
    return {
      isBadCandle: false,
      isNewsEvent: false,
      deadZone: { leftRatio: dzLeftRatio, widthRatio: dzWidthRatio },
    };
  }
  return NO_HAZARD;
};

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
  const [lockedCapital, setLockedCapital] = useState(INITIAL_CAPITAL);
  const [comboPerfect, setComboPerfect] = useState(0);
  const [baseLeftRatio, setBaseLeftRatio] = useState((1 - INITIAL_BLOCK_RATIO) / 2);
  const [baseWidthRatio, setBaseWidthRatio] = useState(INITIAL_BLOCK_RATIO);
  const [blocks, setBlocks] = useState<PlacedBlock[]>([]);
  const [lastRank, setLastRank] = useState<Rank | null>(null);
  const [stageWidth, setStageWidth] = useState(FALLBACK_STAGE_WIDTH_PX);
  const [hazard, setHazard] = useState<Hazard>(NO_HAZARD);

  const stageRef = useRef<HTMLDivElement>(null);
  const movingBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if ((phase === 'gameover' || phase === 'cashedOut') && canSave) {
      // 複利で資金が伸びすぎるとWorker側のスコア上限(1,000,000,000)を超えて保存が
      // 黙って失敗するため、送信前にクランプしてハイスコア更新漏れを防ぐ
      const scoreToSave = Math.min(Math.round(lockedCapital), 999_999_999);
      void submitScore(scoreToSave, floor, { rank: lastRank });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startGame = () => {
    setPhase('playing');
    setFloor(0);
    setCapital(INITIAL_CAPITAL);
    setLockedCapital(INITIAL_CAPITAL);
    setComboPerfect(0);
    setBaseLeftRatio((1 - INITIAL_BLOCK_RATIO) / 2);
    setBaseWidthRatio(INITIAL_BLOCK_RATIO);
    setBlocks([]);
    setLastRank(null);
    setHazard(NO_HAZARD);
  };

  const handleDrop = () => {
    if (phase !== 'playing') return;
    const stageEl = stageRef.current;
    const blockEl = movingBlockRef.current;
    if (!stageEl || !blockEl) return;

    const stageRect = stageEl.getBoundingClientRect();
    const currentWidth = stageRect.width;
    const blockRect = blockEl.getBoundingClientRect();
    const blockLeft = blockRect.left - stageRect.left;
    const blockWidth = blockRect.width;

    const baseLeftPx = baseLeftRatio * currentWidth;
    const baseWidthPx = baseWidthRatio * currentWidth;

    const overlapLeft = Math.max(baseLeftPx, blockLeft);
    const overlapRight = Math.min(baseLeftPx + baseWidthPx, blockLeft + blockWidth);
    const overlapWidth = overlapRight - overlapLeft;

    // 固定デッドゾーン(スプレッド帯)に重なった分は着地判定から差し引く
    let effectiveOverlapWidth = overlapWidth;
    if (hazard.deadZone) {
      const dzLeftPx = hazard.deadZone.leftRatio * currentWidth;
      const dzWidthPx = hazard.deadZone.widthRatio * currentWidth;
      const dzOverlapLeft = Math.max(overlapLeft, dzLeftPx);
      const dzOverlapRight = Math.min(overlapLeft + overlapWidth, dzLeftPx + dzWidthPx);
      const dzOverlap = Math.max(0, dzOverlapRight - dzOverlapLeft);
      effectiveOverlapWidth = Math.max(0, overlapWidth - dzOverlap);
    }
    const overlapRatio = baseWidthPx > 0 ? effectiveOverlapWidth / baseWidthPx : 0;

    if (effectiveOverlapWidth <= 0 || overlapRatio < MIN_OVERLAP_RATIO) {
      setComboPerfect(0);
      setPhase('gameover');
      return;
    }

    // 陰線ブロックはタイミングが良くても複利が乗らず、連続Perfectもリセットされる
    const isPerfect = !hazard.isBadCandle && overlapRatio >= PERFECT_RATIO_THRESHOLD;
    const rank: Rank = isPerfect ? 'perfect' : overlapRatio > 0.6 ? 'good' : 'barely';
    const nextCombo = isPerfect ? comboPerfect + 1 : 0;
    const comboBonus = isPerfect
      ? Math.min(nextCombo * COMBO_BONUS_STEP, COMBO_BONUS_CAP)
      : 0;
    const rate = hazard.isBadCandle ? 0 : MAX_RATE * overlapRatio + comboBonus;
    const nextFloor = floor + 1;

    // パーフェクトタイミングは土台の幅を回復させる（連続で決めるほど立て直しやすくなる）
    let nextWidthPx = overlapWidth;
    let nextLeftPx = overlapLeft;
    if (isPerfect) {
      const recoveryPx = RECOVERY_STEP_RATIO * currentWidth;
      // 回復の上限は「最初のブロックの幅」まで。上限を全幅にすると連続パーフェクトで
      // 土台が際限なく広がり、以降ずっと外しようがなくなって難易度が頭打ちになるため。
      const maxRecoverWidth = INITIAL_BLOCK_RATIO * currentWidth;
      const grown = Math.min(maxRecoverWidth, baseWidthPx + recoveryPx);
      const growDelta = grown - overlapWidth;
      nextWidthPx = grown;
      nextLeftPx = Math.max(
        0,
        Math.min(overlapLeft - growDelta / 2, currentWidth - grown),
      );
    }

    const nextWidthRatio = nextWidthPx / currentWidth;
    const nextLeftRatio = nextLeftPx / currentWidth;

    setBlocks((prev) => [
      ...prev,
      { floor: nextFloor, leftRatio: nextLeftRatio, widthRatio: nextWidthRatio },
    ]);
    setBaseLeftRatio(nextLeftRatio);
    setBaseWidthRatio(nextWidthRatio);
    setCapital((prev) => prev * (1 + rate));
    setFloor(nextFloor);
    setLastRank(rank);
    setComboPerfect(nextCombo);
    setHazard(rollHazard(nextFloor + 1, nextLeftRatio, nextWidthRatio));
    setPhase(nextFloor % CHECKPOINT_INTERVAL === 0 ? 'checkpoint' : 'playing');
  };

  // 陽線ブロックをタップ／スペースで落とす（参考ゲームと同じ操作系）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      handleDrop();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const cashOut = () => {
    setLockedCapital(capital);
    setPhase('cashedOut');
  };

  const continueClimbing = () => setPhase('playing');

  const baseDurationMs = Math.max(900, 2600 - floor * 70);
  // フラッシュ経済指標: その回だけ速度が跳ね上がる
  const durationMs = hazard.isNewsEvent
    ? Math.max(450, baseDurationMs * 0.5)
    : baseDurationMs;
  const cameraShift = Math.max(0, floor + 1 - VISIBLE_FLOORS) * ROW_HEIGHT_PX;
  const unconfirmedProfit = capital - lockedCapital;
  const movingWidthPx = baseWidthRatio * stageWidth;

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
          🕯️
          陽線ブロックをタップ／スペースで落として積み上げ、資金を複利で増やすミニゲーム。ズレるほど次の土台が狭くなり、重なりがなくなるとタワーは崩壊（未確定の利益だけが消滅、確定済みの資金は失われません）。パーフェクトタイミングは土台の幅を回復させ、連続で決めるほど複利率が上乗せされます。5段ごとのチェックポイントで利確すれば、そこまでの資金が確定します。6段目以降は陰線ブロックや重要指標発表、スプレッド帯といった「邪魔者」もランダムに登場します。トレーニング目的の仮想資金です。
        </p>

        <details className="mt-3 rounded-lg border border-white/10 bg-white/[0.035]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-xs font-semibold text-white">
            <span>⚠️ 邪魔者ガイド（6段目以降にランダム出現）</span>
            <span className="faq-icon grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20">
              +
            </span>
          </summary>
          <div className="faq-body border-t border-white/10">
            <div className="faq-body-inner">
              <ul className="space-y-3 px-4 py-4 text-xs leading-5 text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 h-4 w-6 shrink-0 rounded bg-rose-400" />
                  <span>
                    <span className="font-bold text-rose-300">陰線ブロック</span>
                    ：ちゃんと着地させても複利は増えず、連続Perfectも0にリセットされます。
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-sm">⚡</span>
                  <span>
                    <span className="font-bold text-amber-300">フラッシュ経済指標</span>
                    ：警告が出たその1回だけ、ブロックの移動速度が跳ね上がります。
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 h-4 w-6 shrink-0 rounded"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, rgba(244,63,94,0.55) 0 4px, rgba(244,63,94,0.15) 4px 8px)',
                    }}
                  />
                  <span>
                    <span className="font-bold text-rose-300">
                      スプレッド帯（デッドゾーン）
                    </span>
                    ：縞模様の部分は重なり判定から除外されます。そこだけに乗せても外れ扱いです。
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </details>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="relative rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-5">
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <div className="rounded-lg bg-white/[0.03] px-2 py-2">
              <p className="text-[10px] text-slate-500">確定資金</p>
              <p className="mt-0.5 text-sm font-bold text-white">
                {yen(lockedCapital)}円
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-2 py-2">
              <p className="text-[10px] text-slate-500">未確定利益</p>
              <p className="mt-0.5 text-sm font-bold text-emerald-300">
                +{yen(unconfirmedProfit)}円
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-2 py-2">
              <p className="text-[10px] text-slate-500">段数</p>
              <p className="mt-0.5 text-sm font-bold text-white">{floor}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-2 py-2">
              <p className="text-[10px] text-slate-500">連続Perfect</p>
              <p className="mt-0.5 text-sm font-bold text-amber-300">{comboPerfect}</p>
            </div>
          </div>

          {lastRank && (
            <p className="mt-2 text-center text-xs font-bold text-amber-300">
              {RANK_LABEL[lastRank]}
            </p>
          )}

          <div className="relative mx-auto mt-3 w-full max-w-2xl">
            <div
              ref={stageRef}
              onClick={handleDrop}
              className={`relative w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 ${
                phase === 'gameover' ? 'profit-tower-shake' : ''
              }`}
              style={{ height: VISIBLE_FLOORS * ROW_HEIGHT_PX }}
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
                    className="profit-tower-block-land absolute rounded-md bg-amber-300/80"
                    style={{
                      left: block.leftRatio * stageWidth,
                      bottom: (block.floor - 1) * ROW_HEIGHT_PX,
                      width: block.widthRatio * stageWidth,
                      height: ROW_HEIGHT_PX - 3,
                    }}
                  />
                ))}
                {phase === 'playing' && hazard.deadZone && (
                  <div
                    className="absolute rounded-md ring-1 ring-rose-400/70"
                    style={{
                      left: hazard.deadZone.leftRatio * stageWidth,
                      bottom: (floor - 1) * ROW_HEIGHT_PX,
                      width: hazard.deadZone.widthRatio * stageWidth,
                      height: ROW_HEIGHT_PX - 3,
                      backgroundImage:
                        'repeating-linear-gradient(45deg, rgba(244,63,94,0.55) 0 6px, rgba(244,63,94,0.15) 6px 12px)',
                    }}
                  />
                )}
                {phase === 'playing' && (
                  <div
                    key={floor}
                    ref={movingBlockRef}
                    className={`profit-tower-block-moving absolute rounded-md ${
                      hazard.isBadCandle
                        ? 'bg-rose-400 shadow-[0_2px_10px_rgba(244,63,94,0.5)]'
                        : 'bg-emerald-400 shadow-[0_2px_10px_rgba(16,185,129,0.5)]'
                    }`}
                    style={
                      {
                        left: 0,
                        bottom: floor * ROW_HEIGHT_PX,
                        width: movingWidthPx,
                        height: ROW_HEIGHT_PX - 3,
                        '--tower-travel': `${stageWidth - movingWidthPx}px`,
                        animationDuration: `${durationMs}ms`,
                      } as CSSProperties
                    }
                  />
                )}
              </div>

              {phase === 'playing' && hazard.isNewsEvent && (
                <div
                  key={`news-${floor}`}
                  className="animate-toast-in pointer-events-none absolute inset-x-0 top-2 z-10 text-center"
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-3 py-1 text-[11px] font-bold text-slate-950 shadow-lg">
                    ⚡ 重要指標発表！速い！
                  </span>
                </div>
              )}
            </div>

            {phase === 'idle' && (
              <div className="absolute inset-0 grid place-items-center rounded-xl bg-slate-950/85 text-center backdrop-blur-sm">
                <div className="px-4">
                  <p className="text-3xl">🏗️</p>
                  <h3 className="mt-2 text-lg font-bold text-white">利確タワーに挑戦</h3>
                  <p className="mx-auto mt-2 max-w-[260px] text-xs leading-5 text-slate-400">
                    タイミングよくタップ／スペースでブロックを落として積み上げ、資金を複利で増やそう。
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
                  <p className="mt-1 text-xs text-emerald-300">
                    未確定利益 +{yen(unconfirmedProfit)}円を確定できます
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={cashOut}
                      className="btn-press min-h-10 rounded-full bg-emerald-400/90 px-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
                    >
                      💰 利確して降りる
                    </button>
                    <button
                      type="button"
                      onClick={continueClimbing}
                      className="btn-press min-h-10 rounded-full bg-white/[0.06] px-4 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
                    >
                      ▶ 腕試しを続ける
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
                    最終資金 {yen(lockedCapital)}
                    <span className="ml-1 text-sm text-slate-500">円</span>
                  </p>
                  <p className="mx-auto mt-3 max-w-[260px] text-[11px] leading-5 text-slate-500">
                    {phase === 'cashedOut'
                      ? '欲張らず利確できました。この「利確の勇気」を実際のトレードでも意識してみましょう。'
                      : '未確定の利益は消えてしまいました。次はどこで利確するか、事前に決めておきましょう。'}
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
              タップ／スペースで積む
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
                <p className="text-[11px] text-slate-500">ベスト最終資金</p>
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
