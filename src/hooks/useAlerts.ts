import { useEffect, useMemo, useState } from 'react';

import { MARKETS, type MarketPrice } from '../config/markets';

export type AlertCondition = 'above' | 'below';

export type Alert = {
  id: string;
  symbol: string;
  condition: AlertCondition;
  threshold: number;
  fired: boolean;
  createdAt: number;
};

export type NotificationPermissionStatus = NotificationPermission | 'unsupported';

export type AlertNotification = {
  id: string;
  message: string;
  createdAt: number;
};

const ALERT_STORAGE_KEY = 'weekend-market-board:alerts';

const isAlertCondition = (value: unknown): value is AlertCondition =>
  value === 'above' || value === 'below';

const isAlert = (value: unknown): value is Alert => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const maybeAlert = value as Record<string, unknown>;

  return (
    typeof maybeAlert.id === 'string' &&
    typeof maybeAlert.symbol === 'string' &&
    isAlertCondition(maybeAlert.condition) &&
    typeof maybeAlert.threshold === 'number' &&
    Number.isFinite(maybeAlert.threshold) &&
    typeof maybeAlert.fired === 'boolean' &&
    typeof maybeAlert.createdAt === 'number'
  );
};

const loadStoredAlerts = () => {
  try {
    const storedValue = window.localStorage.getItem(ALERT_STORAGE_KEY);
    if (storedValue === null) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue) as unknown;
    return Array.isArray(parsedValue) ? parsedValue.filter(isAlert) : [];
  } catch {
    return [];
  }
};

const createAlertId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatAlertPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
  }).format(price);

export const useAlerts = (prices: Record<string, MarketPrice>) => {
  const [alerts, setAlerts] = useState<Alert[]>(loadStoredAlerts);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(
    () => ('Notification' in window ? Notification.permission : 'unsupported'),
  );

  const marketBySymbol = useMemo(
    () => new Map(MARKETS.map((market) => [market.symbol, market])),
    [],
  );

  useEffect(() => {
    window.localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    const triggeredAlerts = alerts
      .filter((alert) => {
        if (alert.fired) {
          return false;
        }

        const currentPrice = prices[alert.symbol]?.price;
        if (currentPrice === null || currentPrice === undefined) {
          return false;
        }

        return alert.condition === 'above'
          ? currentPrice >= alert.threshold
          : currentPrice <= alert.threshold;
      })
      .map((alert) => {
        const currentPrice = prices[alert.symbol]?.price;
        const displayName = marketBySymbol.get(alert.symbol)?.displayName ?? alert.symbol;
        const message = `${displayName} が ${formatAlertPrice(currentPrice ?? alert.threshold)} に到達しました`;

        return {
          alert,
          message,
        };
      });

    if (triggeredAlerts.length === 0) {
      return;
    }

    if (permissionStatus === 'granted') {
      for (const { message } of triggeredAlerts) {
        new Notification('価格アラート', {
          body: message,
        });
      }
    }

    const firedAlertIds = new Set(triggeredAlerts.map(({ alert }) => alert.id));

    setNotifications((currentNotifications) =>
      [
        ...triggeredAlerts.map(({ alert, message }) => ({
          id: `${alert.id}-${Date.now()}`,
          message,
          createdAt: Date.now(),
        })),
        ...currentNotifications,
      ].slice(0, 5),
    );

    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) =>
        firedAlertIds.has(alert.id)
          ? {
              ...alert,
              fired: true,
            }
          : alert,
      ),
    );
  }, [alerts, marketBySymbol, permissionStatus, prices]);

  const addAlert = (symbol: string, condition: AlertCondition, threshold: number) => {
    if (!Number.isFinite(threshold)) {
      return;
    }

    setAlerts((currentAlerts) => [
      ...currentAlerts,
      {
        id: createAlertId(),
        symbol,
        condition,
        threshold,
        fired: false,
        createdAt: Date.now(),
      },
    ]);
  };

  const removeAlert = (alertId: string) => {
    setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== alertId));
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId),
    );
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported');
      return;
    }

    const nextPermissionStatus = await Notification.requestPermission();
    setPermissionStatus(nextPermissionStatus);
  };

  return {
    alerts,
    notifications,
    addAlert,
    removeAlert,
    dismissNotification,
    requestPermission,
    permissionStatus,
  };
};
