import { useEffect, useRef, useState } from 'react';

import { DEFAULT_META, ROUTE_META, SITE_URL } from './config/pageMeta';
import { FavoritesContext, useFavorites, useFavoritesContext } from './hooks/useFavorites';
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

const BoardFavButton = () => {
  const { favorites, canAccessPremium, isAuthenticated, toggleFavorite } = useFavoritesContext();
  const [showUpsell, setShowUpsell] = useState(false);
  const route = 'board';
  const isFav = favorites.includes(route);

  const handleClick = () => {
    if (canAccessPremium) {
      toggleFavorite(route);
    } else {
      setShowUpsell(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
        className={`shrink-0 grid h-10 w-10 place-items-center rounded-full text-xl ring-1 transition ${
          isFav
            ? 'bg-amber-300/20 text-amber-300 ring-amber-300/40 hover:bg-amber-300/10'
            : 'bg-white/[0.04] text-slate-600 ring-white/10 hover:bg-amber-300/10 hover:text-amber-300'
        }`}
      >
        {isFav ? '★' : '☆'}
      </button>
      {showUpsell && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm"
          onClick={() => setShowUpsell(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-amber-300/30 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-amber-100">Premium feature</p>
            <h3 className="mt-1 text-xl font-bold text-white">お気に入りはプレミアム限定です</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              よく使うページを登録してナビバーからすぐアクセスできます。プレミアム会員向け機能です。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#/tools/participation"
                onClick={() => setShowUpsell(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
              >
                プレミアム内容を見る
              </a>
              {!isAuthenticated && (
                <a
                  href="#/login"
                  onClick={() => setShowUpsell(false)}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-indigo-400 px-4 text-sm font-bold text-white transition hover:bg-indigo-300"
                >
                  Discordログイン
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowUpsell(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 text-sm font-bold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
  'member-dashboard',
  'daily-mission',
  'gap-prediction',
];

const categoryPageIds: CategoryPageId[] = ['market', 'games', 'ea-copytrade', 'premium'];
const MISSION_RETURN_STORAGE_KEY = 'wmb.returnToMission';

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
  const [routeHistory, setRouteHistory] = useState<string[]>(() => [getRoute()]);
  const skipNextHistoryPush = useRef(false);
  const [showMissionReturn, setShowMissionReturn] = useState(
    () =>
      window.sessionStorage.getItem(MISSION_RETURN_STORAGE_KEY) === '1' &&
      getRoute() !== 'tools/daily-mission',
  );
  const favoritesCtx = useFavorites(discordAuth.session, discordAuth.canAccessPremium, discordAuth.isAuthenticated);
  const isWeekendMode = isWeekendModeInJst(now);
  const toolPageId = parseToolPageId(route);
  const categoryPageId = parseCategoryPageId(route);
  const isHomeRoute = route === '' || route === 'home';
  const isBoardRoute = route === 'board';
  const isSpaceXRoute = route === 'spacex';
  const isLoginRoute = route === 'login';
  const isDiscordCallbackRoute = isDiscordOAuthRedirect(route);

  useEffect(() => {
    const meta = ROUTE_META[route] ?? DEFAULT_META;
    document.title = meta.title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr.split('=')[0], attr.split('=')[1] ?? '');
        document.head.appendChild(el);
      }
      el.content = value;
    };

    const pageUrl = `${SITE_URL}/#/${route}`;
    setMeta('meta[name="description"]', 'name=description', meta.description);
    setMeta('meta[property="og:title"]', 'property=og:title', meta.title);
    setMeta('meta[property="og:description"]', 'property=og:description', meta.description);
    setMeta('meta[property="og:url"]', 'property=og:url', pageUrl);
    setMeta('meta[name="twitter:title"]', 'name=twitter:title', meta.title);
    setMeta('meta[name="twitter:description"]', 'name=twitter:description', meta.description);
    setMeta('meta[name="twitter:url"]', 'name=twitter:url', pageUrl);
  }, [route]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const canGoBack = routeHistory.length > 1;

  const goBack = () => {
    if (!canGoBack) return;
    const newHistory = routeHistory.slice(0, -1);
    setRouteHistory(newHistory);
    skipNextHistoryPush.current = true;
    const prevRoute = newHistory[newHistory.length - 1];
    window.location.hash = prevRoute ? `#/${prevRoute}` : '#/';
  };

  useEffect(() => {
    const handleHashChange = () => {
      const nextRoute = getRoute();
      setRoute(nextRoute);
      if (!skipNextHistoryPush.current) {
        setRouteHistory((prev) => [...prev, nextRoute]);
      }
      skipNextHistoryPush.current = false;
      setShowMissionReturn(
        window.sessionStorage.getItem(MISSION_RETURN_STORAGE_KEY) === '1' &&
          nextRoute !== 'tools/daily-mission',
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <FavoritesContext.Provider value={favoritesCtx}>
    <div className="min-h-screen bg-slate-950 pt-16 text-slate-100">
      <FloatingNav currentRoute={route} auth={discordAuth} />
      <SpaceXBanner />
      <NewFeaturesTicker />
      <div key={route} className="animate-fade-in">
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
          canAccessPremium={discordAuth.canAccessPremium}
        />
      ) : isBoardRoute ? (
        <main>
          <Header
            connectionStatus={connectionStatus}
            tickCount={tickCount}
            lastUpdatedAt={lastUpdatedAt}
            currentTime={new Date(now)}
            isWeekendMode={isWeekendMode}
            favButton={<BoardFavButton />}
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
      </div>
      <AlertToasts
        notifications={notifications}
        dismissNotification={dismissNotification}
      />
      {canGoBack && !isHomeRoute && !showMissionReturn && (
        <button
          onClick={goBack}
          className="fixed bottom-20 left-1/2 z-[60] inline-flex min-h-11 -translate-x-1/2 items-center justify-center rounded-full bg-slate-700 px-5 text-sm font-black text-white shadow-[0_16px_50px_rgba(0,0,0,0.4)] transition hover:bg-slate-600 animate-slide-up sm:bottom-4"
        >
          ← 前のページ
        </button>
      )}
      {showMissionReturn && (
        <a
          href="#/tools/daily-mission"
          onClick={() => {
            window.sessionStorage.removeItem(MISSION_RETURN_STORAGE_KEY);
            setShowMissionReturn(false);
          }}
          className="fixed bottom-20 left-1/2 z-[60] inline-flex min-h-11 -translate-x-1/2 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-black text-slate-950 shadow-[0_16px_50px_rgba(34,211,238,0.22)] transition hover:bg-cyan-200 sm:bottom-4"
        >
          ミッションに戻る
        </a>
      )}
      <AnyaAiAssistant />
    </div>
    </FavoritesContext.Provider>
  );
};
