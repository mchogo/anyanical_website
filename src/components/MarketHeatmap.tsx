import { useMemo, useState } from 'react';

import type { MarketConfig, MarketPrice } from '../config/markets';

type MarketHeatmapProps = {
  markets: MarketConfig[];
  prices: Record<string, MarketPrice>;
  isWeekendMode: boolean;
};

type TreemapItem = {
  market: MarketConfig;
  price: MarketPrice | undefined;
  weight: number;
};

type TreemapRect = TreemapItem & {
  x: number;
  y: number;
  w: number;
  h: number;
};

// ── Squarified treemap（依存ライブラリなしの自前実装） ─────────────────────────
// items を面積比 weight で 0..100 × 0..100 の正規化空間に敷き詰める。

const squarify = (
  items: TreemapItem[],
  x: number,
  y: number,
  w: number,
  h: number,
): TreemapRect[] => {
  const result: TreemapRect[] = [];
  let rest = [...items].sort((a, b) => b.weight - a.weight);
  let rx = x;
  let ry = y;
  let rw = w;
  let rh = h;

  while (rest.length > 0) {
    const total = rest.reduce((s, i) => s + i.weight, 0);
    const area = rw * rh;
    const scale = area / total;
    const side = Math.min(rw, rh);

    // 行に追加していき、アスペクト比が悪化する直前で確定する
    let row: TreemapItem[] = [rest[0]];
    let rowWeight = rest[0].weight;
    const worst = (rowItems: TreemapItem[], weightSum: number): number => {
      const rowArea = weightSum * scale;
      const rowThickness = rowArea / side;
      let max = 0;
      for (const it of rowItems) {
        const len = (it.weight * scale) / rowThickness;
        const ratio = Math.max(rowThickness / len, len / rowThickness);
        if (ratio > max) max = ratio;
      }
      return max;
    };
    let currentWorst = worst(row, rowWeight);
    for (let i = 1; i < rest.length; i += 1) {
      const candidate = [...row, rest[i]];
      const candidateWeight = rowWeight + rest[i].weight;
      const candidateWorst = worst(candidate, candidateWeight);
      if (candidateWorst > currentWorst) break;
      row = candidate;
      rowWeight = candidateWeight;
      currentWorst = candidateWorst;
    }

    // 行を確定して配置する（短辺に沿って敷く）
    const rowArea = rowWeight * scale;
    const horizontal = rw >= rh;
    const thickness = rowArea / side;
    let offset = 0;
    for (const it of row) {
      const len = (it.weight * scale) / thickness;
      result.push(
        horizontal
          ? { ...it, x: rx, y: ry + offset, w: thickness, h: len }
          : { ...it, x: rx + offset, y: ry, w: len, h: thickness },
      );
      offset += len;
    }
    if (horizontal) {
      rx += thickness;
      rw -= thickness;
    } else {
      ry += thickness;
      rh -= thickness;
    }
    rest = rest.slice(row.length);
  }
  return result;
};

// ── 色: changePct → 背景色（プラス=緑 / マイナス=赤 / ゼロ・欠損=グレー） ────────

const CHANGE_CAP = 3; // ±3%で彩度の上限に到達

const tileColor = (changePct: number | null | undefined): string => {
  if (changePct === null || changePct === undefined || changePct === 0) {
    return 'rgba(100,116,139,0.18)';
  }
  const intensity = Math.min(Math.abs(changePct) / CHANGE_CAP, 1) * 0.55 + 0.18;
  return changePct > 0
    ? `rgba(16,185,129,${intensity.toFixed(3)})`
    : `rgba(244,63,94,${intensity.toFixed(3)})`;
};

const formatPct = (changePct: number | null | undefined): string => {
  if (changePct === null || changePct === undefined) return '―';
  return `${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`;
};

const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return '―';
  return price >= 1000
    ? price.toLocaleString('en-US', { maximumFractionDigits: 1 })
    : price.toLocaleString('en-US', { maximumFractionDigits: 4 });
};

