import { useEffect, useState } from 'react';

import { ChartSection } from './components/ChartSection';
import { Disclaimer } from './components/Disclaimer';
import { ExplainerSections } from './components/ExplainerSections';
import { AnyaAiAssistant } from './components/AnyaAiAssistant';
import { AlertToasts } from './components/AlertToasts';
import { CategoryPage, type CategoryPageId } from './components/CategoryPage';
import { FloatingNav } from './components/FloatingNav';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { MarketBoard } from './components/MarketBoard';
import { NewFeaturesTicker } from './components/NewFeaturesTicker';
import { SpaceXBanner } from './components/SpaceXBanner';
import { SpaceXCountdownPage } from './components/SpaceXCountdownPage';
import { ToolPage, type ToolPageId } from './components/ToolPage';
import { useAlerts } from './hooks/useAlerts';
import { isDiscordOAuthRedirect, useDiscordAuth } from './hooks/useDiscordAuth';
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
  'copytrade',
  'community',
  'participation',
  'semi-auto-sign',
  'trade-journal',
  'trader-quiz',
];

const categoryPageIds: CategoryPageId[] = ['market', 'ea-copytrade', 'premium'];

const getRoute = () => window.location.hash.replace(/^#\/?/, '');

const parseToolPageId = (route: string): ToolPageId | null => {
  const match = route.match(/^tools\/([^/]+)$/);
  const pageId = match?.[1];

  if (toolPageIds.includes(pageId as ToolPageId)) {
    return pageId as ToolPageId;
  }

  return null;
};

const parseCategoryPageId = (route: string): CategoryPageId | null => {
  if (categoryPageIds.includes(route as CategoryPageId)) {
    return route as CategoryPageId;
  }
  return null;
};

export const App = () => {
  const discordAuth = useDiscordAuth();
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
  const categoryPageId = parseCategoryPageId(route);
  const isHomeRoute = route === '' || route === 'home';
  const isBoardRoute = route === 'board';
  const isSpaceXRoute = route === 'spacex';
  const isLoginRoute = route === 'login';
  const isDiscordCallbackRoute = isDiscordOAuthRedirect(route);

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
      <FloatingNav currentRoute={route} auth={discordAuth} />
      <SpaceXBanner />
      <NewFeaturesTicker />
      {isLoginRoute || isDiscordCallbackRoute ? (
        <LoginPage auth={discordAuth} isCallbackRoute={isDiscordCallbackRoute} />
      ) : isSpaceXRoute ? (
        <SpaceXCountdownPage
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
      ) : isHomeRoute ? (
        <HomePage
          prices={prices}
          priceHistory={priceHistory}
          connectionStatus={connectionStatus}
          lastUpdatedAt={lastUpdatedAt}
          isWeekendMode={isWeekendMode}
        />
      ) : categoryPageId ? (
        <CategoryPage pageId={categoryPageId} />
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
      <AnyaAiAssistant />
    </div>
  );
};
