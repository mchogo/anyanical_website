import { useEffect, useRef, useState } from 'react';

import { MARKETS, type MarketPrice } from '../config/markets';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type AllMidsMessage = {
  channel?: string;
  data?: {
    mids?: Record<string, string>;
  };
};

type MetaAndAssetCtxsResponse = [
  {
    universe?: Array<{
      name: string;
    }>;
  },
  Array<{
    prevDayPx?: string | number | null;
  }>,
];

const HYPERLIQUID_WS_URL = 'wss://api.hyperliquid.xyz/ws';
const HYPERLIQUID_INFO_URL = 'https://api.hyperliquid.xyz/info';
const RECONNECT_DELAY_MS = 3_000;
const ALL_MIDS_SUBSCRIPTIONS = [{ type: 'allMids' }, { type: 'allMids', dex: 'xyz' }];

const createInitialPrices = (): Record<string, MarketPrice> =>
  Object.fromEntries(
    MARKETS.map((market) => [
      market.symbol,
      {
        symbol: market.symbol,
        activeSymbol: null,
        price: null,
        comparisonPrice: null,
        change: null,
        changePct: null,
        updatedAt: null,
      },
    ]),
  );

const calculatePriceSnapshot = (
  symbol: string,
  price: number,
  previous: MarketPrice | undefined,
  activeSymbol: string,
  updatedAt: number,
): MarketPrice => {
  const comparisonPrice = previous?.comparisonPrice ?? price;
  const change = price - comparisonPrice;
  const changePct = comparisonPrice === 0 ? 0 : (change / comparisonPrice) * 100;

  return {
    symbol,
    activeSymbol,
    price,
    comparisonPrice,
    change,
    changePct,
    updatedAt,
  };
};

const fetchMetaAndAssetCtxs = async (dex?: string) => {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'metaAndAssetCtxs',
      ...(dex ? { dex } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Hyperliquid market contexts');
  }

  return (await response.json()) as MetaAndAssetCtxsResponse;
};

const toPreviousDayPriceMap = ([meta, contexts]: MetaAndAssetCtxsResponse) => {
  const priceBySymbol: Record<string, number> = {};

  for (const [index, asset] of meta.universe?.entries() ?? []) {
    const rawPreviousDayPrice = contexts[index]?.prevDayPx;
    const previousDayPrice = Number(rawPreviousDayPrice);

    if (Number.isFinite(previousDayPrice)) {
      priceBySymbol[asset.name] = previousDayPrice;
    }
  }

  return priceBySymbol;
};

const findComparisonPriceForMarket = (
  priceBySymbol: Record<string, number>,
  symbolCandidates: string[],
) => {
  for (const symbolCandidate of symbolCandidates) {
    const comparisonPrice = priceBySymbol[symbolCandidate];
    if (comparisonPrice !== undefined) {
      return comparisonPrice;
    }
  }

  return null;
};

const findMidForMarket = (mids: Record<string, string>, symbolCandidates: string[]) => {
  for (const symbolCandidate of symbolCandidates) {
    const rawPrice = mids[symbolCandidate];
    if (rawPrice !== undefined) {
      return {
        activeSymbol: symbolCandidate,
        rawPrice,
      };
    }
  }

  return null;
};

export const useHyperliquidMids = () => {
  const [prices, setPrices] = useState<Record<string, MarketPrice>>(createInitialPrices);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');
  const [tickCount, setTickCount] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const reconnectTimerRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    const loadComparisonPrices = async () => {
      try {
        const [defaultContexts, xyzContexts] = await Promise.all([
          fetchMetaAndAssetCtxs(),
          fetchMetaAndAssetCtxs('xyz'),
        ]);
        const comparisonBySymbol = {
          ...toPreviousDayPriceMap(defaultContexts),
          ...toPreviousDayPriceMap(xyzContexts),
        };

        setPrices((currentPrices) => {
          const nextPrices = { ...currentPrices };

          for (const market of MARKETS) {
            const comparisonPrice = findComparisonPriceForMarket(
              comparisonBySymbol,
              market.symbolCandidates,
            );

            if (comparisonPrice === null) {
              continue;
            }

            nextPrices[market.symbol] = {
              ...currentPrices[market.symbol],
              comparisonPrice,
            };
          }

          return nextPrices;
        });
      } catch {
        // Live mids still work without prevDayPx; the first live price becomes the fallback baseline.
      }
    };

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      clearReconnectTimer();
      setConnectionStatus('connecting');

      const socket = new WebSocket(HYPERLIQUID_WS_URL);
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        setConnectionStatus('connected');

        for (const subscription of ALL_MIDS_SUBSCRIPTIONS) {
          socket.send(
            JSON.stringify({
              method: 'subscribe',
              subscription,
            }),
          );
        }
      });

      socket.addEventListener('message', (event: MessageEvent<string>) => {
        try {
          const message = JSON.parse(event.data) as AllMidsMessage;

          if (message.channel !== 'allMids' || !message.data?.mids) {
            return;
          }

          const receivedAt = Date.now();
          const mids = message.data.mids;

          setPrices((currentPrices) => {
            const nextPrices = { ...currentPrices };

            for (const market of MARKETS) {
              const mid = findMidForMarket(mids, market.symbolCandidates);
              if (mid === null) {
                continue;
              }

              const parsedPrice = Number(mid.rawPrice);
              if (!Number.isFinite(parsedPrice)) {
                continue;
              }

              nextPrices[market.symbol] = calculatePriceSnapshot(
                market.symbol,
                parsedPrice,
                currentPrices[market.symbol],
                mid.activeSymbol,
                receivedAt,
              );
            }

            return nextPrices;
          });

          setTickCount((count) => count + 1);
          setLastUpdatedAt(receivedAt);
        } catch {
          setConnectionStatus('error');
        }
      });

      socket.addEventListener('error', () => {
        setConnectionStatus('error');
      });

      socket.addEventListener('close', () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (!shouldReconnectRef.current) {
          setConnectionStatus('disconnected');
          return;
        }

        setConnectionStatus('disconnected');
        reconnectTimerRef.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
      });
    };

    shouldReconnectRef.current = true;
    void loadComparisonPrices();
    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  return {
    prices,
    connectionStatus,
    tickCount,
    lastUpdatedAt,
  };
};
