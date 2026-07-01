import type { DailyRecord } from '../hooks/usePnLCalendar';

// Only the fields the card renderer actually reads — lets callers (e.g. the
// public showcase endpoint) pass minimal records without id/accountId.
export type PnLCardRecord = Pick<DailyRecord, 'date' | 'pnl'> & Partial<Pick<DailyRecord, 'notes'>>;

// ── Shared date/stats helpers ─────────────────────────────────────────────────

export const toYMD = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const buildCalendarDays = (year: number, month: number): Array<Date | null> => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: Array<Date | null> = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

export type MonthStats = {
  total: number;
  winDays: number;
  lossDays: number;
  tradeDays: number;
  winRate: number | null;
  best: number | null;
  worst: number | null;
};

export const calcStats = (monthRecords: PnLCardRecord[]): MonthStats => {
  if (monthRecords.length === 0) {
    return {
      total: 0,
      winDays: 0,
      lossDays: 0,
      tradeDays: 0,
      winRate: null,
      best: null,
      worst: null,
    };
  }
  const pnls = monthRecords.map((r) => r.pnl);
  const winDays = pnls.filter((p) => p > 0).length;
  const lossDays = pnls.filter((p) => p < 0).length;
  return {
    total: pnls.reduce((s, p) => s + p, 0),
    winDays,
    lossDays,
    tradeDays: monthRecords.length,
    winRate: monthRecords.length > 0 ? (winDays / monthRecords.length) * 100 : null,
    best: Math.max(...pnls),
    worst: Math.min(...pnls),
  };
};

// ── Share card canvas generation ──────────────────────────────────────────────

const fillRR = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const truncate = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string => {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
};

