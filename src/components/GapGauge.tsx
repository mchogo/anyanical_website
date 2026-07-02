import type { MarketPrice } from '../config/markets';

// 窓開け幅（金曜基準の変動率）をタコメーター型ゲージで可視化する。
// 針はライブ価格に追従し、CSS transitionで滑らかに回転する。

type GapGaugeProps = {
  label: string;
  price: MarketPrice | undefined;
};

const RANGE = 3; // ゲージの表示レンジ: ±3%

const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max);

/** changePct(-RANGE..+RANGE) → 針の角度(-90..+90deg) */
const toAngle = (changePct: number): number =>
  (clamp(changePct, -RANGE, RANGE) / RANGE) * 90;

/** 極座標 → SVG座標（中心(100,100)、0degが真上、時計回り） */
const polar = (angleDeg: number, radius: number): { x: number; y: number } => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: 100 + radius * Math.cos(rad), y: 100 + radius * Math.sin(rad) };
};

const arcPath = (fromDeg: number, toDeg: number, radius: number): string => {
  const start = polar(fromDeg, radius);
  const end = polar(toDeg, radius);
  const largeArc = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
};

const TICKS = [-3, -2, -1, 0, 1, 2, 3];

export const GapGauge = ({ label, price }: GapGaugeProps) => {
  const changePct = price?.changePct ?? null;
  const angle = toAngle(changePct ?? 0);
  const isLive = changePct !== null;
  const dirColor =
    changePct === null || changePct === 0
      ? '#94a3b8'
      : changePct > 0
        ? '#6ee7b7'
        : '#fda4af';

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-slate-400">
          現在の窓開け幅 <span className="text-slate-300">{label}</span>
        </p>
        <p
          className={`text-[10px] font-bold ${isLive ? 'text-emerald-300' : 'text-slate-600'}`}
        >
          {isLive ? '● LIVE' : '○ 接続待ち'}
        </p>
      </div>

      <div className="mx-auto mt-1 max-w-[280px]">
        <svg viewBox="0 0 200 118" role="img" aria-label={`${label} の変動率ゲージ`}>
          {/* 目盛りゾーン: 下落(赤) / 中立(グレー) / 上昇(緑) */}
          <path
            d={arcPath(-90, -6, 78)}
            fill="none"
            stroke="rgba(244,63,94,0.35)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={arcPath(-6, 6, 78)}
            fill="none"
            stroke="rgba(148,163,184,0.3)"
            strokeWidth="10"
          />
          <path
            d={arcPath(6, 90, 78)}
            fill="none"
            stroke="rgba(16,185,129,0.35)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* 現在値までの発光アーク */}
          {isLive && changePct !== 0 && (
            <path
              d={
                changePct! > 0
                  ? arcPath(0, Math.max(angle, 2), 78)
                  : arcPath(Math.min(angle, -2), 0, 78)
              }
              fill="none"
              stroke={dirColor}
              strokeWidth="10"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${dirColor})` }}
            />
          )}

          {/* 目盛りとラベル */}
          {TICKS.map((tick) => {
            const a = toAngle(tick);
            const outer = polar(a, 88);
            const inner = polar(a, tick === 0 ? 66 : 70);
            const text = polar(a, 58);
            return (
              <g key={tick}>
                <line
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                  stroke={tick === 0 ? 'rgba(226,232,240,0.7)' : 'rgba(148,163,184,0.4)'}
                  strokeWidth={tick === 0 ? 2 : 1}
                />
                <text
                  x={text.x}
                  y={text.y + 3}
                  textAnchor="middle"
                  fontSize="8"
                  fill="rgba(148,163,184,0.7)"
                >
                  {tick > 0 ? `+${tick}` : tick}
                </text>
              </g>
            );
          })}

          {/* 針（CSS transitionで滑らかに追従） */}
          <g
            className="transition-transform duration-700 ease-out"
            style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }}
          >
            <polygon
              points="100,26 96.5,100 103.5,100"
              fill={dirColor}
              opacity={isLive ? 1 : 0.3}
            />
          </g>
          <circle
            cx="100"
            cy="100"
            r="7"
            fill="#0f172a"
            stroke={dirColor}
            strokeWidth="2.5"
          />
        </svg>
      </div>

      <div className="-mt-2 text-center">
        <p className="text-2xl font-bold" style={{ color: dirColor }}>
          {changePct === null
            ? '―'
            : `${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {price?.price != null && price?.comparisonPrice != null
            ? `現在 ${price.price.toLocaleString('en-US', { maximumFractionDigits: 4 })} / 基準 ${price.comparisonPrice.toLocaleString('en-US', { maximumFractionDigits: 4 })}`
            : '金曜終値基準の変動率（±3%レンジ表示）'}
        </p>
      </div>
    </div>
  );
};
