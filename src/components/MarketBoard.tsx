import {
  CRYPTO_MARKETS,
  FOREX_MARKETS,
  WEEKEND_MARKETS,
  type MarketPrice,
} from '../config/markets';
import { MarketCard } from './MarketCard';
import { FridayCloseReferences } from './FridayCloseReferences';

type MarketBoardProps = {
  prices: Record<string, MarketPrice>;
  now: number;
  isWeekendMode: boolean;
};

export const MarketBoard = ({ prices, now, isWeekendMode }: MarketBoardProps) => (
  <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold text-cyan-200">Weekend mode</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Hyperliquid allMids</h2>
      </div>
      <p className="text-sm text-slate-400">
        週末ニュースで公式市場が休場中に動いた実取引perp価格を確認します。
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {WEEKEND_MARKETS.map((market) => (
        <MarketCard
          key={market.symbol}
          market={market}
          price={prices[market.symbol]}
          now={now}
        />
      ))}
    </div>

    <div className="mt-10">
      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-200">Crypto reference</p>
          <h2 className="mt-1 text-2xl font-bold text-white">24/7 crypto perps</h2>
        </div>
        <p className="text-sm text-slate-400">
          BTC/ETH/HYPEはリスクオン・オフの補助指標として表示します。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CRYPTO_MARKETS.map((market) => (
          <MarketCard
            key={market.symbol}
            market={market}
            price={prices[market.symbol]}
            now={now}
          />
        ))}
      </div>
    </div>

    <div className="mt-10">
      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-200">FX reference</p>
          <h2 className="mt-1 text-2xl font-bold text-white">為替 24/7 perps</h2>
        </div>
        <p className="text-sm text-slate-400">
          ユーロ・ポンド・ウォンの週末反応を補助的に確認します。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {FOREX_MARKETS.map((market) => (
          <MarketCard
            key={market.symbol}
            market={market}
            price={prices[market.symbol]}
            now={now}
          />
        ))}
      </div>
    </div>

    {isWeekendMode ? <FridayCloseReferences prices={prices} /> : null}
  </section>
);