const drawMonthGrid = (
  ctx: CanvasRenderingContext2D,
  year: number,
  month: number,
  records: PnLCardRecord[],
  font: string,
) => {
  const cells = buildCalendarDays(year, month);
  const rMap = new Map(records.map((r) => [r.date, r]));
  const maxAbs = Math.max(0, ...records.map((r) => Math.abs(r.pnl)));
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  const RX = 608, RY = 78, CW = 72, CH = 70, GAP = 4;

  ctx.fillStyle = '#475569';
  ctx.font = `bold 12px ${font}`;
  ctx.textAlign = 'center';
  WD.forEach((d, i) => ctx.fillText(d, RX + i * (CW + GAP) + CW / 2, RY + 18));

  cells.forEach((date, idx) => {
    const col = idx % 7, row = Math.floor(idx / 7);
    const x = RX + col * (CW + GAP), y = RY + 28 + row * (CH + GAP);
    if (!date) {
      ctx.fillStyle = 'rgba(255,255,255,0.02)'; fillRR(ctx, x, y, CW, CH, 6); ctx.fill();
      return;
    }
    const ymd = toYMD(date);
    const rec = rMap.get(ymd);
    if (rec) {
      const op = Math.min(Math.abs(rec.pnl) / (maxAbs || 1), 1) * 0.65 + 0.15;
      const h = Math.round(op * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = rec.pnl > 0 ? `#6ee7b7${h}` : `#fca5a5${h}`;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
    }
    fillRR(ctx, x, y, CW, CH, 6); ctx.fill();
    ctx.fillStyle = rec ? '#f1f5f9' : '#475569';
    ctx.font = `bold 15px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(date.getDate()), x + CW / 2, y + 20);
    if (rec) {
      ctx.fillStyle = rec.pnl > 0 ? '#a7f3d0' : '#fecaca';
      ctx.font = `10px ${font}`;
      const abs = Math.abs(rec.pnl);
      const abbr = (rec.pnl > 0 ? '+' : '') + (abs >= 10000 ? `${(rec.pnl / 10000).toFixed(0)}万` : rec.pnl.toLocaleString('ja-JP'));
      ctx.fillText(abbr, x + CW / 2, y + 40);
    }
  });
  ctx.textAlign = 'left';
};

const drawWeekBars = (
  ctx: CanvasRenderingContext2D,
  weekStart: Date,
  records: PnLCardRecord[],
  unit: string,
  font: string,
) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });
  const rMap = new Map(records.map((r) => [r.date, r]));
  const maxAbs = Math.max(1, ...records.map((r) => Math.abs(r.pnl)));
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  const RX = 600, RY = 72, ROW_H = 70, BAR_X = RX + 60, BAR_MAX = 460;
  const today = toYMD(new Date());

  days.forEach((date, i) => {
    const y = RY + i * ROW_H;
    const ymd = toYMD(date);
    const rec = rMap.get(ymd);
    const isToday = ymd === today;

    ctx.fillStyle = isToday ? 'rgba(103,232,249,0.07)' : (i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent');
    fillRR(ctx, RX - 4, y + 2, 548, ROW_H - 4, 8); ctx.fill();

    ctx.fillStyle = isToday ? '#67e8f9' : '#64748b';
    ctx.font = `bold 12px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText(WD[date.getDay()], RX + 22, y + 22);
    ctx.fillStyle = isToday ? '#a5f3fc' : '#cbd5e1';
    ctx.font = `bold 22px ${font}`;
    ctx.fillText(String(date.getDate()), RX + 22, y + 52);

    if (rec) {
      const bw = Math.max(4, (Math.abs(rec.pnl) / maxAbs) * BAR_MAX);
      ctx.fillStyle = rec.pnl > 0 ? 'rgba(110,231,183,0.25)' : 'rgba(252,165,165,0.25)';
      fillRR(ctx, BAR_X, y + 20, bw, 26, 4); ctx.fill();
      ctx.fillStyle = rec.pnl > 0 ? '#6ee7b7' : '#fca5a5';
      ctx.font = `bold 15px ${font}`;
      ctx.textAlign = 'left';
      ctx.fillText(`${rec.pnl > 0 ? '+' : ''}${rec.pnl.toLocaleString('ja-JP')}${unit}`, BAR_X + 8, y + 38);
      if (rec.notes) {
        ctx.fillStyle = '#475569';
        ctx.font = `12px ${font}`;
        ctx.fillText(truncate(ctx, rec.notes, BAR_MAX - 8), BAR_X + 8, y + 58);
      }
    } else {
      ctx.fillStyle = '#334155';
      ctx.font = `15px ${font}`;
      ctx.textAlign = 'left';
      ctx.fillText('―', BAR_X + 8, y + 38);
    }
  });
  ctx.textAlign = 'left';
};

export type CardOpts = {
  stats: MonthStats;
  records: PnLCardRecord[];
  periodLabel: string;
  unit: string;
  accountName: string;
  viewMode: 'month' | 'week';
  year: number;
  month: number;
  weekStart?: Date;
};

export const generatePnLCard = async (opts: CardOpts): Promise<Blob> => {
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  await document.fonts.ready;

  const FONT = '"Noto Sans JP","Hiragino Sans",system-ui,sans-serif';

  // Background + gradient
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, 'rgba(6,182,212,0.06)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Left panel
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; fillRR(ctx, 48, 48, 508, 534, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; fillRR(ctx, 48, 48, 508, 534, 16); ctx.stroke();

  // Right panel
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; fillRR(ctx, 584, 48, 568, 534, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; fillRR(ctx, 584, 48, 568, 534, 16); ctx.stroke();

  // === LEFT side ===
  const LX = 80;
  ctx.fillStyle = '#67e8f9'; ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('アニャニカル覗き部屋 — 損益カレンダー', LX, 92);

  ctx.fillStyle = '#f1f5f9'; ctx.font = `bold 26px ${FONT}`;
  ctx.fillText(truncate(ctx, opts.accountName, 440), LX, 138);

  ctx.fillStyle = '#64748b'; ctx.font = `18px ${FONT}`;
  ctx.fillText(opts.periodLabel, LX, 172);

  // Total PnL (auto-size)
  const { stats } = opts;
  const totalStr = stats.tradeDays === 0
    ? '記録なし'
    : `${stats.total > 0 ? '＋' : ''}${stats.total.toLocaleString('ja-JP')}${opts.unit}`;
  ctx.fillStyle = stats.total > 0 ? '#6ee7b7' : stats.total < 0 ? '#fca5a5' : '#94a3b8';
  let fs = 56;
  ctx.font = `bold ${fs}px ${FONT}`;
  while (ctx.measureText(totalStr).width > 440 && fs > 28) { fs -= 2; ctx.font = `bold ${fs}px ${FONT}`; }
  ctx.fillText(totalStr, LX, 252);

  ctx.fillStyle = '#475569'; ctx.font = `13px ${FONT}`;
  ctx.fillText('損益合計', LX, 272);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(LX, 290); ctx.lineTo(528, 290); ctx.stroke();

  // Stats
  const stat = (label: string, val: string, col: string, x: number, y: number) => {
    ctx.fillStyle = '#64748b'; ctx.font = `13px ${FONT}`; ctx.fillText(label, x, y);
    ctx.fillStyle = col; ctx.font = `bold 22px ${FONT}`; ctx.fillText(val, x, y + 28);
  };
  if (stats.tradeDays > 0) {
    stat('勝率', stats.winRate !== null ? `${stats.winRate.toFixed(0)}%` : '―', '#f1f5f9', LX, 325);
    stat('取引日数', `${stats.tradeDays}日`, '#f1f5f9', LX + 170, 325);
    stat('勝', `${stats.winDays}日`, '#6ee7b7', LX, 395);
    stat('負', `${stats.lossDays}日`, '#fca5a5', LX + 110, 395);
    if (stats.best !== null && stats.best > 0)
      stat('最高', `+${stats.best.toLocaleString('ja-JP')}`, '#6ee7b7', LX, 465);
    if (stats.worst !== null && stats.worst < 0)
      stat('最大損失', stats.worst.toLocaleString('ja-JP'), '#fca5a5', LX + 200, 465);
  }

  ctx.fillStyle = '#334155'; ctx.font = `13px ${FONT}`;
  ctx.fillText('#FX  #損益カレンダー  #WMB', LX, 558);

  // === RIGHT side ===
  if (opts.viewMode === 'month') {
    drawMonthGrid(ctx, opts.year, opts.month, opts.records, FONT);
  } else if (opts.weekStart) {
    drawWeekBars(ctx, opts.weekStart, opts.records, opts.unit, FONT);
  }

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
};