export const MarketHeatmap = ({ markets, prices, isWeekendMode }: MarketHeatmapProps) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const rects = useMemo(() => {
    const items: TreemapItem[] = markets.map((market) => {
      const price = prices[market.symbol];
      // 面積 = 変動の大きさ（動いた銘柄ほど大きく）。欠損・微動は最小面積を保証
      const weight = Math.max(Math.abs(price?.changePct ?? 0), 0.2);
      return { market, price, weight };
    });
    if (items.length === 0) return [];
    return squarify(items, 0, 0, 100, 100);
  }, [markets, prices]);

  if (rects.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        表示できる銘柄がありません
      </p>
    );
  }

  const hoveredRect = rects.find((r) => r.market.symbol === hovered) ?? null;

  return (
    <div className="relative">
      <div
        className="relative h-[420px] w-full overflow-hidden rounded-xl ring-1 ring-white/10 sm:h-[520px]"
        onMouseLeave={() => setHovered(null)}
      >
        {rects.map((rect) => {
          const changePct = rect.price?.changePct ?? null;
          const name =
            isWeekendMode && rect.market.weekendDisplayName
              ? rect.market.weekendDisplayName
              : rect.market.displayName;
          const big = rect.w * rect.h > 350; // 正規化面積ベースでラベル量を出し分け
          return (
            <button
              key={rect.market.symbol}
              type="button"
              aria-label={`${name} ${formatPct(changePct)}`}
              onMouseEnter={() => setHovered(rect.market.symbol)}
              onFocus={() => setHovered(rect.market.symbol)}
              onClick={() =>
                setHovered((prev) =>
                  prev === rect.market.symbol ? null : rect.market.symbol,
                )
              }
              className="absolute overflow-hidden p-[3px] outline-none"
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.w}%`,
                height: `${rect.h}%`,
              }}
            >
              <span
                className={`flex h-full w-full flex-col items-start justify-between rounded-lg p-2 text-left ring-1 ring-white/10 transition-[background-color,box-shadow] duration-500 ${
                  hovered === rect.market.symbol ? 'ring-2 ring-cyan-300/60' : ''
                }`}
                style={{ backgroundColor: tileColor(changePct) }}
              >
                <span className="min-w-0 truncate text-[11px] font-bold text-white/90 sm:text-xs">
                  {name}
                </span>
                {big ? (
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-bold text-white sm:text-lg">
                      {formatPct(changePct)}
                    </span>
                    <span className="truncate text-[10px] text-white/60 sm:text-xs">
                      {formatPrice(rect.price?.price)}
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-white/90 sm:text-xs">
                    {formatPct(changePct)}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {/* グラスモーフィズム・ツールチップ */}
        {hoveredRect && (
          <div
            className="pointer-events-none absolute z-10 w-52 rounded-xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md"
            style={{
              left: `min(max(${hoveredRect.x + hoveredRect.w / 2}%, 12%), 74%)`,
              top: `${hoveredRect.y + hoveredRect.h / 2 > 55 ? hoveredRect.y - 2 : hoveredRect.y + hoveredRect.h + 2}%`,
              transform: 'translate(-25%, 0)',
            }}
          >
            <p className="text-xs font-bold text-white">
              {isWeekendMode && hoveredRect.market.weekendDisplayName
                ? hoveredRect.market.weekendDisplayName
                : hoveredRect.market.displayName}
              <span className="ml-1.5 font-normal text-white/50">
                {hoveredRect.market.label}
              </span>
            </p>
            <div className="mt-2 space-y-1 text-[11px] leading-4">
              <p className="flex justify-between text-white/70">
                <span>現在値</span>
                <span className="font-bold text-white">
                  {formatPrice(hoveredRect.price?.price)}
                </span>
              </p>
              <p className="flex justify-between text-white/70">
                <span>比較基準</span>
                <span className="text-white/90">
                  {formatPrice(hoveredRect.price?.comparisonPrice)}
                </span>
              </p>
              <p className="flex justify-between text-white/70">
                <span>変動率</span>
                <span
                  className={`font-bold ${
                    (hoveredRect.price?.changePct ?? 0) > 0
                      ? 'text-emerald-300'
                      : (hoveredRect.price?.changePct ?? 0) < 0
                        ? 'text-rose-300'
                        : 'text-slate-300'
                  }`}
                >
                  {formatPct(hoveredRect.price?.changePct)}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-right text-[11px] text-slate-600">
        面積=変動の大きさ /
        色=方向。Hyperliquid参考価格につき実勢と乖離する場合があります。
      </p>
    </div>
  );
};
