import { useEffect, useRef, useState } from 'react';

import { MARKETS, type MarketPrice } from '../config/markets';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type AllMidsMessage = {
  channel?: string;
  data?: {
    mids?: Record<string, string>;
  };
};

export type PriceHistoryPoint = {
  time: number;
  price: number;
};

type CandleSnapshotResponse = Array<{
  t?: number;
  T?: number;
  c?: string | number;
}>;

const HYPERLIQUID_WS_URL = 'wss://api.hyperliquid.xyz/ws';
const HYPERLIQUID_INFO_URL = 'https://api.hyperliquid.xyz/info';
const RECONNECT_DELAY_MS = 3_000;
const HISTORY_LOOKBACK_MS = 6 * 60 * 60 * 1_000;
const LIVE_HISTORY_SAMPLE_MS = 5 * 60 * 1_000;
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

const toFiniteNumber = (value: string | number | null | undefined) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

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

const fetchCandleSnapshot = async (coin: string, startTime: number, endTime: number) => {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'candleSnapshot',
      req: {
        coin,
        interval: '15m',
        startTime,
        endTime,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Hyperliquid candle snapshot');
  }

  return (await response.json()) as CandleSnapshotResponse;
};

const toHistoryPoints = (candles: CandleSnapshotResponse) =>
  candles
    .map((candle) => {
      const time = Number(candle.t ?? candle.T);
      const price = toFiniteNumber(candle.c);

      if (!Number.isFinite(time) || price === null) {
        return null;
      }

      return {
        time,
        price,
      };
    })
    .filter((point): point is PriceHistoryPoint => point !== null)
    .sort((left, right) => left.time - right.time);

const getLastFridayCloseTime = (
  now: number,
  marketCloseUtc = { hour: 21, minute: 0 },
) => {
  const nowDate = new Date(now);
  const utcMidnight = Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate(),
  );
  const daysFromFriday = new Date(utcMidnight).getUTCDay() - 5;
  const fridayMidnight = utcMidnight - daysFromFriday * 24 * 60 * 60 * 1_000;
  let fridayCloseTime =
    fridayMidnight +
    marketCloseUtc.hour * 60 * 60 * 1_000 +
    marketCloseUtc.minute * 60 * 1_000;

  if (fridayCloseTime > now) {
    fridayCloseTime -= 7 * 24 * 60 * 60 * 1_000;
  }

  return fridayCloseTime;
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
  const [priceHistory, setPriceHistory] = useState<Record<string, PriceHistoryPoint[]>>(
    {},
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');
  const [tickCount, setTickCount] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const reconnectTimerRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    const loadFridayClosePrices = async () => {
      const now = Date.now();
      const comparisonEntries = await Promise.allSettled(
        MARKETS.map(async (market) => {
          const fridayCloseTime = getLastFridayCloseTime(now, market.fridayCloseUtc);
          const startTime = fridayCloseTime - 3 * 60 * 60 * 1_000;
          const endTime = fridayCloseTime + 15 * 60 * 1_000;

          for (const symbolCandidate of market.symbolCandidates) {
            try {
              const candles = await fetchCandleSnapshot(
                symbolCandidate,
                startTime,
                endTime,
              );
              const historyPoints = toHistoryPoints(candles);
              const closePoint =
                historyPoints.filter((point) => point.time < fridayCloseTime).at(-1) ??
                historyPoints.at(-1);

              if (closePoint !== undefined) {
                return [market.symbol, closePoint.price] as const;
              }
            } catch {
              // Try the next symbol candidate. Some symbols may not expose candles.
            }
          }

          return [market.symbol, null] as const;
        }),
      );

      setPrices((currentPrices) => {
        const nextPrices = { ...currentPrices };

        for (const entry of comparisonEntries) {
          if (entry.status !== 'fulfilled') {
            continue;
          }

          const [symbol, comparisonPrice] = entry.value;
          if (comparisonPrice === null) {
            continue;
          }

          nextPrices[symbol] = {
            ...currentPrices[symbol],
            comparisonPrice,
          };
        }

        return nextPrices;
      });
    };

    const loadHistoricalPrices = async () => {
      const endTime = Date.now();
      const startTime = endTime - HISTORY_LOOKBACK_MS;
      const historyEntries = await Promise.allSettled(
        MARKETS.map(async (market) => {
          for (const symbolCandidate of market.symbolCandidates) {
            try {
              const candles = await fetchCandleSnapshot(
                symbolCandidate,
                startTime,
                endTime,
              );
              const historyPoints = toHistoryPoints(candles);

              if (historyPoints.length > 0) {
                return [market.symbol, historyPoints] as const;
              }
            } catch {
              // Try the next symbol candidate. Some HIP-3 aliases do not expose candles.
            }
          }

          return [market.symbol, [] as PriceHistoryPoint[]] as const;
        }),
      );

      const nextHistory: Record<string, PriceHistoryPoint[]> = {};

      for (const entry of historyEntries) {
        if (entry.status === 'fulfilled') {
          const [symbol, historyPoints] = entry.value;
          nextHistory[symbol] = historyPoints;
        }
      }

      setPriceHistory((currentHistory) => ({
        ...currentHistory,
        ...nextHistory,
      }));
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
            const nextHistoryUpdates: Record<string, PriceHistoryPoint> = {};

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
              nextHistoryUpdates[market.symbol] = {
                time: receivedAt,
                price: parsedPrice,
              };
            }

            if (Object.keys(nextHistoryUpdates).length > 0) {
              setPriceHistory((currentHistory) => {
                const nextHistory = { ...currentHistory };

                for (const [symbol, historyPoint] of Object.entries(nextHistoryUpdates)) {
                  const previousHistory = nextHistory[symbol] ?? [];
                  const lastPoint = previousHistory[previousHistory.length - 1];

                  if (
                    lastPoint !== undefined &&
                    historyPoint.time - lastPoint.time < LIVE_HISTORY_SAMPLE_MS
                  ) {
                    nextHistory[symbol] = previousHistory;
                    continue;
                  }

                  nextHistory[symbol] = [...previousHistory, historyPoint].filter(
                    (point) => historyPoint.time - point.time <= HISTORY_LOOKBACK_MS,
                  );
                }

                return nextHistory;
              });
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
    void loadFridayClosePrices();
    void loadHistoricalPrices();
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
    priceHistory,
    connectionStatus,
    tickCount,
    lastUpdatedAt,
  };
};
