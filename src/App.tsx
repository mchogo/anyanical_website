import { useEffect, useRef, useState } from 'react';

import { DEFAULT_META, ROUTE_META, SITE_URL } from './config/pageMeta';
import {
  FavoritesContext,
  useFavorites,
  useFavoritesContext,
} from './hooks/useFavorites';
import { ChartSection } from './components/ChartSection';
import { Disclaimer } from './components/Disclaimer';
import { ExplainerSections } from './components/ExplainerSections';
import { AnyaAiAssistant } from './components/AnyaAiAssistant';
import { AnyaAiGuidePage } from './components/AnyaAiGuidePage';
import { AlertToasts } from './components/AlertToasts';
import { AnnouncementBar } from './components/AnnouncementBar';
import { CategoryPage, type CategoryPageId } from './components/CategoryPage';
import { FavoriteSaveStatus } from './components/common/FavoriteSaveStatus';
import { FavoriteUpsellDialog } from './components/common/FavoriteUpsellDialog';
import { FloatingNav } from './components/FloatingNav';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { LinkHubPage } from './components/LinkHubPage';
import { LoginPage } from './components/LoginPage';
import { MarketBoard } from './components/MarketBoard';
import { MatomeArchivePage } from './components/MatomeArchivePage';
import { MatomeEntryPage } from './components/MatomeEntryPage';
import { MatomePage } from './components/MatomePage';
import { SpaceXCountdownPage } from './components/SpaceXCountdownPage';
import { AdminPage } from './components/AdminPage';
import { ToolPage, type ToolPageId } from './components/ToolPage';
import { TOOL_PAGE_IDS } from './config/toolPages';
import { useAlerts } from './hooks/useAlerts';
import { isDiscordOAuthRedirect, useDiscordAuth } from './hooks/useDiscordAuth';
import { useHyperliquidMids } from './hooks/useHyperliquidMids';

