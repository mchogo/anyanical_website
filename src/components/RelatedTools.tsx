import { useEffect, useRef, useState } from 'react';

import { WEEKEND_MARKETS, type MarketConfig, type MarketPrice } from '../config/markets';
import type { PriceHistoryPoint } from '../hooks/useHyperliquidMids';

type RelatedToolsProps = {
  prices: Record<string, MarketPrice>;
  priceHistory?: Record<string, PriceHistoryPoint[]>;
  isWeekendMode?: boolean;
};

type TradingViewScriptWidgetProps = {
  src: string;
  config: Record<string, unknown>;
  heightClassName: string;
  className?: string;
};

const changeTone = (value: number | null) => {
  if (value === null) {
    return 'text-slate-400';
  }

  return value > 0 ? 'text-emerald-300' : value < 0 ? 'text-rose-300' : 'text-slate-300';
};

const formatNumber = (value: number | null, market: MarketConfig) => {
  if (value === null) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    style: market.category === 'fx' ? undefined : 'currency',
    currency: market.category === 'fx' ? undefined : 'USD',
    maximumFractionDigits: market.category === 'fx' ? 5 : 2,
  }).format(value);
};

const formatPercent = (value: number | null) => {
  if (value === null) {
    return '--';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const calculateHistoryChangePct = (history: PriceHistoryPoint[] | undefined) => {
  if (history === undefined || history.length < 2) {
    return null;
  }

  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;

  if (firstPrice === 0) {
    return null;
  }

  return ((lastPrice - firstPrice) / firstPrice) * 100;
};

const EXNESS_SIGNUP_URL = 'https://x.gd/CxfuR';
const SEMI_AUTO_EA_FORM_URL = 'https://forms.gle/1EiRMR257pgQ9GDJ7';
const EA_DISTRIBUTION_CHANNEL_URL =
  'https://discord.com/channels/1152131321297129534/1488800327514718270';

const TradingViewScriptWidget = ({
  src,
  config,
  heightClassName,
  className = 'overflow-hidden rounded-lg border border-white/10 bg-slate-950',
}: TradingViewScriptWidgetProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const configJson = JSON.stringify(config);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML =
      '<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';

    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = configJson;
    container.querySelector('.tradingview-widget-container')?.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [src, configJson]);

  return <div ref={containerRef} className={`${heightClassName} ${className}`} />;
};

export const CurrencyStrengthTool = () => (
  <section id="tools-currency-strength" className="scroll-mt-8">
    <div className="mb-4">
      <p className="animate-slide-left text-sm font-semibold text-cyan-200">
        Currency strength
      </p>
      <h2 className="animate-fade-up stagger-1 mt-1 text-2xl font-bold text-white">
        通貨強弱・ヒートマップ
      </h2>
      <p className="animate-fade-up stagger-2 mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        主要8通貨の相対的な強弱をTradingView公式ウィジェットで確認します。緑が強い通貨、赤が弱い通貨です。
      </p>
    </div>

    <div className="animate-fade-up stagger-3 grid gap-4 xl:grid-cols-[1fr_1fr]">
      <TradingViewScriptWidget
        src="https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js"
        heightClassName="h-[520px] xl:h-[470px]"
        config={{
          width: '100%',
          height: '100%',
          currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD'],
          isTransparent: true,
          colorTheme: 'dark',
          locale: 'ja',
        }}
      />
      <TradingViewScriptWidget
        src="https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js"
        heightClassName="h-[520px] xl:h-[470px]"
        config={{
          width: '100%',
          height: '100%',
          currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD'],
          isTransparent: true,
          colorTheme: 'dark',
          locale: 'ja',
        }}
      />
    </div>
  </section>
);

export const EconomicCalendarTool = () => (
  <section id="tools-economic-calendar" className="scroll-mt-8">
    <div className="mb-4">
      <p className="animate-slide-left text-sm font-semibold text-cyan-200">
        Economic calendar
      </p>
      <h2 className="animate-fade-up stagger-1 mt-1 text-2xl font-bold text-white">
        経済指標カレンダー
      </h2>
      <p className="animate-fade-up stagger-2 mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        米国・日本・欧州・英国などの主要指標を日本語・東京時間で表示します。重要指標前後はスプレッドや値動きの急変に注意してください。
      </p>
    </div>

    <div className="animate-fade-up stagger-3 grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-bold text-slate-950">主要国の経済イベント</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            TradingView公式カレンダーをライトテーマで表示しています。
          </p>
        </div>
        <TradingViewScriptWidget
          src="https://s3.tradingview.com/external-embedding/embed-widget-events.js"
          heightClassName="h-[620px]"
          className="bg-white"
          config={{
            width: '100%',
            height: '100%',
            colorTheme: 'light',
            isTransparent: false,
            locale: 'ja',
            importanceFilter: '0,1',
            countryFilter: 'us,jp,eu,gb,ca,au,nz',
          }}
        />
      </div>

      <aside className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <p className="text-sm font-semibold text-cyan-200">指標前チェック</p>
        <h3 className="mt-1 text-xl font-bold text-white">EA・裁量前に確認すること</h3>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
          <p>
            重要度の高い指標前後は、スプレッド拡大、約定遅延、急なヒゲが起きやすくなります。
          </p>
          <p>
            指標の結果だけでなく、発表時刻、対象通貨、直前のボラティリティを合わせて確認してください。
          </p>
        </div>
        <ul className="mt-5 space-y-3 text-sm text-slate-300">
          <li className="card-interactive rounded-lg bg-slate-950/50 p-3">
            高重要度の米指標はXAUUSDとUSDJPYを優先確認
          </li>
          <li className="card-interactive rounded-lg bg-slate-950/50 p-3">
            EA稼働中はロット、停止条件、証拠金維持率を再確認
          </li>
          <li className="card-interactive rounded-lg bg-slate-950/50 p-3">
            週明け前は窓開け監視と合わせて確認
          </li>
        </ul>
        <a
          href="https://jp.tradingview.com/economic-calendar/"
          rel="noopener noreferrer"
          target="_blank"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          TradingViewで開く
        </a>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          カレンダーはTradingView公式ウィジェットを使用しています。表示内容、時刻、対象国は外部仕様の変更を受ける場合があります。
        </p>
      </aside>
    </div>

    <div
      className="animate-fade-up mt-4 rounded-lg border border-white/10 bg-slate-950/70 px-4 py-3 text-xs leading-5 text-slate-500"
      style={{ animationDelay: '360ms' }}
    >
      TradingView側の表示制限が発生する場合は、別タブのTradingViewカレンダー、または
      <a
        href="https://jp.investing.com/economic-calendar/"
        rel="nofollow noopener noreferrer"
        target="_blank"
        className="font-semibold text-cyan-200"
      >
        Investing.com 日本
      </a>
      など複数ソースで確認してください。
    </div>
  </section>
);

export const GapWatchTool = ({
  prices,
  priceHistory,
  isWeekendMode = false,
}: RelatedToolsProps) => {
  const modeLabel = isWeekendMode ? '週末監視中' : '平日準備モード';
  const modeClass = isWeekendMode
    ? 'border-amber-300/30 bg-amber-300/10 text-amber-100'
    : 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100';
  const description = isWeekendMode
    ? '金曜クローズ付近の基準価格と現在の24時間取引価格を並べ、月曜オープン前のギャップ警戒度を確認します。'
    : '平日は公式市場も動いているため、窓開け警戒ではなく、現在値と直近6時間の動きで短期の偏りを確認します。';
  const guidance = isWeekendMode
    ? '週末ニュースや地政学リスクで大きく動いた銘柄を優先して確認します。月曜寄り付き前の参考値であり、公式市場の始値を保証するものではありません。'
    : '平日は金曜終値との比較を判断材料にしません。直近数時間の動きと取得状態を確認し、実際の窓開け判断は公式市場が閉まった後に行います。';

  const [sortDir, setSortDir] = useState<'desc' | 'asc' | null>(null);

  const handleSort = () => {
    setSortDir((prev) => (prev === null ? 'desc' : prev === 'desc' ? 'asc' : null));
  };

  const sortedMarkets =
    sortDir === null
      ? WEEKEND_MARKETS
      : [...WEEKEND_MARKETS].sort((a, b) => {
          const aVal = isWeekendMode
            ? Math.abs(prices[a.symbol]?.changePct ?? -Infinity)
            : Math.abs(calculateHistoryChangePct(priceHistory?.[a.symbol]) ?? -Infinity);
          const bVal = isWeekendMode
            ? Math.abs(prices[b.symbol]?.changePct ?? -Infinity)
            : Math.abs(calculateHistoryChangePct(priceHistory?.[b.symbol]) ?? -Infinity);
          return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
        });

  return (
    <section id="tools-gap-watch" className="scroll-mt-8">
      <div className="mb-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="animate-slide-left text-sm font-semibold text-cyan-200">
              Gap watch
            </p>
            <h2 className="animate-fade-up stagger-1 mt-1 text-2xl font-bold text-white">
              窓開け監視ボード
            </h2>
            <p className="animate-fade-up stagger-2 mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {description}
            </p>
          </div>
          <span
            className={`animate-fade-up stagger-2 inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${modeClass}`}
          >
            {modeLabel}
          </span>
        </div>
      </div>

      <div
        className={`animate-fade-up stagger-3 mb-4 rounded-lg border px-4 py-3 text-sm leading-6 ${modeClass}`}
      >
        {guidance}
      </div>

      <div className="animate-fade-up stagger-4 overflow-x-auto rounded-lg border border-white/10 bg-slate-900/80">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-slate-500">
            {isWeekendMode ? (
              <tr>
                <th className="px-4 py-3">銘柄</th>
                <th className="px-4 py-3 text-right">現在値</th>
                <th className="px-4 py-3 text-right">金曜基準</th>
                <th
                  className="cursor-pointer select-none px-4 py-3 text-right transition hover:text-slate-300"
                  onClick={handleSort}
                >
                  週末変動率
                  <span className={`ml-1 ${sortDir !== null ? 'text-cyan-300' : 'text-slate-600'}`}>
                    {sortDir === null ? '↕' : sortDir === 'desc' ? '↓' : '↑'}
                  </span>
                </th>
                <th className="px-4 py-3">窓開け警戒</th>
              </tr>
            ) : (
              <tr>
                <th className="px-4 py-3">監視銘柄</th>
                <th className="px-4 py-3 text-right">現在値</th>
                <th
                  className="cursor-pointer select-none px-4 py-3 text-right transition hover:text-slate-300"
                  onClick={handleSort}
                >
                  直近6時間
                  <span className={`ml-1 ${sortDir !== null ? 'text-cyan-300' : 'text-slate-600'}`}>
                    {sortDir === null ? '↕' : sortDir === 'desc' ? '↓' : '↑'}
                  </span>
                </th>
                <th className="px-4 py-3">短期状態</th>
                <th className="px-4 py-3">取得状態</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedMarkets.map((market) => {
              const price = prices[market.symbol];
              const changePct = price?.changePct ?? null;
              const absChange = Math.abs(changePct ?? 0);
              const alertLabel =
                changePct === null
                  ? '未取得'
                  : absChange >= 1
                    ? isWeekendMode
                      ? '高'
                      : '大きめ'
                    : absChange >= 0.35
                      ? isWeekendMode
                        ? '中'
                        : '確認'
                      : isWeekendMode
                        ? '低'
                        : '通常';
              const alertClass =
                alertLabel === '高' || alertLabel === '大きめ'
                  ? 'bg-rose-400/15 text-rose-200 ring-rose-300/30'
                  : alertLabel === '中' || alertLabel === '確認'
                    ? 'bg-amber-400/15 text-amber-200 ring-amber-300/30'
                    : 'bg-slate-400/15 text-slate-200 ring-slate-300/30';
              const hasPrice = price?.price !== null && price?.price !== undefined;
              const recentChangePct = calculateHistoryChangePct(
                priceHistory?.[market.symbol],
              );
              const recentAbsChange = Math.abs(recentChangePct ?? 0);
              const recentLabel =
                recentChangePct === null
                  ? '履歴取得中'
                  : recentAbsChange >= 0.8
                    ? '大きめ'
                    : recentAbsChange >= 0.25
                      ? '動きあり'
                      : '落ち着き';
              const recentClass =
                recentLabel === '大きめ'
                  ? 'bg-rose-400/15 text-rose-200 ring-rose-300/30'
                  : recentLabel === '動きあり'
                    ? 'bg-amber-400/15 text-amber-200 ring-amber-300/30'
                    : recentLabel === '落ち着き'
                      ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30'
                      : 'bg-slate-400/15 text-slate-200 ring-slate-300/30';

              if (!isWeekendMode) {
                return (
                  <tr key={market.symbol}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{market.displayName}</p>
                      <p className="text-xs text-slate-500">
                        {market.officialMarketLabel ?? market.sourceLabel}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-200 tabular-nums">
                      {formatNumber(price?.price ?? null, market)}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-semibold tabular-nums ${changeTone(recentChangePct)}`}
                    >
                      {formatPercent(recentChangePct)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${recentClass}`}
                      >
                        {recentLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          hasPrice
                            ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30'
                            : 'bg-slate-400/15 text-slate-200 ring-slate-300/30'
                        }`}
                      >
                        {hasPrice ? '取得中' : '未取得'}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        {price?.activeSymbol ?? '採用シンボル確認中'}
                      </p>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={market.symbol}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">
                      {isWeekendMode && market.weekendDisplayName
                        ? market.weekendDisplayName
                        : market.displayName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {price?.activeSymbol ?? '未取得'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-200 tabular-nums">
                    {formatNumber(price?.price ?? null, market)}
                  </td>
                  <td className="px-4 py-4 text-right text-slate-400 tabular-nums">
                    {formatNumber(price?.comparisonPrice ?? null, market)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-semibold tabular-nums ${changeTone(changePct)}`}
                  >
                    {formatPercent(changePct)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${alertClass}`}
                    >
                      {alertLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const EaChecklistTool = () => {
  const setupSteps = [
    {
      title: '指定リンク口座',
      body: 'Exness口座は指定リンクから開設。既存口座の紐付け変更はできません。',
      href: EXNESS_SIGNUP_URL,
      label: 'Exness口座開設',
    },
    {
      title: '口座認証申請',
      body: '新EA専用フォームから申請。セント口座専用EAフォームとは別です。',
      href: SEMI_AUTO_EA_FORM_URL,
      label: '認証フォーム',
    },
    {
      title: 'EA設置',
      body: '配布チャンネルからEAを取得し、MT5へ設置します。認証は48時間以内が目安です。',
      href: EA_DISTRIBUTION_CHANNEL_URL,
      label: '配布チャンネル',
    },
  ];

  const checklist = [
    '指定リンクから開設したExness口座である',
    '口座タイプと資金量に対するロット比率を決めた',
    '指標発表時刻と週明け流動性を確認した',
    '稼働するEAの対象銘柄とスプレッド条件を確認した',
    '最大ロット、最大ポジション数、損切り条件を確認した',
    'VPSまたはPCの稼働状態、回線、口座ログインを確認した',
    '異常値動き時に手動停止できる手順を確認した',
    '半裁量EAの場合、エントリー許可・停止の判断基準を決めた',
  ];

  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const stored = localStorage.getItem('ea-checklist');
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed) && parsed.length === checklist.length) {
          return parsed as boolean[];
        }
      }
    } catch {
      /* ignore */
    }
    return Array<boolean>(checklist.length).fill(false);
  });

  const toggleItem = (index: number) => {
    setChecked((prev) => {
      const next = prev.map((v, i) => (i === index ? !v : v));
      localStorage.setItem('ea-checklist', JSON.stringify(next));
      return next;
    });
  };

  const resetChecklist = () => {
    const reset = Array<boolean>(checklist.length).fill(false);
    setChecked(reset);
    localStorage.setItem('ea-checklist', JSON.stringify(reset));
  };

  return (
    <section id="tools-ea-checklist" className="scroll-mt-8">
      <div className="mb-4">
        <p className="animate-slide-left text-sm font-semibold text-cyan-200">
          EA checklist
        </p>
        <h2 className="animate-fade-up stagger-1 mt-1 text-2xl font-bold text-white">
          EA運用チェックリスト
        </h2>
        <p className="animate-fade-up stagger-2 mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          半裁量EA・全自動EAを動かす前に、相場環境と運用条件を確認するための簡易チェックです。
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {setupSteps.map((step, index) => (
          <article
            key={step.title}
            className="card-interactive animate-fade-up rounded-lg border border-amber-300/20 bg-amber-300/10 p-4"
            style={{ animationDelay: `${200 + index * 80}ms` }}
          >
            <h3 className="text-base font-bold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{step.body}</p>
            <a
              href={step.href}
              rel="nofollow noopener noreferrer"
              target="_blank"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
            >
              {step.label}
            </a>
          </article>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {checklist.map((item, index) => (
          <label
            key={item}
            className={`animate-fade-up flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition ${
              checked[index]
                ? 'border-cyan-300/20 bg-cyan-300/[0.06] text-slate-500'
                : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]'
            }`}
            style={{ animationDelay: `${360 + index * 40}ms` }}
          >
            <input
              type="checkbox"
              checked={checked[index]}
              onChange={() => toggleItem(index)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-950 accent-cyan-300"
            />
            <span className={checked[index] ? 'line-through' : ''}>{item}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {checked.filter(Boolean).length} / {checklist.length} 完了
        </p>
        <button
          type="button"
          onClick={resetChecklist}
          className="text-xs text-slate-500 transition hover:text-slate-300"
        >
          リセット
        </button>
      </div>
    </section>
  );
};
