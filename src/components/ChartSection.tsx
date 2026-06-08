import { useEffect, useRef, useState } from 'react';

import { CHART_SYMBOLS } from '../config/markets';

type ChartSymbol = (typeof CHART_SYMBOLS)[number];

const TradingViewWidget = ({ symbol }: { symbol: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML =
      '<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: '60',
      timezone: 'Asia/Tokyo',
      theme: 'dark',
      style: '1',
      locale: 'ja',
      backgroundColor: '#020617',
      gridColor: 'rgba(148, 163, 184, 0.12)',
      hide_side_toolbar: true,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });

    container.querySelector('.tradingview-widget-container')?.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      className="h-[460px] w-full overflow-hidden rounded-lg border border-white/10 bg-slate-950 md:h-[560px]"
    />
  );
};

export const ChartSection = () => {
  const [activeSymbol, setActiveSymbol] = useState<ChartSymbol>(CHART_SYMBOLS[0]);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="animate-slide-left text-sm font-semibold text-cyan-200">CFD / FX chart</p>
          <h2 className="animate-fade-up stagger-1 mt-1 text-2xl font-bold text-white">チャートで推移を確認</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            下のチャートはTradingViewの金属・原油・指数・FX参考チャートです。先物シンボルは外部埋め込みで制限される場合があるため、表示されやすい汎用シンボルを使います。
          </p>
        </div>
        <a
          href="https://www.tradingview.com/"
          rel="noreferrer"
          target="_blank"
          className="text-sm font-semibold text-cyan-200 hover:text-cyan-100"
        >
          TradingViewで開く
        </a>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {CHART_SYMBOLS.map((chartSymbol) => {
          const isActive = chartSymbol.symbol === activeSymbol.symbol;

          return (
            <button
              key={chartSymbol.symbol}
              type="button"
              onClick={() => setActiveSymbol(chartSymbol)}
              className={`btn-press shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                isActive
                  ? 'bg-cyan-300 text-slate-950 ring-cyan-200'
                  : 'bg-white/[0.04] text-slate-300 ring-white/10 hover:bg-white/[0.08]'
              }`}
            >
              {chartSymbol.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-900/80 p-3 shadow-glow">
        <div className="mb-3 flex flex-col justify-between gap-1 px-1 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-white">{activeSymbol.label}</p>
            <p className="text-xs text-slate-500">{activeSymbol.description}</p>
          </div>
          <p className="text-xs text-slate-500">{activeSymbol.symbol}</p>
        </div>
        <TradingViewWidget key={activeSymbol.symbol} symbol={activeSymbol.symbol} />
      </div>
    </section>
  );
};