const BoardFavButton = () => {
  const {
    favorites,
    canAccessPremium,
    isAuthenticated,
    toggleFavorite,
    saveError,
    statusMessage,
    retry,
  } = useFavoritesContext();
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
      <FavoriteSaveStatus
        saveError={saveError}
        statusMessage={statusMessage}
        onRetry={retry}
      />
      <FavoriteUpsellDialog
        open={showUpsell}
        onClose={() => setShowUpsell(false)}
        isAuthenticated={isAuthenticated}
      />
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

const toolPageIds: ToolPageId[] = TOOL_PAGE_IDS;

const categoryPageIds: CategoryPageId[] = ['market', 'games', 'ea-copytrade', 'premium'];
const MISSION_RETURN_STORAGE_KEY = 'wmb.returnToMission';

const getRoute = () => window.location.hash.replace(/^#\/?/, '');

type WmbHistoryState = { wmbDepth: number } | null;

const readWmbHistoryDepth = (): number => {
  const state = window.history.state as WmbHistoryState;
  return typeof state?.wmbDepth === 'number' ? state.wmbDepth : 0;
};

const parseToolPageId = (route: string): ToolPageId | null => {
  // ルートに?tf=H4のようなクエリが付くページ（htf-context等）があるため、
  // パス部分だけを取り出してからマッチする。
  const [pathPart] = route.split('?');
  const match = pathPart.match(/^tools\/([^/]+)$/);
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

const parseMatomeArchiveYm = (route: string): string | null => {
  const match = route.match(/^matome\/archive\/(\d{4}-\d{2})$/);
  return match?.[1] ?? null;
};

const parseMatomeEntryId = (route: string): string | null => {
  const match = route.match(/^matome\/([^/]+)$/);
  if (!match?.[1] || match[1] === 'archive') return null;
  return decodeURIComponent(match[1]);
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
  const currentRouteRef = useRef(route);
  // 実際のブラウザ履歴(history.state)に深さを持たせ、独自の履歴配列を
  // 二重管理しない。ブラウザの戻る/進むボタンと「← 前のページ」ボタンが
  // 同じ history スタックを操作するため、挙動が食い違わない。
  const historyDepthRef = useRef(readWmbHistoryDepth());
  const [canGoBack, setCanGoBack] = useState(() => historyDepthRef.current > 0);
  // ルートごとのスクロール位置。戻る/進むで既に訪れたルートに戻った時だけ
  // 復元し、新規のリンク遷移では先頭にスクロールする。
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const [showMissionReturn, setShowMissionReturn] = useState(
    () =>
      window.sessionStorage.getItem(MISSION_RETURN_STORAGE_KEY) === '1' &&
      getRoute() !== 'tools/daily-mission',
  );
  const favoritesCtx = useFavorites(
    discordAuth.session,
    discordAuth.canAccessPremium,
    discordAuth.isAuthenticated,
  );
  const isWeekendMode = isWeekendModeInJst(now);
  const toolPageId = parseToolPageId(route);
  const categoryPageId = parseCategoryPageId(route);
  const isHomeRoute = route === '' || route === 'home';
  const isBoardRoute = route === 'board';
  const isSpaceXRoute = route === 'spacex';
  const isLoginRoute = route === 'login';
  const isAdminRoute = route === 'admin';
  const isAnyaAiRoute = route === 'anya-ai';
  const isLinkHubRoute = route === 'link';
  const isMatomeRoute = route === 'matome';
  const matomeArchiveYm = parseMatomeArchiveYm(route);
  const matomeEntryId = parseMatomeEntryId(route);
  const isDiscordCallbackRoute = isDiscordOAuthRedirect(route);

  useEffect(() => {
    // htf-context等の?tf=H4のようなクエリ付きルートでもメタ情報を引けるよう、パス部分だけで引く。
    const [routePath] = route.split('?');
    const meta = ROUTE_META[routePath] ?? DEFAULT_META;
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
    setMeta(
      'meta[property="og:description"]',
      'property=og:description',
      meta.description,
    );
    setMeta('meta[property="og:url"]', 'property=og:url', pageUrl);
    setMeta('meta[name="twitter:title"]', 'name=twitter:title', meta.title);
    setMeta(
      'meta[name="twitter:description"]',
      'name=twitter:description',
      meta.description,
    );
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

  // 直接URLで開いた/リロードした場合、このエントリにまだ深さタグが
  // 付いていなければ0として付与する(戻るボタンを出さない基準点)。
  useEffect(() => {
    if (window.history.state?.wmbDepth === undefined) {
      window.history.replaceState({ wmbDepth: 0 }, '');
    }
  }, []);

  const goBack = () => {
    if (!canGoBack) return;
    window.history.back();
  };

  useEffect(() => {
    const handleHashChange = () => {
      const prevRoute = currentRouteRef.current;
      const nextRoute = getRoute();
      scrollPositionsRef.current.set(prevRoute, window.scrollY);

      setRoute(nextRoute);
      currentRouteRef.current = nextRoute;

      const state = window.history.state as WmbHistoryState;
      const isRestoringTaggedEntry = state !== null && typeof state.wmbDepth === 'number';

      if (isRestoringTaggedEntry) {
        // ブラウザの戻る/進むで既存エントリへ移動した。
        historyDepthRef.current = state.wmbDepth;
      } else {
        // 新規のフォワードナビゲーション(リンククリック等)。深さを1つ進めて
        // このエントリにタグ付けする。
        historyDepthRef.current += 1;
        window.history.replaceState({ wmbDepth: historyDepthRef.current }, '');
      }
      setCanGoBack(historyDepthRef.current > 0);

      setShowMissionReturn(
        window.sessionStorage.getItem(MISSION_RETURN_STORAGE_KEY) === '1' &&
          nextRoute !== 'tools/daily-mission',
      );

      const savedY = scrollPositionsRef.current.get(nextRoute);
      if (isRestoringTaggedEntry && typeof savedY === 'number') {
        // 戻る/進むで既に訪れたルートに戻った: 保存していたスクロール位置を
        // 復元する。key={route}によるDOM再構築後に反映されるよう次フレームで実行。
        requestAnimationFrame(() => window.scrollTo({ top: savedY, behavior: 'auto' }));
      } else {
        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
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
        <AnnouncementBar />
        <div key={route} className="animate-fade-in">
          {isAdminRoute ? (
            <AdminPage auth={discordAuth} />
          ) : isLoginRoute || isDiscordCallbackRoute ? (
            <LoginPage auth={discordAuth} isCallbackRoute={isDiscordCallbackRoute} />
          ) : isAnyaAiRoute ? (
            <AnyaAiGuidePage />
          ) : isLinkHubRoute ? (
            <LinkHubPage prices={prices} />
          ) : isMatomeRoute ? (
            <MatomePage />
          ) : matomeArchiveYm ? (
            <MatomeArchivePage ym={matomeArchiveYm} />
          ) : matomeEntryId ? (
            <MatomeEntryPage entryId={matomeEntryId} />
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
        {canGoBack && !isHomeRoute && !showMissionReturn && (
          <button
            onClick={goBack}
            style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            className="fixed left-4 z-[60] inline-flex min-h-11 items-center justify-center rounded-full bg-slate-700 px-5 text-sm font-black text-white shadow-[0_16px_50px_rgba(0,0,0,0.4)] transition hover:bg-slate-600 animate-slide-up"
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
            style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            className="fixed left-4 z-[60] inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-black text-slate-950 shadow-[0_16px_50px_rgba(34,211,238,0.22)] transition hover:bg-cyan-200"
          >
            ミッションに戻る
          </a>
        )}
        {/* 右下の浮遊UIをまとめて1つのスタックにする(トースト通知とあにゃAIが
            同じ角に重なっていたのを解消)。トーストが上、あにゃAIが一番下。 */}
        <div
          className="fixed inset-x-4 z-40 flex flex-col items-end gap-3"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <AlertToasts
            notifications={notifications}
            dismissNotification={dismissNotification}
          />
          <AnyaAiAssistant />
        </div>
      </div>
    </FavoritesContext.Provider>
  );
};
