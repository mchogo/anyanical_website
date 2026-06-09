import { useEffect, useState } from 'react';

import { ChartSection } from './components/ChartSection';
import { Disclaimer } from './components/Disclaimer';
import { ExplainerSections } from './components/ExplainerSections';
import { AlertToasts } from './components/AlertToasts';
import { FloatingNav } from './components/FloatingNav';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { MarketBoard } from './components/MarketBoard';
import { NewFeaturesTicker } from './components/NewFeaturesTicker';
import { SpaceXBanner } from './components/SpaceXBanner';
import { SpaceXCountdownPage } from './components/SpaceXCountdownPage';
import { ToolPage, type ToolPageId } from './components/ToolPage';
import { useAlerts } from './hooks/useAlerts';
import { useHyperliquidMids } from './hooks/useHyperliquidMids';

const isWeekendModeInJst = (timestamp: number) => {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
  }).format(timestamp);

  return weekday === 'Sat' || weekday === 'Sun';
};

const toolPageIds: ToolPageId[] = [
  'currency-strength',
  'economic-calendar',
  'gap-watch',
  'ea-checklist',
  'strategy',
  'community',
  'participation',
  'semi-auto-sign',
];

const getRoute = () => window.location.hash.replace(/^#\/?/, '');

const parseToolPageId = (route: string): ToolPageId | null => {
  const match = route.match(/^tools\/([^/]+)$/);
  const pageId = match?.[1];

  if (toolPageIds.includes(pageId as ToolPageId)) {
    return pageId as ToolPageId;
  }

  return null;
};

export const App = () => {
  const { prices, priceHistory, connectionStatus, tickCount, lastUpdatedAt } =
    useHyperliquidMids();
  const {
    alerts,
    notifications,
    addAlert,
    removeAlert,
    dismissNotification,
    requestPermission,
    permissionStatus,
  } = useAlerts(prices);
  const [now, setNow] = useState(() => Date.now());
  const [route, setRoute] = useState(getRoute);
  const isWeekendMode = isWeekendModeInJst(now);
  const toolPageId = parseToolPageId(route);
  const isHomeRoute = route === '' || route === 'home';
  const isBoardRoute = route === 'board';
  const isSpaceXRoute = route === 'spacex';

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRoute());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 pt-16 text-slate-100">
      <FloatingNav currentRoute={route} />
      <SpaceXBanner />
      <NewFeaturesTicker />
      {isSpaceXRoute ? (
        <SpaceXCountdownPage />
      ) : isHomeRoute ? (
        <HomePage
          prices={prices}
          priceHistory={priceHistory}
          connectionStatus={connectionStatus}
          lastUpdatedAt={lastUpdatedAt}
          isWeekendMode={isWeekendMode}
        />
      ) : toolPageId ? (
        <ToolPage
          pageId={toolPageId}
          prices={prices}
          priceHistory={priceHistory}
          isWeekendMode={isWeekendMode}
        />
      ) : isBoardRoute ? (
        <main>
          <Header
            connectionStatus={connectionStatus}
            tickCount={tickCount}
            lastUpdatedAt={lastUpdatedAt}
            currentTime={new Date(now)}
            isWeekendMode={isWeekendMode}
          />
          <MarketBoard
            prices={prices}
            priceHistory={priceHistory}
            now={now}
            isWeekendMode={isWeekendMode}
            alerts={alerts}
            addAlert={addAlert}
            removeAlert={removeAlert}
            requestPermission={requestPermission}
            permissionStatus={permissionStatus}
          />
          <ChartSection />
          <ExplainerSections />
          <Disclaimer />
        </main>
      ) : (
        <HomePage
          prices={prices}
          priceHistory={priceHistory}
          connectionStatus={connectionStatus}
          lastUpdatedAt={lastUpdatedAt}
          isWeekendMode={isWeekendMode}
        />
      )}
      <AlertToasts
        notifications={notifications}
        dismissNotification={dismissNotification}
      />
    </div>
  );
};
