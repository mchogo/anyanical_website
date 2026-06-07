import { useEffect, useRef } from 'react';

import { WEEKEND_MARKETS, type MarketConfig, type MarketPrice } from '../config/markets';

type RelatedToolsProps = {
  prices: Record<string, MarketPrice>;
};

type TradingViewScriptWidgetProps = {
  src: string;
  config: Record<string, unknown>;
  heightClassName: string;
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

const TradingViewScriptWidget = ({
  src,
  config,
  heightClassName,
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

  return (
    <div
      ref={containerRef}
      className={`${heightClassName} overflow-hidden rounded-lg border border-white/10 bg-slate-950`}
    />
  );
};

export const CurrencyStrengthTool = () => (
  <section id="tools-currency-strength" className="scroll-mt-8">
    <div className="mb-4">
      <p className="text-sm font-semibold text-cyan-200">Currency strength</p>
      <h2 className="mt-1 text-2xl font-bold text-white">通貨強弱・ヒートマップ</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        主要8通貨の相対的な強弱をTradingView公式ウィジェットで確認します。緑が強い通貨、赤が弱い通貨です。
      </p>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
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
      <p className="text-sm font-semibold text-cyan-200">Economic calendar</p>
      <h2 className="mt-1 text-2xl font-bold text-white">経済指標カレンダー</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        米国・日本・欧州・英国などの主要指標を日本語・東京時間で表示します。重要指標前後はスプレッドや値動きの急変に注意してください。
      </p>
    </div>

    <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950">
      <iframe
        title="経済指標カレンダー"
        src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=5,4,10,14,48,25,6,36,12,26,41,17,43,22,32,178,42,72,37,110,46,35,11,39&calType=week&timeZone=29&lang=11"
        width="100%"
        height="660"
        frameBorder="0"
        marginWidth={0}
        marginHeight={0}
        className="block border-0"
      />
      <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-500">
        金融ポータルサイト、
        <a
          href="https://jp.investing.com/"
          rel="nofollow noopener noreferrer"
          target="_blank"
          className="font-semibold text-cyan-200"
        >
          Investing.com 日本
        </a>
        によって提供されている経済カレンダーです。
      </div>
    </div>
  </section>
);

export const GapWatchTool = ({ prices }: RelatedToolsProps) => (
  <section id="tools-gap-watch" className="scroll-mt-8">
    <div className="mb-4">
      <p className="text-sm font-semibold text-cyan-200">Gap watch</p>
      <h2 className="mt-1 text-2xl font-bold text-white">窓開け監視ボード</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        約24時間前価格と現在のHyperliquid
        perp価格を並べ、月曜オープン前のギャップ警戒度を確認します。
      </p>
    </div>

    <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-900/80">
      <table className="min-w-[760px] w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">銘柄</th>
            <th className="px-4 py-3 text-right">現在値</th>
            <th className="px-4 py-3 text-right">約24時間前</th>
            <th className="px-4 py-3 text-right">変動率</th>
            <th className="px-4 py-3">警戒度</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {WEEKEND_MARKETS.map((market) => {
            const price = prices[market.symbol];
            const changePct = price?.changePct ?? null;
            const absChange = Math.abs(changePct ?? 0);
            const alertLabel =
              changePct === null
                ? '未取得'
                : absChange >= 1
                  ? '高'
                  : absChange >= 0.35
                    ? '中'
                    : '低';
            const alertClass =
              alertLabel === '高'
                ? 'bg-rose-400/15 text-rose-200 ring-rose-300/30'
                : alertLabel === '中'
                  ? 'bg-amber-400/15 text-amber-200 ring-amber-300/30'
                  : 'bg-slate-400/15 text-slate-200 ring-slate-300/30';

            return (
              <tr key={market.symbol}>
                <td className="px-4 py-4">
                  <p className="font-semibold text-white">{market.displayName}</p>
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

export const EaChecklistTool = () => {
  const checklist = [
    '指標発表時刻と週明け流動性を確認した',
    '稼働するEAの対象銘柄とスプレッド条件を確認した',
    '最大ロット、最大ポジション数、損切り条件を確認した',
    'VPSまたはPCの稼働状態、回線、口座ログインを確認した',
    '異常値動き時に手動停止できる手順を確認した',
    '半裁量EAの場合、エントリー許可・停止の判断基準を決めた',
  ];

  return (
    <section id="tools-ea-checklist" className="scroll-mt-8">
      <div className="mb-4">
        <p className="text-sm font-semibold text-cyan-200">EA checklist</p>
        <h2 className="mt-1 text-2xl font-bold text-white">EA運用チェックリスト</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          半裁量EA・全自動EAを動かす前に、相場環境と運用条件を確認するための簡易チェックです。
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {checklist.map((item) => (
          <label
            key={item}
            className="flex min-h-16 items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 accent-cyan-300"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </section>
  );
};
